const axios = require('axios');

const BASE_URL = 'https://vib3-web-75tal.ondigitalocean.app';
const TOKEN = '3b0fced95eabb75b1ffa88bf387b5933a388d0aa60557889134cd123ad252925'; // Replace with actual token

async function testEndpoints() {
    console.log('Testing VIB3 Video API endpoints...\n');
    
    const endpoints = [
        '/api/videos?limit=5&feed=foryou',
        '/api/feed-bypass?limit=5',
        '/api/test-videos?limit=5',
        '/api/debug-shuffle',
        '/api/videos/personalized/685387affa53455d5a791b1b'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\nTesting ${endpoint}...`);
            const response = await axios.get(BASE_URL + endpoint, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                validateStatus: () => true // Accept any status
            });
            
            console.log(`Status: ${response.status}`);
            console.log(`Content-Type: ${response.headers['content-type']}`);
            
            if (response.headers['content-type']?.includes('application/json')) {
                console.log('✅ Returns JSON');
                const data = response.data;
                if (data.videos) {
                    console.log(`Videos found: ${data.videos.length}`);
                    if (data.videos.length > 0) {
                        console.log('First video:', {
                            id: data.videos[0]._id,
                            url: data.videos[0].videoUrl?.substring(0, 50) + '...'
                        });
                    }
                } else {
                    console.log('Response:', JSON.stringify(data, null, 2));
                }
            } else {
                console.log('❌ Returns HTML (should be JSON)');
                console.log('Preview:', response.data.substring(0, 100) + '...');
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
    }
}

testEndpoints();