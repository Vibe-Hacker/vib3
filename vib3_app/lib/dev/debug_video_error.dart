import 'grok_dev_assistant.dart';

Future<void> debugVideoRecordingError() async {
  const errorContext = '''
  Package error after recording video when trying to navigate to VideoEditingScreen.
  
  The error occurs in video_recording_screen.dart when:
  1. Recording is stopped
  2. Video file is saved
  3. Trying to navigate to VideoEditingScreen(videoPath: video.path)
  
  Possible issues:
  - video_thumbnail package initialization
  - File path issues
  - VideoPlayerController initialization
  - Missing dependencies
  ''';
  
  const codeContext = '''
  // Navigation code:
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => VideoEditingScreen(videoPath: video.path),
    ),
  );
  
  // VideoEditingScreen initialization:
  _controller = VideoPlayerController.file(file);
  await _controller!.initialize();
  
  // Timeline thumbnail generation:
  final frame = await VideoThumbnail.thumbnailData(
    video: widget.videoPath,
    imageFormat: ImageFormat.JPEG,
    maxHeight: 60,
    quality: 50,
    timeMs: position,
  );
  ''';
  
  print('Asking Grok to analyze the video error...\n');
  
  final solution = await GrokDevAssistant.fixError(
    errorContext,
    codeContext,
  );
  
  print('Grok\'s Analysis:\n');
  print(solution);
  
  // Also ask for specific video_thumbnail fix
  print('\n\nAsking for video_thumbnail specific solution...\n');
  
  final thumbnailFix = await GrokDevAssistant.fixError(
    'video_thumbnail package error when generating timeline frames',
    '''
    import 'package:video_thumbnail/video_thumbnail.dart' as vt;
    
    final frame = await vt.VideoThumbnail.thumbnailData(
      video: widget.videoPath,
      imageFormat: vt.ImageFormat.JPEG,
      maxHeight: 60,
      quality: 50,
      timeMs: position,
    );
    ''',
  );
  
  print('Thumbnail Fix:\n');
  print(thumbnailFix);
}

// Run this to debug
void main() async {
  await debugVideoRecordingError();
}