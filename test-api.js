const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TOKEN = 'your_supabase_token_here'; // You'll need to get this from your app

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedBody = JSON.parse(body);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: parsedBody
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Test functions
async function testHealthCheck() {
    console.log('🏥 Testing health check...');
    try {
        const response = await makeRequest('/api/health');
        console.log('✅ Health check passed:', response.body);
        return response.statusCode === 200;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

async function testModelsEndpoint() {
    console.log('🤖 Testing models endpoint...');
    try {
        const response = await makeRequest('/api/models');
        console.log('✅ Models endpoint passed:', response.body);
        return response.statusCode === 200;
    } catch (error) {
        console.log('❌ Models endpoint failed:', error.message);
        return false;
    }
}

async function testChatEndpoint() {
    console.log('💬 Testing chat endpoint (without auth - should fail)...');
    try {
        const response = await makeRequest('/api/chat', 'POST', {
            prompt: 'Hello, this is a test message'
        });
        
        if (response.statusCode === 401) {
            console.log('✅ Chat endpoint correctly requires authentication');
            return true;
        } else {
            console.log('❌ Chat endpoint should require authentication');
            return false;
        }
    } catch (error) {
        console.log('❌ Chat endpoint test failed:', error.message);
        return false;
    }
}

async function testChatWithAuth() {
    if (!TEST_TOKEN || TEST_TOKEN === 'your_supabase_token_here') {
        console.log('⚠️  Skipping authenticated chat test - no token provided');
        console.log('   To test with auth, update TEST_TOKEN in this file');
        return true;
    }

    console.log('🔐 Testing chat endpoint with authentication...');
    try {
        const response = await makeRequest('/api/chat', 'POST', {
            prompt: 'Hi, can you remember this conversation?'
        }, TEST_TOKEN);
        
        if (response.statusCode === 200) {
            console.log('✅ Authenticated chat passed:', response.body);
            return true;
        } else {
            console.log('❌ Authenticated chat failed:', response.body);
            return false;
        }
    } catch (error) {
        console.log('❌ Authenticated chat test failed:', error.message);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting API tests...\n');
    
    const tests = [
        testHealthCheck,
        testModelsEndpoint,
        testChatEndpoint,
        testChatWithAuth
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        const result = await test();
        if (result) passed++;
        console.log(''); // Empty line between tests
    }
    
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Your API is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Check the output above for details.');
    }
    
    // Additional setup instructions
    console.log('\n📝 Next Steps:');
    console.log('1. Make sure you have created the database tables by running the SQL file');
    console.log('2. Set up your environment variables in a .env file');
    console.log('3. Get a Supabase auth token from your Flutter app to test authenticated endpoints');
    console.log('4. Update the Flutter app to point to your new Node.js backend');
}

// Handle process exit
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests, makeRequest }; 