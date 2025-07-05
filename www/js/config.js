// VIB3 Configuration - MongoDB/Backend version
// App configuration
const appConfig = {
    name: 'VIB3',
    version: '1.0.0',
    debug: true, // Set to false in production
    maxVideoSize: 500 * 1024 * 1024, // 500MB for 4K videos
    supportedVideoFormats: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
    videoCompressionQuality: 0.8,
    maxVideoDuration: 180, // 3 minutes in seconds
    defaultUserAvatar: '👤',
    feedPageSize: 10,
    infiniteScrollThreshold: 0.1,
    videoIntersectionThreshold: 0.7,
    keyboardShortcutsEnabled: true,
    
    // Backend API configuration
    apiUrl: window.location.origin + '/api',
    uploadUrl: window.location.origin + '/api/upload',
    authUrl: window.location.origin + '/api/auth'
};

// Make configuration globally available
window.appConfig = appConfig;