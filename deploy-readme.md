# 🚀 GittiomAI Chat API - Deno Deploy

A powerful AI chat API with conversation memory, built for Deno Deploy.

## ✨ Features

- 🤖 **AI Chat with Memory** - Full conversation history like ChatGPT
- 🔐 **Supabase Authentication** - Secure user management
- 💾 **Persistent Storage** - All conversations saved to database
- 🌐 **CORS Enabled** - Works with any frontend
- ⚡ **Fast & Scalable** - Powered by Deno Deploy

## 🛠️ API Endpoints

- `GET /api/health` - Health check
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/{id}/messages` - Get conversation messages
- `POST /api/chat` - Send chat message
- `DELETE /api/conversations/{id}` - Delete conversation
- `GET /api/models` - Get available AI models

## 🚀 Deploy to Deno Deploy

### Method 1: Deploy from GitHub (Recommended)

1. **Push this code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Go to [Deno Deploy](https://dash.deno.com/)**

3. **Create New Project:**
   - Click "New Project"
   - Connect your GitHub account
   - Select your repository
   - Set entry point: `main.ts`
   - Enable automatic deployments

4. **Set Environment Variables:**
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Method 2: Deploy with Deno CLI

1. **Install Deno CLI:**
   ```bash
   # Windows (PowerShell)
   irm https://deno.land/install.ps1 | iex
   
   # macOS/Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Deploy directly:**
   ```bash
   deno deploy --project=your-project-name main.ts
   ```

## 🧪 Local Development

1. **Install Deno** (if not already installed)

2. **Set environment variables:**
   Create `.env` file:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run locally:**
   ```bash
   deno task dev
   # or
   deno run --allow-net --allow-env --watch main.ts
   ```

4. **Test the API:**
   ```bash
   curl http://localhost:8000/api/health
   ```

## 📱 Flutter App Configuration

Update your Flutter app's API service to use the Deno Deploy URL:

```dart
// In your api_service.dart
static const String baseUrl = 'https://your-project-name.deno.dev';
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not anon key!) | ✅ |
| `GEMINI_API_KEY` | Google AI Studio API key | ✅ |

## 🏗️ Database Setup

Make sure your Supabase database has the required tables. Run this SQL:

```sql
-- See frontend/gittiomai/supabase/chat_history_tables.sql
-- for complete database schema
```

## 🌟 Why Deno Deploy?

- ✅ **No Docker needed** - Deploy TypeScript directly
- ✅ **Global CDN** - Fast worldwide performance  
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **GitHub integration** - Automatic deployments
- ✅ **Free tier** - Great for development
- ✅ **TypeScript native** - No build step required

## 🔗 Links

- [Deno Deploy Dashboard](https://dash.deno.com/)
- [Deno Documentation](https://deno.land/manual)
- [Supabase Docs](https://supabase.com/docs)
- [Google AI Studio](https://makersuite.google.com/)

---

**Ready to deploy!** 🚀 Your AI chat app will have full conversation memory just like ChatGPT! 