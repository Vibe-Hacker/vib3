
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
    
    var uri = Uri.parse('${AppConfig.baseUrl}/api/upload/video');
    var request = http.MultipartRequest('POST', uri);
    
    // Add auth header
    request.headers['Authorization'] = 'Bearer $token';
    
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
      throw Exception('Upload failed: $responseData');
    }
    
  } catch (e) {
    print('Upload error: $e');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Upload failed: $e')),
    );
  } finally {
    setState(() {
      _isUploading = false;
    });
  }
}
