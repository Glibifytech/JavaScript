# Node.js Backend Setup Instructions

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd railway-upload
npm install
```

### Step 2: Set Up Environment Variables

1. Copy `env-example.txt` to `.env`
2. Fill in your credentials:

```env
# Google Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY=your_actual_gemini_api_key

# Supabase credentials (from your Supabase dashboard)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server port
PORT=3000
```

### Step 3: Set Up Database Tables

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL from `../frontend/gittiomai/supabase/chat_history_tables.sql`

### Step 4: Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### Step 5: Test the API

```bash
npm test
```

## 🎯 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/models` - Available AI models

### Authenticated Endpoints (require Bearer token)
- `POST /api/chat` - Chat with AI (with memory)
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/:id/messages` - Get conversation messages

## 🧠 Chat Memory Feature

The chat endpoint now remembers previous conversations:

```javascript
// Example request
POST /api/chat
Authorization: Bearer your_supabase_token
{
  "prompt": "What did I ask you earlier?",
  "conversation_id": "optional-existing-conversation-id"
}
```

The AI will remember:
- Previous messages in the same conversation
- Context from earlier in the chat
- User preferences mentioned before

## 🔧 Troubleshooting

### Common Issues:

1. **404 Errors**: Make sure server is running on correct port
2. **Auth Errors**: Check your Supabase token is valid
3. **Gemini Errors**: Verify your API key is correct
4. **Database Errors**: Ensure tables are created properly

### Debug Mode:
Set `NODE_ENV=development` in your `.env` file for detailed logs.

## 📱 Update Flutter App

Update your Flutter app to use the new Node.js backend:

```dart
// Change your API base URL to:
const String apiUrl = 'http://localhost:3000'; // For local testing
// Or your deployed URL for production
```

## 🚀 Deploy to Production

Once tested locally, you can deploy to:
- **Supabase Edge Functions** (recommended, free)
- **Vercel** (free tier)
- **Railway** (when subscription renews)
- **Heroku** (free tier)

## 🔥 Features Included

✅ **Chat Memory** - AI remembers previous conversations  
✅ **User Authentication** - Secure with Supabase Auth  
✅ **Conversation Management** - Save/load chat history  
✅ **Google Gemini Integration** - Latest AI model  
✅ **Error Handling** - Proper error responses  
✅ **CORS Support** - Works with Flutter app  
✅ **Health Checks** - Monitor server status 