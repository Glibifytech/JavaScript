# Ngrok Setup for GittioMAI Backend

This guide will help you set up ngrok to create a public URL for your local server, which you can then use in your Flutter app.

## Prerequisites

1. **Ngrok Account**: Sign up for a free account at [ngrok.com](https://ngrok.com)
2. **Authtoken**: Get your authtoken from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)

## Setup Steps

### 1. Set Your Ngrok Authtoken

You need to set your ngrok authtoken as an environment variable. Choose one of these methods:

**Option A: Set in PowerShell (Windows)**
```powershell
$env:NGROK_AUTHTOKEN="YOUR_AUTHTOKEN_HERE"
```

**Option B: Set in Command Prompt (Windows)**
```cmd
set NGROK_AUTHTOKEN=YOUR_AUTHTOKEN_HERE
```

**Option C: Add to your env.example file**
Add this line to your `../env.example` file:
```
NGROK_AUTHTOKEN=YOUR_AUTHTOKEN_HERE
```

### 2. Start Your Server with Ngrok

You have two options:

**Option A: Use the combined server (Recommended)**
```bash
cd railway-upload
node server-ngrok.js
```

**Option B: Run server and ngrok separately**

Terminal 1 - Start the server:
```bash
cd railway-upload
node server.js
```

Terminal 2 - Start ngrok tunnel:
```bash
cd railway-upload
node start-ngrok.js
```

### 3. Get Your Public URL

When you start the server with ngrok, you'll see output like this:

```
🚀 Server running on http://localhost:3000
🌐 Creating ngrok tunnel...
✅ Ngrok tunnel established!
🌍 Public URL: https://abc123.ngrok-free.app
📱 Use this URL in your Flutter app: https://abc123.ngrok-free.app
🔗 Health check: https://abc123.ngrok-free.app/api/health
💬 Chat endpoint: https://abc123.ngrok-free.app/api/chat
```

### 4. Update Your Flutter App

Copy the public URL (e.g., `https://abc123.ngrok-free.app`) and update your Flutter app's API configuration to use this URL instead of `localhost:3000` or your local IP.

### 5. Test the Connection

Open your browser and visit:
- Health check: `https://your-ngrok-url.ngrok-free.app/api/health`

You should see a JSON response indicating the server is running.

## Important Notes

- **Free Tier Limitations**: Ngrok free tier has some limitations like session timeouts
- **URL Changes**: Each time you restart ngrok, you'll get a new URL
- **Keep Running**: Keep the terminal with ngrok running while testing your Flutter app
- **Firewall**: Make sure your local server (port 3000) is not blocked by firewall

## Troubleshooting

### "authtoken required" error
Make sure you've set the NGROK_AUTHTOKEN environment variable correctly.

### "tunnel session failed" error
Check your internet connection and try restarting ngrok.

### Flutter app can't connect
1. Make sure you're using the correct ngrok URL (not localhost)
2. Check that the server is running on port 3000
3. Verify the health check endpoint works in your browser

## Benefits of Ngrok

✅ **No hosting costs** - Use your local server with a public URL  
✅ **Real device testing** - Test on physical devices without network configuration  
✅ **HTTPS included** - Ngrok provides HTTPS by default  
✅ **Easy setup** - No complex server deployment needed  

## Next Steps

Once ngrok is working:
1. Update your Flutter app's API base URL
2. Test all endpoints (health, chat, conversations)
3. Deploy to app stores when ready

Your Flutter app will now be able to connect to your local server through the ngrok tunnel! 