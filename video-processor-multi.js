// Multi-Quality Video Processing Module for VIB3
// Generates multiple resolutions with H.264 and H.265 codecs

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const VideoProcessor = require('./video-processor');
const videoConfig = require('./config/video-config');

class MultiQualityVideoProcessor extends VideoProcessor {
    constructor() {
        super();
        this.qualityPresets = videoConfig.QUALITY_PRESETS;
    }

    // Process video into multiple quality variants
    async processMultiQuality(inputBuffer, originalFilename, userId) {
        const startTime = Date.now();
        const tempId = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(this.tempDir, `input_${tempId}${path.extname(originalFilename)}`);
        
        try {
            console.log('🎬 Starting multi-quality processing for:', originalFilename);
            
            // Write input buffer to temporary file
            fs.writeFileSync(inputPath, inputBuffer);
            
            // Get video metadata
            const metadata = await this.getVideoInfo(inputPath);
            console.log(`📊 Source: ${metadata.video.width}x${metadata.video.height} @ ${metadata.video.fps}fps`);
            
            // Create output directory
            const outputDir = path.join('uploads', 'videos', userId, tempId);
            fs.mkdirSync(outputDir, { recursive: true });
            
            // Determine which qualities to generate
            const qualitiesToGenerate = this.qualityPresets.filter(preset => 
                preset.condition(metadata)
            );
            
            console.log(`📐 Generating ${qualitiesToGenerate.length} quality variants`);
            
            // Process all variants in parallel
            const processingPromises = [];
            
            // H.264 variants (universal compatibility)
            for (const preset of qualitiesToGenerate) {
                processingPromises.push(
                    this.encodeVariant(inputPath, outputDir, preset, 'h264', metadata)
                );
            }
            
            // H.265 variants for high quality (1080p and above)
            if (metadata.video.height >= 1080) {
                const h265Presets = qualitiesToGenerate.filter(p => p.height >= 720);
                for (const preset of h265Presets) {
                    processingPromises.push(
                        this.encodeVariant(inputPath, outputDir, preset, 'h265', metadata)
                    );
                }
            }
            
            const results = await Promise.all(processingPromises);
            const successfulVariants = results.filter(r => r.success);
            
            // Generate manifest for adaptive streaming
            const manifest = await this.generateManifest(outputDir, successfulVariants);
            
            // Calculate space savings
            const sourceSize = inputBuffer.length;
            const totalSize = successfulVariants.reduce((sum, v) => sum + v.size, 0);
            const spaceSavings = ((sourceSize - totalSize) / sourceSize * 100).toFixed(1);
            
            // Clean up input file
            this.cleanup([inputPath]);
            
            const processingTime = (Date.now() - startTime) / 1000;
            
            console.log(`✅ Multi-quality processing completed in ${processingTime.toFixed(1)}s`);
            console.log(`📊 Generated ${successfulVariants.length} variants`);
            console.log(`💾 Space savings: ${spaceSavings}% compared to original`);
            
            return {
                success: true,
                variants: successfulVariants,
                manifest,
                outputDir,
                metadata,
                processingTime,
                sourceSize,
                totalSize
            };
            
        } catch (error) {
            console.error('❌ Multi-quality processing failed:', error);
            this.cleanup([inputPath]);
            throw error;
        }
    }

    // Encode a single variant
    encodeVariant(inputPath, outputDir, preset, codec, metadata) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const outputFile = `${preset.name}_${codec}.mp4`;
            const outputPath = path.join(outputDir, outputFile);
            
            console.log(`🔄 Encoding ${preset.name} ${codec.toUpperCase()}...`);
            
            const command = ffmpeg(inputPath);
            
            // Configure codec
            if (codec === 'h265') {
                command
                    .videoCodec('libx265')
                    .addOption('-tag:v', 'hvc1') // For Apple compatibility
                    .addOption('-crf', preset.h265_crf)
                    .addOption('-preset', 'medium')
                    .addOption('-x265-params', 'keyint=48:min-keyint=48:no-scenecut');
            } else {
                command
                    .videoCodec('libx264')
                    .addOption('-crf', preset.h264_crf)
                    .addOption('-preset', 'faster')
                    .addOption('-profile:v', preset.height <= 480 ? 'baseline' : 'main')
                    .addOption('-level', '4.1');
            }
            
