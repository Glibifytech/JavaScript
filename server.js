const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from env.example (in parent directory)
const envPath = path.join(__dirname, '..', 'env.example');
if (fs.existsSync(envPath)) {
    const envData = fs.readFileSync(envPath, 'utf8');
    const envLines = envData.split('\n');
    
    envLines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=').trim();
            process.env[key.trim()] = value;
        }
    });
    console.log('✅ Loaded environment variables from env.example');
    console.log(`🔑 GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Found' : 'Missing'}`);
    console.log(`🔑 SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Found' : 'Missing'}`);
    console.log(`🔑 SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Found' : 'Missing'}`);
} else {
    console.log('⚠️  env.example not found, using system environment variables');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash'});

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Middleware to verify Supabase auth token
const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid authentication token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Helper function to get or create conversation
const getOrCreateConversation = async (userId, conversationId = null, title = 'New Chat') => {
    try {
        if (conversationId) {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .eq('user_id', userId)
                .single();

            if (!error && data) {
                return data;
            }
        }

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                user_id: userId,
                title: title
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        throw error;
    }
};

// Helper function to get conversation history
const getConversationHistory = async (conversationId, limit = 20) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('role, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            throw error;
        }

        return data || [];
    } catch (error) {
        console.error('Error getting conversation history:', error);
        return [];
    }
};

// Helper function to save message
const saveMessage = async (conversationId, role, content) => {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                role: role,
                content: content
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Node.js API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Get user's conversations
app.get('/api/conversations', verifyAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('id, title, created_at, updated_at')
            .eq('user_id', req.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({ conversations: data || [] });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Get conversation messages
app.get('/api/conversations/:id/messages', verifyAuth, async (req, res) => {
    try {
        const conversationId = req.params.id;
        
        // Verify conversation belongs to user
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .eq('user_id', req.user.id)
            .single();

        if (convError || !conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const messages = await getConversationHistory(conversationId, 100);
        res.json({ messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Chat endpoint with memory
app.post('/api/chat', verifyAuth, async (req, res) => {
    try {
        const { prompt, conversation_id, model_name = 'gemini-1.5-pro' } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Missing required parameter: prompt' });
        }

        console.log(`Chat request from user ${req.user.id}: ${prompt.substring(0, 50)}...`);

        // Get or create conversation
        const conversation = await getOrCreateConversation(
            req.user.id, 
            conversation_id,
            prompt.substring(0, 50) + '...'
        );

        // Get conversation history for context BEFORE adding new message
        const history = await getConversationHistory(conversation.id);

        // Save user message to database
        await saveMessage(conversation.id, 'user', prompt);

        // Build context messages for Gemini
        let contextMessages = [];
        
        // Add previous conversation history
        history.forEach(msg => {
            if (msg.role === 'user') {
                contextMessages.push(`User: ${msg.content}`);
            } else if (msg.role === 'assistant') {
                contextMessages.push(`Assistant: ${msg.content}`);
            }
        });

        // Add current user message to context
        contextMessages.push(`User: ${prompt}`);

        // Create the full context with memory
        let fullContext;
        if (history.length > 0) {
            // If there's conversation history, include it
            const previousMessages = contextMessages.slice(0, -1).join('\n');
            fullContext = `Previous conversation:\n${previousMessages}\n\nCurrent message:\n${prompt}\n\nPlease respond remembering our previous conversation and maintain context.`;
        } else {
            // First message in conversation
            fullContext = prompt;
        }

        console.log(`Context length: ${history.length + 1} messages (${history.length} previous + 1 current)`);
        console.log(`Full context preview: ${fullContext.substring(0, 200)}...`);

        // Generate response with Gemini
        const result = await model.generateContent(fullContext);
        const response = await result.response;
        const aiResponse = response.text();

        // Save AI response
        await saveMessage(conversation.id, 'assistant', aiResponse);

        // Update conversation title if it's the first message
        if (history.length === 0) {
            await supabase
                .from('conversations')
                .update({ 
                    title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '') 
                })
                .eq('id', conversation.id);
        }

        res.json({
            content: aiResponse,
            conversation_id: conversation.id,
            model_used: model_name
        });

    } catch (error) {
        console.error('Error in chat endpoint:', error);
        
        if (error.message && error.message.includes('API_KEY')) {
            return res.status(500).json({ 
                error: 'Invalid or missing Gemini API key. Please check your configuration.' 
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate response. Please try again.',
            details: error.message 
        });
    }
});

// Delete conversation
app.delete('/api/conversations/:id', verifyAuth, async (req, res) => {
    try {
        const conversationId = req.params.id;

        // Delete conversation (messages will be deleted by CASCADE)
        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', req.user.id);

        if (error) {
            throw error;
        }

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});

// Get available models
app.get('/api/models', (req, res) => {
    res.json({
        text_models: [
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ],
        default_model: 'gemini-1.5-pro'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Chat endpoint: http://localhost:${PORT}/api/chat`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  WARNING: GEMINI_API_KEY not found');
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.warn('⚠️  WARNING: Supabase credentials not found');
    }
});

module.exports = app; 