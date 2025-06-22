const https = require('https');

// Production server URL - adjust if different
const PRODUCTION_URL = 'https://vib3.app'; // Update this to your actual production URL

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: PRODUCTION_URL.replace('https://', '').replace('http://', ''),
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'VIB3-Inspector/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

async function inspectProductionAPI() {
    console.log('🔍 Inspecting VIB3 Production API...\n');
    
    try {
        // Check health status
        console.log('📊 Checking server health...');
        const health = await makeRequest('/api/health');
        console.log('Server Status:', health.status);
        console.log('Database:', health.database);
        console.log('Storage:', health.storage);
        console.log('Memory Usage:', health.memory);
        console.log('Uptime:', Math.round(health.uptime / 60), 'minutes\n');
        
        // Check database test endpoint
        console.log('🗄️ Checking database connection...');
        const dbTest = await makeRequest('/api/database/test');
        console.log('Database Connected:', dbTest.connected);
        console.log('Database Name:', dbTest.database);
        console.log('Collections:', dbTest.collections ? dbTest.collections.join(', ') : 'N/A');
        console.log('\n');
        
        // Get videos from different feeds
        const feeds = ['foryou', 'explore', 'following', 'friends'];
        
        for (const feed of feeds) {
            console.log(`\n📹 Checking ${feed.toUpperCase()} feed videos...`);
            console.log('='.repeat(40));
            
            try {
                const response = await makeRequest(`/api/videos?feed=${feed}&limit=10&page=1`);
                const videos = response.videos || [];
                
                console.log(`Found ${videos.length} videos in ${feed} feed\n`);
                
                if (videos.length > 0) {
                    videos.forEach((video, index) => {
                        console.log(`${index + 1}. Video Details:`);
                        console.log(`   ID: ${video._id}`);
                        console.log(`   Title: ${video.title || 'No title'}`);
                        console.log(`   Description: ${video.description || 'No description'}`);
                        console.log(`   URL: ${video.videoUrl || 'No URL'}`);
                        console.log(`   Username: ${video.username || 'anonymous'}`);
                        console.log(`   Duplicated: ${video.duplicated ? 'Yes' : 'No'}`);
                        console.log(`   Feed Type: ${video.feedType || 'unknown'}`);
                        console.log(`   Position: ${video.position || 'N/A'}`);
                        
                        // Check for test video indicators
                        const isTest = checkIfTestVideo(video);
                        if (isTest) {
                            console.log('   ⚠️  APPEARS TO BE A TEST VIDEO');
                            console.log(`   Reasons: ${isTest.join(', ')}`);
                        }
                        
                        // Check URL accessibility
                        if (video.videoUrl) {
                            if (video.videoUrl.includes('vib3-videos.nyc3.digitaloceanspaces.com')) {
                                console.log('   ✅ DigitalOcean Spaces URL');
                            } else if (video.videoUrl.includes('sample') || video.videoUrl.includes('test')) {
                                console.log('   ❌ Suspicious URL pattern (likely 403)');
                            } else if (!video.videoUrl.startsWith('http')) {
                                console.log('   ❌ Invalid URL format');
                            }
                        } else {
                            console.log('   ❌ No video URL');
                        }
                        
                        console.log('');
                    });
                }
            } catch (feedError) {
                console.log(`Error fetching ${feed} feed:`, feedError.message);
            }
        }
        
        // Get general video feed (no specific algorithm)
        console.log('\n📹 Checking general video feed...');
        console.log('='.repeat(40));
        
        const generalVideos = await makeRequest('/api/videos?limit=20');
        const videos = generalVideos.videos || [];
        
        // Analyze video patterns
        console.log(`\nTotal videos in general feed: ${videos.length}`);
        
        const urlPatterns = {};
        const testVideos = [];
        const brokenVideos = [];
        
        videos.forEach(video => {
            // Track URL patterns
            if (video.videoUrl) {
                try {
                    const url = new URL(video.videoUrl);
                    const domain = url.hostname;
                    urlPatterns[domain] = (urlPatterns[domain] || 0) + 1;
                    
                    // Check for broken/test patterns
                    if (url.pathname.includes('sample') || 
                        url.pathname.includes('test') ||
                        url.hostname.includes('example.com')) {
                        brokenVideos.push(video);
                    }
                } catch (e) {
                    urlPatterns['invalid'] = (urlPatterns['invalid'] || 0) + 1;
                    brokenVideos.push(video);
                }
            } else {
                urlPatterns['no-url'] = (urlPatterns['no-url'] || 0) + 1;
                brokenVideos.push(video);
            }
            
            // Check for test videos
            const testReasons = checkIfTestVideo(video);
            if (testReasons) {
                testVideos.push({ video, reasons: testReasons });
            }
        });
        
        console.log('\n📊 URL Domain Analysis:');
        Object.entries(urlPatterns).forEach(([domain, count]) => {
            console.log(`   ${domain}: ${count} videos`);
        });
        
        if (testVideos.length > 0) {
            console.log(`\n⚠️  Found ${testVideos.length} potential TEST videos:`);
            testVideos.forEach(({ video, reasons }) => {
                console.log(`   - "${video.title || 'Untitled'}" (ID: ${video._id})`);
                console.log(`     URL: ${video.videoUrl || 'No URL'}`);
                console.log(`     Reasons: ${reasons.join(', ')}`);
            });
        }
        
        if (brokenVideos.length > 0) {
            console.log(`\n❌ Found ${brokenVideos.length} potentially BROKEN videos (may cause 403 errors):`);
            brokenVideos.forEach(video => {
                console.log(`   - "${video.title || 'Untitled'}" (ID: ${video._id})`);
                console.log(`     URL: ${video.videoUrl || 'No URL'}`);
            });
        }
        
        // Check cleanup status
        console.log('\n🧹 Checking cleanup status...');
        try {
            const cleanupStatus = await makeRequest('/api/admin/cleanup/status');
            console.log('Database counts:', cleanupStatus.statistics.database);
            console.log('Storage counts:', cleanupStatus.statistics.storage);
        } catch (e) {
            console.log('Could not fetch cleanup status (may require admin access)');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function checkIfTestVideo(video) {
    const reasons = [];
    
    // Check title
    if (video.title) {
        const titleLower = video.title.toLowerCase();
        if (titleLower.includes('test')) reasons.push('title contains "test"');
        if (titleLower.includes('sample')) reasons.push('title contains "sample"');
        if (titleLower.includes('demo')) reasons.push('title contains "demo"');
        if (titleLower.includes('trending video #')) reasons.push('generic trending title');
        if (titleLower.includes('viral trending #')) reasons.push('generic viral title');
    }
    
    // Check description
    if (video.description) {
        const descLower = video.description.toLowerCase();
        if (descLower.includes('test')) reasons.push('description contains "test"');
        if (descLower.includes('sample')) reasons.push('description contains "sample"');
        if (descLower.includes('demo')) reasons.push('description contains "demo"');
        if (descLower.includes('lorem ipsum')) reasons.push('lorem ipsum text');
    }
    
    // Check URL
    if (video.videoUrl) {
        const urlLower = video.videoUrl.toLowerCase();
        if (urlLower.includes('sample')) reasons.push('URL contains "sample"');
        if (urlLower.includes('test')) reasons.push('URL contains "test"');
        if (urlLower.includes('demo')) reasons.push('URL contains "demo"');
        if (urlLower.includes('example.com')) reasons.push('example.com domain');
        if (urlLower.includes('placeholder')) reasons.push('placeholder URL');
        if (!urlLower.startsWith('http')) reasons.push('invalid URL format');
    } else {
        reasons.push('no video URL');
    }
    
    // Check for generated IDs
    if (video._id && video._id.includes('_gen_')) {
        reasons.push('generated/duplicated video ID');
    }
    
    return reasons.length > 0 ? reasons : null;
}

// Run the inspection
console.log('Note: Update PRODUCTION_URL in this script to your actual production URL\n');
inspectProductionAPI();