            // Common options
            command
                .audioCodec('aac')
                .audioBitrate(preset.audioBitrate)
                .addOption('-maxrate', preset.videoBitrate)
                .addOption('-bufsize', `${parseInt(preset.videoBitrate) * 2}k`)
                .addOption('-movflags', '+faststart')
                .addOption('-pix_fmt', 'yuv420p');
            
            // Smart scaling - maintain aspect ratio
            if (metadata.video.height > preset.height) {
                const aspectRatio = metadata.video.width / metadata.video.height;
                const targetWidth = Math.round(preset.height * aspectRatio);
                // Ensure even dimensions
                const finalWidth = Math.floor(targetWidth / 2) * 2;
                const finalHeight = Math.floor(preset.height / 2) * 2;
                
                command.addOption('-vf', `scale=${finalWidth}:${finalHeight}:flags=lanczos`);
            }
            
            // Optimize for streaming
            command
                .addOption('-g', Math.floor(metadata.video.fps * 2))
                .addOption('-sc_threshold', '0')
                .addOption('-b_strategy', '1');
            
            command
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r⏳ ${preset.name} ${codec}: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    process.stdout.write('\n');
                    const stats = fs.statSync(outputPath);
                    const duration = (Date.now() - startTime) / 1000;
                    
                    const aspectRatio = metadata.video.width / metadata.video.height;
                    const width = Math.round(preset.height * aspectRatio);
                    
                    console.log(`✅ ${preset.name} ${codec}: ${(stats.size / 1024 / 1024).toFixed(1)}MB in ${duration.toFixed(1)}s`);
                    
                    resolve({
                        success: true,
                        preset: preset.name,
                        codec,
                        path: outputPath,
                        filename: outputFile,
                        size: stats.size,
                        width,
                        height: preset.height,
                        bitrate: preset.videoBitrate,
                        duration
                    });
                })
                .on('error', (err) => {
                    console.error(`❌ ${preset.name} ${codec} failed:`, err.message);
                    resolve({
                        success: false,
                        preset: preset.name,
                        codec,
                        error: err.message
                    });
                })
                .save(outputPath);
        });
    }

    // Generate manifest for adaptive streaming
    async generateManifest(outputDir, variants) {
        const manifest = {
            version: '2.0',
            created: new Date().toISOString(),
            variants: variants
                .map(v => ({
                    quality: v.preset,
                    codec: v.codec,
                    width: v.width,
                    height: v.height,
                    bitrate: v.bitrate,
                    size: v.size,
                    filename: v.filename,
                    supportedDevices: v.codec === 'h265' ? 'modern' : 'all'
                }))
                .sort((a, b) => b.height - a.height)
        };
        
        const manifestPath = path.join(outputDir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        console.log(`📄 Manifest generated at: ${manifestPath}`);
        return manifest;
    }

    // Get optimal variant for device/network conditions
    selectOptimalVariant(manifest, deviceCapabilities) {
        const { connectionType, deviceType, supportsH265 } = deviceCapabilities;
        
        // Filter by codec support
        let availableVariants = manifest.variants;
        if (!supportsH265) {
            availableVariants = availableVariants.filter(v => v.codec === 'h264');
        }
        
        // Select based on connection type
        let targetQuality;
        switch (connectionType) {
            case 'wifi':
            case '5g':
                targetQuality = deviceType === 'desktop' ? '1080p' : '720p';
                break;
            case '4g':
                targetQuality = '480p';
                break;
            case '3g':
            case 'slow':
            default:
                targetQuality = '360p';
                break;
        }
        
        // Find best match
        const variant = availableVariants.find(v => v.quality === targetQuality) ||
                       availableVariants[availableVariants.length - 1]; // Fallback to lowest
        
        return variant;
    }
}

module.exports = MultiQualityVideoProcessor;