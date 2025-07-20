// Video Processing Configuration
// Centralizes all video-related settings to prevent breaking when modifying server.js

module.exports = {
    // Quality presets for multi-resolution encoding
    QUALITY_PRESETS: [
        {
            name: '4k',
            height: 2160,
            videoBitrate: '8000k',
            h264_crf: 22,
            h265_crf: 24,
            audioBitrate: '192k',
            condition: (metadata) => metadata.video && metadata.video.height >= 2160
        },
        {
            name: '1080p',
            height: 1080,
            videoBitrate: '4000k',
            h264_crf: 23,
            h265_crf: 25,
            audioBitrate: '128k',
            condition: (metadata) => metadata.video && metadata.video.height >= 1080
        },
        {
            name: '720p',
            height: 720,
            videoBitrate: '2000k',
            h264_crf: 23,
            h265_crf: 25,
            audioBitrate: '128k',
            condition: () => true // Always generate
        },
        {
            name: '480p',
            height: 480,
            videoBitrate: '1000k',
            h264_crf: 24,
            h265_crf: 26,
            audioBitrate: '96k',
            condition: () => true // Always generate
        },
        {
            name: '360p',
            height: 360,
            videoBitrate: '600k',
            h264_crf: 25,
            h265_crf: 27,
            audioBitrate: '64k',
            condition: () => true // For slow connections
        }
    ],

    // Video format support
    SUPPORTED_FORMATS: {
        input: [
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
            'video/3gpp', 'video/x-flv', 'video/x-ms-wmv', 'video/x-msvideo',
            'video/avi', 'video/mov', 'video/mkv', 'video/x-matroska'
        ],
        output: {
            default: 'mp4',
            mime: 'video/mp4'
        }
    },

    // Upload limits
    UPLOAD_LIMITS: {
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxDuration: 180, // 3 minutes in seconds
        minDuration: 3, // 3 seconds minimum
    },

    // Processing settings
    PROCESSING: {
        // Enable multi-quality by default for videos >= this resolution
        autoMultiQualityThreshold: 1080,
        
        // Codec settings
        codecs: {
            h264: {
                preset: 'faster',
                profile: 'main',
                level: '4.1'
            },
            h265: {
                preset: 'medium',
                tag: 'hvc1', // Apple compatibility
                params: 'keyint=48:min-keyint=48:no-scenecut'
            }
        },
        
        // Processing timeouts
        timeouts: {
            validation: 30000, // 30 seconds
            conversion: 300000, // 5 minutes
            multiQuality: 600000 // 10 minutes
        }
    },

    // Storage paths
    STORAGE: {
        tempDir: 'temp',
        uploadsDir: 'uploads',
        variantsSubdir: 'variants',
        manifestFilename: 'manifest.json'
    },

    // FFmpeg optimization settings
    FFMPEG: {
        // Number of threads (0 = auto-detect)
        threads: 0,
        
        // Hardware acceleration (when available)
        hwAccel: {
            enabled: false,
            type: 'auto' // auto, vaapi, nvenc, videotoolbox
        },
        
        // Memory limits
        maxMemory: '2G'
    },

    // Quality selection defaults (for client)
    QUALITY_SELECTION: {
        wifi: '1080p',
        '5g': '1080p',
        '4g': '720p',
        '3g': '480p',
        'slow': '360p',
        'unknown': '360p'
    },

    // Feature flags
    FEATURES: {
        multiQuality: process.env.ENABLE_MULTI_QUALITY === 'true' || false,
        thumbnailGeneration: true,
        videoValidation: true,
        adaptiveStreaming: true,
        h265Support: true
    }
};