#!/bin/bash

# GittiomAI Chat API - Deno Deploy Script
# This script helps deploy your chat API to Deno Deploy

echo "🚀 GittiomAI Chat API - Deno Deploy"
echo "=================================="

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Installing..."
    
    # Detect OS and install Deno
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        powershell -c "irm https://deno.land/install.ps1 | iex"
    else
        # macOS/Linux
        curl -fsSL https://deno.land/install.sh | sh
        export PATH="$HOME/.deno/bin:$PATH"
    fi
    
    echo "✅ Deno installed successfully!"
fi

echo ""
echo "📋 Deployment Options:"
echo "1. Deploy to Deno Deploy (requires Deno CLI login)"
echo "2. Run locally for testing"
echo "3. Show deployment instructions"

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔐 Please login to Deno Deploy first:"
        echo "Visit: https://dash.deno.com/"
        echo ""
        read -p "Enter your project name: " project_name
        
        if [ -z "$project_name" ]; then
            echo "❌ Project name is required"
            exit 1
        fi
        
        echo "🚀 Deploying to Deno Deploy..."
        deno deploy --project="$project_name" main.ts
        
        echo ""
        echo "✅ Deployment complete!"
        echo "🌐 Your API is available at: https://$project_name.deno.dev"
        echo "📊 Health check: https://$project_name.deno.dev/api/health"
        ;;
        
    2)
        echo ""
        echo "🧪 Running locally..."
        echo "📝 Make sure to set your environment variables first!"
        echo ""
        deno run --allow-net --allow-env --watch main.ts
        ;;
        
    3)
        echo ""
        echo "📖 Deployment Instructions:"
        echo ""
        echo "Method 1 - GitHub (Recommended):"
        echo "1. Push this code to GitHub"
        echo "2. Go to https://dash.deno.com/"
        echo "3. Create new project from GitHub"
        echo "4. Set entry point: main.ts"
        echo "5. Add environment variables"
        echo ""
        echo "Method 2 - Direct Deploy:"
        echo "1. deno deploy --project=your-project-name main.ts"
        echo ""
        echo "Environment Variables needed:"
        echo "- SUPABASE_URL"
        echo "- SUPABASE_SERVICE_ROLE_KEY"
        echo "- GEMINI_API_KEY"
        ;;
        
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac 