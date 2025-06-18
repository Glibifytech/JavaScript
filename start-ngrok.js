const ngrok = require('@ngrok/ngrok');

async function createTunnel() {
    try {
        console.log('🌐 Creating ngrok tunnel for port 3000...');
        
        const listener = await ngrok.forward({ 
            addr: 3000, 
            authtoken_from_env: true 
        });
        
        const publicUrl = listener.url();
        console.log(`✅ Ngrok tunnel established!`);
        console.log(`🌍 Public URL: ${publicUrl}`);
        console.log(`📱 Use this URL in your Flutter app: ${publicUrl}`);
        console.log(`🔗 Health check: ${publicUrl}/api/health`);
        console.log(`💬 Chat endpoint: ${publicUrl}/api/chat`);
        console.log('\n📋 Copy this URL to your Flutter app configuration:');
        console.log(`${publicUrl}`);
        
        // Keep the tunnel alive
        console.log('\n🔄 Tunnel is active. Press Ctrl+C to stop.');
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down ngrok tunnel...');
            try {
                await listener.close();
                console.log('✅ Ngrok tunnel closed');
            } catch (error) {
                console.error('Error closing ngrok tunnel:', error);
            }
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to create ngrok tunnel:', error);
        console.log('💡 Make sure you have set NGROK_AUTHTOKEN environment variable');
        console.log('💡 Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken');
        process.exit(1);
    }
}

createTunnel(); 