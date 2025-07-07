import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import '../screens/video_creator/providers/creation_state_provider.dart';

/// Mock video export service for testing without FFmpeg
class VideoExportService {
  /// Export video with all edits applied (MOCK VERSION)
  static Future<String> exportVideo({
    required List<VideoClip> clips,
    required String? backgroundMusicPath,
    required String? voiceoverPath,
    required List<TextOverlay> textOverlays,
    required List<StickerOverlay> stickers,
    required String selectedFilter,
    required double originalVolume,
    required double musicVolume,
    Function(double)? onProgress,
  }) async {
    // Simulate export progress
    if (onProgress != null) {
      for (int i = 0; i <= 100; i += 10) {
        await Future.delayed(const Duration(milliseconds: 100));
        onProgress(i / 100);
      }
    }
    
    // Return the first clip path as the "exported" video
    if (clips.isNotEmpty) {
      return clips.first.path;
    }
    
    // Return a dummy path if no clips
    final tempDir = await getTemporaryDirectory();
    return path.join(tempDir.path, 'mock_export.mp4');
  }
  
  /// Merge multiple video clips into one (MOCK VERSION)
  static Future<String> mergeClips(List<String> videoPaths) async {
    if (videoPaths.isEmpty) {
      throw Exception('No video clips to merge');
    }
    
    // Return first clip path as "merged" result
    return videoPaths.first;
  }
}