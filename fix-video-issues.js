// Fix video playback and upload issues for VIB3
// This script updates the server to properly handle video URLs and CORS

const fs = require('fs');
const path = require('path');

// 1. Add CORS configuration for DigitalOcean Spaces
const corsConfig = `
// Enhanced CORS for video streaming
app.use((req, res, next) => {
    // Allow all origins for video content
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});
`;

// 2. Fix video upload to ensure proper URL generation
const uploadFix = `
// Enhanced video upload with proper URL generation
app.post('/api/upload/video', requireAuth, upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
    }

    try {
        const userId = req.userId;
        const videoId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        // Create proper file path
        const fileName = \`\${userId}_\${videoId}_\${timestamp}.mp4\`;
        const key = \`videos/\${userId}/\${fileName}\`;
        
        // Upload to DigitalOcean Spaces
        const params = {
            Bucket: process.env.DO_SPACES_BUCKET || 'vib3-videos',
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype || 'video/mp4',
            ACL: 'public-read',
            CacheControl: 'max-age=31536000'
        };
        
        const uploadResult = await s3.upload(params).promise();
        
        // Generate the correct public URL
        const videoUrl = uploadResult.Location || 
            \`https://\${params.Bucket}.nyc3.digitaloceanspaces.com/\${key}\`;
        
        // Save video metadata to database
        if (db) {
            const video = {
                _id: new ObjectId(),
                videoId: videoId,
                userId: userId,
                url: videoUrl,
                originalUrl: videoUrl,
                thumbnail: \`\${videoUrl}?thumbnail=true\`,
                title: req.body.title || '',
                description: req.body.description || '',
                duration: parseInt(req.body.duration) || 0,
                createdAt: new Date(),
                status: 'active',
                views: 0,
                likes: 0,
                comments: 0
            };
            
            await db.collection('videos').insertOne(video);
            
            res.json({
                success: true,
                video: {
                    id: video._id,
                    videoId: video.videoId,
                    url: video.url,
                    thumbnail: video.thumbnail
                }
            });
        } else {
            res.json({
                success: true,
                url: videoUrl,
                videoId: videoId
            });
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});
`;

// 3. Add video proxy endpoint for problematic videos
const proxyEndpoint = `
// Video proxy endpoint for CORS issues
app.get('/api/proxy/video', async (req, res) => {
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
        return res.status(400).json({ error: 'No video URL provided' });
    }
    
    try {
        // Set proper headers for video streaming
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        // Pipe the video from the source
        const response = await fetch(videoUrl);
        const stream = response.body;
        stream.pipe(res);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to proxy video' });
    }
});
`;

// 4. Flutter app fixes
const flutterVideoFix = `
// video_player_widget.dart - Fix video initialization
Future<void> _initializeVideo() async {
  if (_isInitializing || _isDisposed) return;
  
  _isInitializing = true;
  
  try {
    // Transform URL to ensure HTTPS and proper format
    String videoUrl = widget.videoUrl;
    
    // Ensure HTTPS for DigitalOcean Spaces
    if (videoUrl.contains('digitaloceanspaces.com') && videoUrl.startsWith('http://')) {
      videoUrl = videoUrl.replaceFirst('http://', 'https://');
    }
    
    // Add timestamp to prevent caching issues
    if (!videoUrl.contains('?')) {
      videoUrl += '?t=' + DateTime.now().millisecondsSinceEpoch.toString();
    }
    
    print('🎥 Initializing video: \$videoUrl');
    
    _controller = VideoPlayerController.network(
      videoUrl,
      httpHeaders: {
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
      },
      formatHint: VideoFormat.other,
    );
    
    await _controller!.initialize();
    
    if (mounted && !_isDisposed) {
      setState(() {
        _isInitialized = true;
        _hasError = false;
      });
      
      // Start playing if requested
      if (widget.isPlaying) {
        _controller!.play();
        _controller!.setLooping(true);
      }
    }
  } catch (e) {
    print('❌ Video initialization error: \$e');
    if (mounted && !_isDisposed) {
      setState(() {
        _hasError = true;
        _isInitialized = false;
      });
    }
  } finally {
    _isInitializing = false;
  }
}
`;

const flutterUploadFix = `
// upload_screen.dart - Fix upload functionality
Future<void> _uploadVideo(File videoFile) async {
  try {
    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });
    
    final token = await AuthService.getToken();
    if (token == null) {
      throw Exception('Not authenticated');
    }
    
    var uri = Uri.parse('\${AppConfig.baseUrl}/api/upload/video');
    var request = http.MultipartRequest('POST', uri);
    
    // Add auth header
    request.headers['Authorization'] = 'Bearer \$token';
    
    // Add video file
    var videoStream = http.ByteStream(videoFile.openRead());
    var length = await videoFile.length();
    var multipartFile = http.MultipartFile(
      'video',
      videoStream,
      length,
      filename: basename(videoFile.path),
      contentType: MediaType('video', 'mp4'),
    );
    request.files.add(multipartFile);
    
    // Add metadata
    request.fields['title'] = _titleController.text;
    request.fields['description'] = _descriptionController.text;
    request.fields['duration'] = _videoDuration.toString();
    
    // Send request
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 200) {
      var jsonResponse = json.decode(responseData);
      
      // Navigate to home or show success
      Navigator.of(context).pushReplacementNamed('/home');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Video uploaded successfully!')),
      );
    } else {
      throw Exception('Upload failed: \$responseData');
    }
    
  } catch (e) {
    print('Upload error: \$e');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Upload failed: \$e')),
    );
  } finally {
    setState(() {
      _isUploading = false;
    });
  }
}
`;

console.log('Video Fix Instructions:');
console.log('======================');
console.log('1. Add the CORS configuration to server.js');
console.log('2. Replace the upload endpoint in server.js');
console.log('3. Add the proxy endpoint to server.js');
console.log('4. Update video_player_widget.dart with the initialization fix');
console.log('5. Update upload_screen.dart with the upload fix');
console.log('\nThese fixes will:');
console.log('- Ensure proper CORS headers for video streaming');
console.log('- Generate correct HTTPS URLs for DigitalOcean Spaces');
console.log('- Add proper video metadata to database');
console.log('- Fix video player initialization in Flutter');
console.log('- Fix upload functionality with proper authentication');

// Output the fixes to separate files for easy copying
fs.writeFileSync('server-cors-fix.js', corsConfig);
fs.writeFileSync('server-upload-fix.js', uploadFix);
fs.writeFileSync('server-proxy-fix.js', proxyEndpoint);
fs.writeFileSync('flutter-video-fix.dart', flutterVideoFix);
fs.writeFileSync('flutter-upload-fix.dart', flutterUploadFix);

console.log('\nFix files created:');
console.log('- server-cors-fix.js');
console.log('- server-upload-fix.js');
console.log('- server-proxy-fix.js');
console.log('- flutter-video-fix.dart');
console.log('- flutter-upload-fix.dart');