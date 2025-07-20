const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

/**
 * Multi-quality video encoder for TikTok-like adaptive streaming
 */
class MultiQualityEncoder {
    constructor() {
        // Quality presets optimized for social media
        this.qualityPresets = [
            {
                name: '4k',
                height: 2160,
                bitrate: '8000k',
                crf: 22,
                maxWidth: 3840,
                condition: (metadata) => metadata.height >= 2160 // Only if source is 4K
            },
            {
                name: '1080p',
                height: 1080,
                bitrate: '3500k',
                crf: 23,
                maxWidth: 1920,
                condition: (metadata) => metadata.height >= 1080
            },
            {
                name: '720p',
                height: 720,
                bitrate: '1500k',
                crf: 24,
                maxWidth: 1280,
                condition: () => true // Always generate
            },
            {
                name: '480p',
                height: 480,
                bitrate: '800k',
                crf: 26,
                maxWidth: 854,
                condition: () => true // Always generate
            },
            {
                name: 'preview',
                height: 240,
                bitrate: '300k',
                crf: 30,
                maxWidth: 426,
                condition: () => true // Always generate for instant playback
            }
        ];
    }

    /**
     * Process video into multiple quality variants
     */
    async processVideo(inputPath, outputDir, options = {}) {
        const startTime = Date.now();
        console.log(`🎬 Starting multi-quality encoding for: ${inputPath}`);

        try {
            // Get video metadata
            const metadata = await this.getVideoMetadata(inputPath);
            console.log(`📊 Source video: ${metadata.width}x${metadata.height} @ ${metadata.fps}fps`);

            // Determine which qualities to generate
            const qualitiesToGenerate = this.qualityPresets.filter(preset => 
                preset.condition(metadata)
            );

            console.log(`📐 Will generate ${qualitiesToGenerate.length} quality variants`);

            // Create output directory
            await fs.mkdir(outputDir, { recursive: true });

            // Generate master playlist for HLS
            const variants = [];

            // Process each quality in parallel for speed
            const encodingPromises = qualitiesToGenerate.map(async (preset) => {
                const outputPath = path.join(outputDir, `${preset.name}.mp4`);
                const variant = await this.encodeVariant(inputPath, outputPath, preset, metadata);
                return variant;
            });

            const results = await Promise.all(encodingPromises);
            
            // Calculate space savings
            const sourceSize = (await fs.stat(inputPath)).size;
            let totalSize = 0;
            for (const result of results) {
                if (result.success) {
                    variants.push(result);
                    totalSize += result.size;
                }
            }

            const processingTime = (Date.now() - startTime) / 1000;
            
            return {
                success: true,
                variants,
                sourceSize,
                totalSize,
                spaceSavings: ((sourceSize - totalSize) / sourceSize * 100).toFixed(1),
                processingTime,
                metadata
            };

        } catch (error) {
            console.error('❌ Multi-quality encoding failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Encode a single quality variant
     */
    async encodeVariant(inputPath, outputPath, preset, metadata) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            console.log(`🔄 Encoding ${preset.name} variant...`);

            const command = ffmpeg(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .addOption('-preset', 'faster') // Balance between speed and compression
                .addOption('-crf', preset.crf)
                .addOption('-maxrate', preset.bitrate)
                .addOption('-bufsize', `${parseInt(preset.bitrate) * 2}k`)
                .addOption('-movflags', '+faststart')
                .addOption('-pix_fmt', 'yuv420p')
                .addOption('-profile:v', preset.height <= 480 ? 'baseline' : 'main')
                .addOption('-level', '4.0');

            // Smart scaling - maintain aspect ratio
            const scaleFilter = this.getScaleFilter(metadata, preset);
            if (scaleFilter) {
                command.addOption('-vf', scaleFilter);
            }

            // Optimize for web streaming
            command
                .addOption('-g', Math.floor(metadata.fps * 2)) // GOP size
                .addOption('-sc_threshold', '0') // Disable scene change detection
                .addOption('-b:a', preset.height <= 480 ? '96k' : '128k');

            // Add 4K-specific optimizations
            if (preset.height >= 2160) {
                command
                    .addOption('-preset', 'medium') // Better compression for 4K
                    .addOption('-tune', 'film') // Better quality for high resolution
                    .addOption('-x264-params', 'ref=4:bframes=4:b-adapt=2');
            }

            command
                .on('start', (cmd) => {
                    console.log(`🚀 FFmpeg command for ${preset.name}:`, cmd);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r⏳ ${preset.name}: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', async () => {
                    process.stdout.write('\n');
                    const stats = await fs.stat(outputPath);
                    const duration = (Date.now() - startTime) / 1000;
                    
                    console.log(`✅ ${preset.name} complete: ${(stats.size / 1024 / 1024).toFixed(1)}MB in ${duration.toFixed(1)}s`);
                    
                    resolve({
                        success: true,
                        preset: preset.name,
                        path: outputPath,
                        size: stats.size,
                        duration,
                        width: preset.maxWidth,
                        height: preset.height,
                        bitrate: preset.bitrate
                    });
                })
                .on('error', (err) => {
                    console.error(`❌ ${preset.name} encoding failed:`, err.message);
                    resolve({
                        success: false,
                        preset: preset.name,
                        error: err.message
                    });
                })
                .save(outputPath);
        });
    }

    /**
     * Get smart scale filter
     */
    getScaleFilter(metadata, preset) {
        // Don't scale if source is smaller than target
        if (metadata.height <= preset.height) {
            return null;
        }

        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = metadata.width / metadata.height;
        let targetWidth = Math.round(preset.height * aspectRatio);
        
        // Ensure even dimensions (required for H.264)
        targetWidth = Math.floor(targetWidth / 2) * 2;
        const targetHeight = Math.floor(preset.height / 2) * 2;

        // Advanced scaling with lanczos algorithm for better quality
        return `scale=${targetWidth}:${targetHeight}:flags=lanczos+accurate_rnd`;
    }

    /**
     * Get video metadata
     */
    getVideoMetadata(inputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                if (!videoStream) {
                    reject(new Error('No video stream found'));
                    return;
                }

                resolve({
                    width: videoStream.width,
                    height: videoStream.height,
                    fps: eval(videoStream.r_frame_rate),
                    duration: metadata.format.duration,
                    bitrate: metadata.format.bit_rate,
                    codec: videoStream.codec_name,
                    size: metadata.format.size
                });
            });
        });
    }

    /**
     * Generate adaptive streaming manifest
     */
    async generateManifest(outputDir, variants) {
        const manifest = {
            version: '1.0',
            created: new Date().toISOString(),
            variants: variants
                .filter(v => v.success)
                .map(v => ({
                    quality: v.preset,
                    width: v.width,
                    height: v.height,
                    bitrate: v.bitrate,
                    size: v.size,
                    url: path.basename(v.path)
                }))
                .sort((a, b) => b.height - a.height)
        };

        const manifestPath = path.join(outputDir, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`📄 Manifest generated at: ${manifestPath}`);
        
        return manifest;
    }
}

module.exports = MultiQualityEncoder;