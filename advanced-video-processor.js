// Advanced Video Processing Module for VIB3
// Handles H.264, H.265/HEVC, and generates multiple resolutions with HLS streaming

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class AdvancedVideoProcessor {
    constructor() {
        this.tempDir = path.join(__dirname, 'temp');
        this.outputDir = path.join(__dirname, 'processed');
        this.ensureDirectories();
        
        // Video quality presets
        this.resolutions = [
            { name: '1080p', width: 1080, height: 1920, bitrate: '5M', audioBitrate: '192k' },
            { name: '720p', width: 720, height: 1280, bitrate: '3M', audioBitrate: '128k' },
            { name: '480p', width: 480, height: 854, bitrate: '1.5M', audioBitrate: '96k' },
            { name: '360p', width: 360, height: 640, bitrate: '800k', audioBitrate: '96k' }
        ];
    }

    ensureDirectories() {
        [this.tempDir, this.outputDir].forEach(dir => {
            if (!fsSync.existsSync(dir)) {
                fsSync.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Main processing function that handles all video types
    async processVideo(inputBuffer, originalFilename, options = {}) {
        const processId = crypto.randomBytes(8).toString('hex');
        const inputPath = path.join(this.tempDir, `input_${processId}${path.extname(originalFilename)}`);
        const outputPrefix = path.join(this.outputDir, processId);
        
        try {
            console.log('🎬 Starting advanced video processing for:', originalFilename);
            
            // Write input buffer to temporary file
            await fs.writeFile(inputPath, inputBuffer);
            
            // Get video information
            const videoInfo = await this.getVideoInfo(inputPath);
            console.log('📊 Video info:', {
                codec: videoInfo.video?.codec,
                resolution: `${videoInfo.video?.width}x${videoInfo.video?.height}`,
                duration: videoInfo.duration,
                fps: videoInfo.video?.fps
            });
            
            // Detect if it's H.265/HEVC
            const isHEVC = videoInfo.video?.codec === 'hevc' || 
                          videoInfo.video?.codec === 'h265';
            
            console.log(`🎥 Video codec: ${videoInfo.video?.codec} ${isHEVC ? '(HEVC detected)' : ''}`);
            
            // Process video to multiple resolutions
            const results = await this.generateMultipleResolutions(inputPath, outputPrefix, videoInfo, options);
            
            // Generate HLS playlist
            const hlsResult = await this.generateHLS(outputPrefix, results);
            
            // Generate thumbnail
            const thumbnail = await this.generateThumbnail(inputPath, outputPrefix);
            
            // Clean up input file
            await fs.unlink(inputPath);
            
            console.log('✅ Advanced video processing completed successfully');
            
            return {
                success: true,
                processId,
                resolutions: results,
                hls: hlsResult,
                thumbnail,
                originalInfo: videoInfo
            };
            
        } catch (error) {
            console.error('❌ Advanced video processing failed:', error);
            
            // Clean up on error
            try {
                await fs.unlink(inputPath);
            } catch (e) {}
            
            throw error;
        }
    }

    // Generate multiple resolution versions
    async generateMultipleResolutions(inputPath, outputPrefix, videoInfo, options = {}) {
        const results = [];
        const sourceHeight = videoInfo.video?.height || 1920;
        
        // Only generate resolutions that are smaller than source
        const applicableResolutions = this.resolutions.filter(res => res.height <= sourceHeight);
        
        // Always include at least 360p for compatibility
        if (applicableResolutions.length === 0) {
            applicableResolutions.push(this.resolutions[this.resolutions.length - 1]);
        }
        
        console.log(`📐 Generating ${applicableResolutions.length} resolutions...`);
        
        for (const resolution of applicableResolutions) {
            try {
                const outputPath = `${outputPrefix}_${resolution.name}.mp4`;
                await this.transcodeVideo(inputPath, outputPath, resolution, videoInfo, options);
                
                const stats = await fs.stat(outputPath);
                results.push({
                    resolution: resolution.name,
                    width: resolution.width,
                    height: resolution.height,
                    path: outputPath,
                    size: stats.size,
                    bitrate: resolution.bitrate
                });
                
                console.log(`✅ Generated ${resolution.name} version`);
            } catch (error) {
                console.error(`❌ Failed to generate ${resolution.name}:`, error.message);
            }
        }
        
        return results;
    }

    // Transcode video with H.264/H.265 support
    transcodeVideo(inputPath, outputPath, resolution, videoInfo, options = {}) {
        return new Promise((resolve, reject) => {
            const isHEVC = videoInfo.video?.codec === 'hevc' || videoInfo.video?.codec === 'h265';
            
            let command = ffmpeg(inputPath)
                .output(outputPath)
                // Force H.264 output for maximum compatibility
                .videoCodec('libx264')
                .audioCodec('aac')
                // Quality and speed settings
                .addOption('-preset', 'fast')
                .addOption('-crf', '23')
                .addOption('-movflags', '+faststart')
                .addOption('-profile:v', 'high')
                .addOption('-level', '4.1')
                .addOption('-pix_fmt', 'yuv420p')
                // Bitrate settings
                .videoBitrate(resolution.bitrate)
                .audioBitrate(resolution.audioBitrate)
                .audioFrequency(44100)
                .audioChannels(2);
            
            // Handle HEVC input with hardware acceleration if available
            if (isHEVC) {
                console.log('🎬 Detected HEVC input, using optimized decoding...');
                // Try hardware decoding first (if available)
                command.inputOptions([
                    '-c:v', 'hevc',
                    '-threads', '0'
                ]);
            }
            
            // Calculate scaling with aspect ratio preservation
            const sourceAspect = videoInfo.video.width / videoInfo.video.height;
            const targetAspect = resolution.width / resolution.height;
            
            let scaleFilter;
            if (Math.abs(sourceAspect - targetAspect) < 0.01) {
                // Same aspect ratio, simple scale
                scaleFilter = `scale=${resolution.width}:${resolution.height}`;
            } else {
                // Different aspect ratio, scale and pad
                if (sourceAspect > targetAspect) {
                    // Video is wider, scale by width and pad height
                    scaleFilter = `scale=${resolution.width}:-2,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black`;
                } else {
                    // Video is taller, scale by height and pad width
                    scaleFilter = `scale=-2:${resolution.height},pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2:black`;
                }
            }
            
            const videoFilters = [scaleFilter];
            if (options.isFrontCamera) {
                console.log('📷 Front camera detected, applying horizontal flip.');
                videoFilters.push('hflip');
            }

            command.videoFilter(videoFilters.join(','));
            
            // Add frame rate limiting for large videos
            if (videoInfo.video.fps > 30) {
                command.fps(30);
            }
            
            command
                .on('start', (cmd) => {
                    console.log(`🚀 Starting ${resolution.name} transcode...`);
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\r⏳ ${resolution.name}: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`\n✅ ${resolution.name} transcode complete`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`\n❌ ${resolution.name} transcode error:`, err.message);
                    reject(err);
                })
                .run();
        });
    }

    // Generate HLS playlist and segments
    async generateHLS(outputPrefix, resolutions) {
        console.log('📺 Generating HLS streams...');
        
        const hlsDir = `${outputPrefix}_hls`;
        await fs.mkdir(hlsDir, { recursive: true });
        
        const masterPlaylist = ['#EXTM3U', '#EXT-X-VERSION:3'];
        
        for (const res of resolutions) {
            const streamDir = path.join(hlsDir, res.resolution);
            await fs.mkdir(streamDir, { recursive: true });
            
            const playlistPath = path.join(streamDir, 'playlist.m3u8');
            
            // Generate HLS segments for this resolution
            await this.generateHLSStream(res.path, streamDir);
            
            // Add to master playlist
            const bandwidth = parseInt(res.bitrate.replace(/[^0-9]/g, '')) * 1000;
            masterPlaylist.push(
                `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.width}x${res.height}`,
                `${res.resolution}/playlist.m3u8`
            );
        }
        
        // Write master playlist
        const masterPath = path.join(hlsDir, 'master.m3u8');
        await fs.writeFile(masterPath, masterPlaylist.join('\n'));
        
        console.log('✅ HLS generation complete');
        
        return {
            masterPlaylist: masterPath,
            directory: hlsDir
        };
    }

    // Generate HLS segments for a specific resolution
    generateHLSStream(inputPath, outputDir) {
        return new Promise((resolve, reject) => {
            const playlistPath = path.join(outputDir, 'playlist.m3u8');
            
            ffmpeg(inputPath)
                .outputOptions([
                    '-hls_time', '4',
                    '-hls_list_size', '0',
                    '-hls_segment_filename', path.join(outputDir, 'segment_%03d.ts'),
                    '-f', 'hls'
                ])
                .output(playlistPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
    }

    // Generate thumbnail
    async generateThumbnail(inputPath, outputPrefix) {
        const thumbnailPath = `${outputPrefix}_thumbnail.jpg`;
        
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .screenshots({
                    timestamps: ['10%'],
                    filename: path.basename(thumbnailPath),
                    folder: path.dirname(thumbnailPath),
                    size: '720x1280'
                })
                .on('end', () => {
                    console.log('✅ Thumbnail generated');
                    resolve(thumbnailPath);
                })
                .on('error', (err) => {
                    console.error('❌ Thumbnail generation failed:', err.message);
                    reject(err);
                });
        });
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
                        fps: eval(videoStream.r_frame_rate),
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

    // Clean up all files for a process ID
    async cleanup(processId) {
        const patterns = [
            path.join(this.outputDir, `${processId}_*.mp4`),
            path.join(this.outputDir, `${processId}_*.jpg`),
            path.join(this.outputDir, `${processId}_hls`)
        ];
        
        for (const pattern of patterns) {
            try {
                if (pattern.endsWith('_hls')) {
                    await fs.rmdir(pattern, { recursive: true });
                } else {
                    const files = await fs.readdir(path.dirname(pattern));
                    const matching = files.filter(f => f.startsWith(path.basename(pattern).replace('*', '')));
                    for (const file of matching) {
                        await fs.unlink(path.join(path.dirname(pattern), file));
                    }
                }
            } catch (e) {}
        }
    }
}

module.exports = AdvancedVideoProcessor;