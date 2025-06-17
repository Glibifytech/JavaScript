import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

// Initialize services
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Helper function to verify authentication
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }
  
  return user;
}

// Helper function to get or create conversation
async function getOrCreateConversation(userId: string, conversationId?: string, title = 'New Chat') {
  if (conversationId) {
    // Get existing conversation
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
  
  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
  
  return data;
}

// Helper function to get conversation history
async function getConversationHistory(conversationId: string, limit = 20) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
  
  return data || [];
}

// Helper function to save message
async function saveMessage(conversationId: string, role: string, content: string) {
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
    throw new Error(`Failed to save message: ${error.message}`);
  }
  
  return data;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
};

// Main request handler
async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Health check endpoint
    if (pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Deno Deploy API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get user's conversations
    if (pathname === '/api/conversations' && request.method === 'GET') {
      const user = await verifyAuth(request);
      
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return new Response(JSON.stringify({ conversations: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get conversation messages
    if (pathname.startsWith('/api/conversations/') && pathname.endsWith('/messages') && request.method === 'GET') {
      const user = await verifyAuth(request);
      const pathParts = pathname.split('/');
      const conversationId = pathParts[3]; // /api/conversations/{id}/messages
      
      // Verify conversation belongs to user
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      
      if (convError || !conversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const messages = await getConversationHistory(conversationId, 100);
      return new Response(JSON.stringify({ messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Chat endpoint
    if (pathname === '/api/chat' && request.method === 'POST') {
      const user = await verifyAuth(request);
      const body = await request.json();
      const { prompt, conversation_id, model_name = 'gemini-2.0-flash-exp' } = body;
      
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Missing required parameter: prompt' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`Chat request from user ${user.id}: ${prompt.substring(0, 50)}...`);
      
      // Get or create conversation
      const conversation = await getOrCreateConversation(
        user.id,
        conversation_id,
        prompt.substring(0, 50) + '...'
      );
      
      // Get conversation history for context BEFORE adding new message
      const history = await getConversationHistory(conversation.id);
      
      // Save user message to database
      await saveMessage(conversation.id, 'user', prompt);
      
      // Build context messages for Gemini
      const contextMessages: string[] = [];
      
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
      let fullContext: string;
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
      
      return new Response(JSON.stringify({
        content: aiResponse,
        conversation_id: conversation.id,
        model_used: model_name
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Delete conversation
    if (pathname.startsWith('/api/conversations/') && request.method === 'DELETE') {
      const user = await verifyAuth(request);
      const pathParts = pathname.split('/');
      const conversationId = pathParts[3]; // /api/conversations/{id}
      
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      return new Response(JSON.stringify({ message: 'Conversation deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get available models
    if (pathname === '/api/models' && request.method === 'GET') {
      return new Response(JSON.stringify({
        text_models: [
          { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
        ],
        default_model: 'gemini-2.0-flash-exp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 404 handler
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    if (error.message.includes('Missing or invalid authorization') || error.message.includes('Invalid token')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Start the server
serve(handler, { port: 8000 });

console.log('🚀 Deno Deploy API running on http://localhost:8000');
console.log('📊 Health check: http://localhost:8000/api/health');
console.log('🤖 Chat endpoint: http://localhost:8000/api/chat'); 