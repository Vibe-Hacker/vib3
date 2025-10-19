// Video Processing Module for VIB3
// Converts all uploaded videos to standard H.264 MP4 format

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VideoProcessor {
    constructor() {
        this.tempDir = path.join(__dirname, 'temp');
        this.ensureTempDir();
    }

    ensureTempDir() {
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // Convert video to standard H.264 MP4 format
    async convertToStandardMp4(inputBuffer, originalFilename) {
        const tempId = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(this.tempDir, `input_${tempId}${path.extname(originalFilename)}`);
        const outputPath = path.join(this.tempDir, `output_${tempId}.mp4`);

        try {
            console.log('🎬 Starting video conversion for:', originalFilename);
            
            // Write input buffer to temporary file
            fs.writeFileSync(inputPath, inputBuffer);
            
            // Get video information first
            const videoInfo = await this.getVideoInfo(inputPath);
            console.log('📊 Video info:', videoInfo);
            
            // Check if conversion is actually needed
            const needsConversion = this.needsConversion(videoInfo, originalFilename);
            if (!needsConversion) {
                console.log('⚡ Video already in optimal format - skipping conversion');
                this.cleanup([inputPath]);
                return {
                    success: true,
                    buffer: inputBuffer,
                    originalSize: inputBuffer.length,
                    convertedSize: inputBuffer.length,
                    videoInfo: videoInfo,
                    skipped: true
                };
            }
            
            // Convert video with optimized settings for web playback
            await this.performConversion(inputPath, outputPath, videoInfo);
            
            // Read converted file back to buffer
            const convertedBuffer = fs.readFileSync(outputPath);
            
            // Clean up temporary files
            this.cleanup([inputPath, outputPath]);
            
            console.log('✅ Video conversion completed successfully');
            console.log(`📦 Original size: ${(inputBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            console.log(`📦 Converted size: ${(convertedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            
            return {
                success: true,
                buffer: convertedBuffer,
                originalSize: inputBuffer.length,
                convertedSize: convertedBuffer.length,
                videoInfo: videoInfo
            };
            
        } catch (error) {
            console.error('❌ Video conversion failed:', error);
            
            // Clean up any remaining files
            this.cleanup([inputPath, outputPath]);
            
            return {
                success: false,
                error: error.message,
                originalBuffer: inputBuffer // Return original if conversion fails
            };
        }
    }

    // Get video information using FFprobe
    getVideoInfo(inputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(inputPath, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
                
                resolve({
                    duration: metadata.format.duration,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    video: videoStream ? {
                        codec: videoStream.codec_name,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: eval(videoStream.r_frame_rate), // Convert fraction to decimal
                        bitrate: videoStream.bit_rate
                    } : null,
                    audio: audioStream ? {
                        codec: audioStream.codec_name,
                        bitrate: audioStream.bit_rate,
                        sampleRate: audioStream.sample_rate
                    } : null
                });
            });
        });
    }

    // Perform the actual video conversion
    performConversion(inputPath, outputPath, videoInfo) {
        return new Promise((resolve, reject) => {
            let command = ffmpeg(inputPath)
                .output(outputPath)
                // Video codec settings for maximum compatibility
                .videoCodec('libx264')
                .audioCodec('aac')
                // Optimize for maximum speed
                .addOption('-preset', 'ultrafast')      // Fastest possible encoding
                .addOption('-tune', 'fastdecode')       // Optimize for fast playback
                .addOption('-crf', '28')                // Lower quality for speed
                .addOption('-movflags', '+faststart')   // Enable progressive download
                .addOption('-profile:v', 'main')        // Less restrictive than baseline
                .addOption('-pix_fmt', 'yuv420p')       // Compatible pixel format
                // Aggressive speed optimizations
                .addOption('-threads', '0')             // Use all available CPU cores
                .addOption('-slices', '4')              // Parallel processing
                .addOption('-x264opts', 'no-cabac:ref=1:bframes=0:weightp=0:8x8dct=0:trellis=0')
                // Simplified audio processing
                .audioCodec('aac')
                .audioBitrate('96k')                    // Lower audio bitrate for speed
                .audioFrequency(44100)
                .audioChannels(2);

            // Handle different input video dimensions - aggressive scaling for speed
            if (videoInfo.video) {
                const { width, height } = videoInfo.video;
                
                // Aggressively scale down for speed - most mobile videos don't need 4K
                if (width > 1280 || height > 720) {
                    // Scale down to 720p for fastest processing
                    command.size('1280x720');
                    console.log('📐 Scaling video down to 720p for speed');
                } else if (width % 2 !== 0 || height % 2 !== 0) {
                    // Ensure even dimensions for H.264 compatibility
                    const newWidth = width % 2 === 0 ? width : width + 1;
                    const newHeight = height % 2 === 0 ? height : height + 1;
                    command.size(`${newWidth}x${newHeight}`);
                    console.log(`📐 Adjusting dimensions to ${newWidth}x${newHeight} for H.264 compatibility`);
                }
            }

            // Handle conversion events
            command
                .on('start', (commandLine) => {
                    console.log('🚀 FFmpeg process started:', commandLine);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`⏳ Conversion progress: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    console.log('✅ FFmpeg conversion completed');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ FFmpeg conversion error:', err.message);
                    reject(err);
                })
                .run();
        });
    }

    // Clean up temporary files
    cleanup(filePaths) {
        filePaths.forEach(filePath => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Cleaned up temp file:', path.basename(filePath));
                }
            } catch (error) {
                console.warn('⚠️ Failed to clean up temp file:', filePath, error.message);
            }
        });
    }

    // Validate if a video can be processed
    async validateVideo(inputBuffer, originalFilename) {
        const tempId = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(this.tempDir, `validate_${tempId}${path.extname(originalFilename)}`);
        
        try {
            fs.writeFileSync(inputPath, inputBuffer);
            const videoInfo = await this.getVideoInfo(inputPath);
            this.cleanup([inputPath]);
            
            // Check if video has required streams
            if (!videoInfo.video) {
                throw new Error('No video stream found in file');
            }
            
            // Check duration (max 3 minutes as per app config)
            if (videoInfo.duration > 180) {
                throw new Error('Video duration exceeds 3 minute limit');
            }
            
            return {
                valid: true,
                info: videoInfo
            };
            
        } catch (error) {
            this.cleanup([inputPath]);
            return {
                valid: false,
                error: error.message
            };
        }
    }

    // Check if video needs conversion for optimization
    needsConversion(videoInfo, originalFilename) {
        const ext = path.extname(originalFilename).toLowerCase();
        
        // Skip conversion for most MP4 files to prioritize speed
        if (ext === '.mp4' && videoInfo.video) {
            const { codec, width, height } = videoInfo.video;
            
            // Be much more lenient - skip conversion for any reasonably sized MP4
            if (width <= 3840 && height <= 2160) { // Allow up to 4K without conversion
                console.log(`⚡ Skipping conversion for ${originalFilename}: ${width}x${height}, codec: ${codec}`);
                return false;
            }
        }
        
        // Only convert non-MP4 formats or extremely large videos
        const shouldConvert = ext !== '.mp4' || (videoInfo.video && (videoInfo.video.width > 3840 || videoInfo.video.height > 2160));
        console.log(`🔄 Conversion needed for ${originalFilename}: ${shouldConvert}`);
        return shouldConvert;
    }

    // Flip video horizontally for front camera videos
    async flipVideoHorizontal(inputBuffer, originalFilename) {
        const tempId = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(this.tempDir, `input_${tempId}${path.extname(originalFilename)}`);
        const outputPath = path.join(this.tempDir, `flipped_${tempId}.mp4`);

        try {
            console.log('🔄 Starting horizontal flip for:', originalFilename);

            // Write input buffer to temporary file
            fs.writeFileSync(inputPath, inputBuffer);

            // Flip video horizontally using FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .videoFilters('hflip')
                    .videoCodec('libx264')
                    .audioCodec('copy')
                    .outputOptions('-preset fast')
                    .outputOptions('-crf 23')
                    .on('start', (commandLine) => {
                        console.log('📹 FFmpeg command:', commandLine);
                    })
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            console.log(`🔄 Flipping progress: ${progress.percent.toFixed(1)}%`);
                        }
                    })
                    .on('end', () => {
                        console.log('✅ Horizontal flip completed');
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error('❌ FFmpeg flip error:', err.message);
                        reject(err);
                    })
                    .save(outputPath);
            });

            // Read flipped file back to buffer
            const flippedBuffer = fs.readFileSync(outputPath);

            // Clean up temporary files
            this.cleanup([inputPath, outputPath]);

            console.log('✅ Video flip completed successfully');
            console.log(`📦 Original size: ${(inputBuffer.length / 1024 / 1024).toFixed(2)}MB`);
            console.log(`📦 Flipped size: ${(flippedBuffer.length / 1024 / 1024).toFixed(2)}MB`);

            return {
                success: true,
                buffer: flippedBuffer,
                originalSize: inputBuffer.length,
                flippedSize: flippedBuffer.length
            };

        } catch (error) {
            console.error('❌ Video flip failed:', error);

            // Clean up any remaining files
            this.cleanup([inputPath, outputPath]);

            throw error;
        }
    }
}

module.exports = VideoProcessor;