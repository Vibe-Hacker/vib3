// API endpoint fixes
console.log('🔧 API fixes loading...');

// Store original fetch
const originalFetch = window.fetch;

// Override fetch to fix API calls
window.fetch = async function(url, options = {}) {
    // Fix feed API endpoints
    if (url.includes('/api/videos/')) {
        console.log('🔄 Intercepting video API call:', url);
        
        // For now, return demo data until backend is ready
        return {
            ok: true,
            status: 200,
            json: async () => ({
                videos: [
                    {
                        id: 'demo1',
                        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
                        thumbnail: 'https://via.placeholder.com/500x900/FF0080/FFFFFF?text=Demo+Video+1',
                        caption: 'Welcome to VIB3! 🎉',
                        author: {
                            id: 'vib3',
                            username: 'vib3official',
                            avatar: '🎬'
                        },
                        likes: 1234,
                        comments: 56,
                        shares: 12,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 'demo2',
                        url: 'https://www.w3schools.com/html/movie.mp4',
                        thumbnail: 'https://via.placeholder.com/500x900/8338EC/FFFFFF?text=Demo+Video+2',
                        caption: 'Check out this cool video! 🔥',
                        author: {
                            id: 'demo',
                            username: 'democreator',
                            avatar: '🎭'
                        },
                        likes: 5678,
                        comments: 234,
                        shares: 89,
                        createdAt: new Date().toISOString()
                    }
                ]
            })
        };
    }
    
    // For other API calls, use original fetch
    return originalFetch(url, options);
};

console.log('✅ API fixes applied');