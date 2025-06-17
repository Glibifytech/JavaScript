# Gittiomai API

Backend API service for the Gittiomai application, providing AI-powered text and image generation capabilities.

## Features

- Text generation via OpenRouter API
- Image generation via Stability AI 
- JWT authentication via Supabase
- Conversation storage and management

## Deployment

This project is configured for deployment on Railway.app.

### Environment Variables

The following environment variables are required:

```
# API Keys
OPENROUTER_API_KEY=your-openrouter-key
STABILITY_API_KEY=your-stability-key

# Server Config
PORT=5000

# Supabase Config
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# CORS Settings
ALLOWED_ORIGINS=*

# Logging
LOG_LEVEL=INFO
```

## Local Development

1. Clone the repository
2. Create a `.env` file with the required variables (see `.env.example`)
3. Install dependencies: `pip install -r requirements.txt`
4. Run the server: `python main.py`

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/models` - Get available models for text and image generation
- `POST /api/chat` - Generate text responses
- `POST /api/images` - Generate images

## Authentication

All API endpoints (except health check) require a valid Supabase JWT token 
in the Authorization header: 