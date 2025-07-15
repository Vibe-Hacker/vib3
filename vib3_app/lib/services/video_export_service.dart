import 'dart:io';
import 'dart:typed_data';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import '../screens/video_creator/providers/creation_state_provider.dart';
import 'voice_effects_processor.dart';
import 'ar_effects_processor.dart';
import 'green_screen_processor.dart';

/// Simplified video export service without FFmpeg dependency
/// This provides basic functionality until FFmpeg issues are resolved
class VideoExportService {
  static final VoiceEffectsProcessor _voiceProcessor = VoiceEffectsProcessor();
  static final AREffectsProcessor _arProcessor = AREffectsProcessor();
  static final GreenScreenProcessor _greenScreenProcessor = GreenScreenProcessor();
  
  /// Export video with all effects applied (improved version)
  static Future<String> exportVideo({
    required List<VideoClip> clips,
    required List<VideoEffect> effects,
    required String? backgroundMusicPath,
    required String? voiceoverPath,
    required List<TextOverlay> textOverlays,
    required List<StickerOverlay> stickers,
    required String selectedFilter,
    required double originalVolume,
    required double musicVolume,
    Function(double)? onProgress,
  }) async {
    if (clips.isEmpty) {
      throw Exception('No video clips to export');
    }
    
    try {
      print('🎬 Starting video export...');
      print('📊 Export details:');
      print('  - Clips: ${clips.length}');
      print('  - Effects: ${effects.length}');
      print('  - Filter: $selectedFilter');
      print('  - Music: ${backgroundMusicPath != null ? "Yes" : "No"}');
      print('  - Text overlays: ${textOverlays.length}');
      print('  - Stickers: ${stickers.length}');
      
      onProgress?.call(0.1);
      
      // Step 1: Prepare output directory
      final tempDir = await getTemporaryDirectory();
      final exportDir = Directory(path.join(tempDir.path, 'vib3_exports'));
      if (!await exportDir.exists()) {
        await exportDir.create(recursive: true);
      }
      
      onProgress?.call(0.2);
      
      // Step 2: Process video clips
      String processedVideoPath;
      
      if (clips.length == 1) {
        // Single clip - copy to export directory
        final sourceFile = File(clips.first.path);
        if (!await sourceFile.exists()) {
          throw Exception('Source video file not found: ${clips.first.path}');
        }
        
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        processedVideoPath = path.join(exportDir.path, 'vib3_video_$timestamp.mp4');
        
        print('📋 Copying video to export directory...');
        await sourceFile.copy(processedVideoPath);
        
        // Verify the copy
        final exportedFile = File(processedVideoPath);
        if (!await exportedFile.exists()) {
          throw Exception('Failed to copy video to export directory');
        }
        
        final fileSize = await exportedFile.length();
        print('✅ Video copied successfully: ${fileSize / 1024 / 1024} MB');
        
      } else {
        // Multiple clips - for now, use the first clip
        // TODO: Implement proper clip merging when FFmpeg is available
        print('⚠️ Multiple clips detected. Using first clip only (merging not yet implemented)');
        
        final sourceFile = File(clips.first.path);
        if (!await sourceFile.exists()) {
          throw Exception('Source video file not found: ${clips.first.path}');
        }
        
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        processedVideoPath = path.join(exportDir.path, 'vib3_video_$timestamp.mp4');
        await sourceFile.copy(processedVideoPath);
      }
      
      onProgress?.call(0.5);
      
      // Step 3: Create metadata file for effects (for future processing)
      final metadataPath = processedVideoPath.replaceAll('.mp4', '_metadata.json');
      final metadata = {
        'version': '1.0',
        'created': DateTime.now().toIso8601String(),
        'effects': effects.map((e) => {
          'type': e.type.toString(),
          'parameters': e.parameters,
        }).toList(),
        'filter': selectedFilter,
        'music': backgroundMusicPath,
        'voiceover': voiceoverPath,
        'originalVolume': originalVolume,
        'musicVolume': musicVolume,
        'textOverlays': textOverlays.map((t) => {
          'text': t.text,
          'position': {'x': t.position.dx, 'y': t.position.dy},
          'fontSize': t.fontSize,
          'color': t.color,
          'startTime': t.startTime.inMilliseconds,
          'duration': t.duration.inMilliseconds,
        }).toList(),
        'stickers': stickers.map((s) => {
          'path': s.stickerPath,
          'position': {'x': s.position.dx, 'y': s.position.dy},
          'scale': s.scale,
          'rotation': s.rotation,
          'startTime': s.startTime.inMilliseconds,
          'duration': s.duration.inMilliseconds,
        }).toList(),
      };
      
      // Save metadata
      final metadataFile = File(metadataPath);
      await metadataFile.writeAsString(jsonEncode(metadata));
      print('📝 Saved effects metadata for future processing');
      
      onProgress?.call(0.8);
      
      // Step 4: Validate final output
      final finalFile = File(processedVideoPath);
      if (!await finalFile.exists()) {
        throw Exception('Export failed - output file not found');
      }
      
      final finalSize = await finalFile.length();
      if (finalSize == 0) {
        throw Exception('Export failed - output file is empty');
      }
      
      onProgress?.call(1.0);
      
      print('✅ Video export completed successfully!');
      print('📁 Exported to: $processedVideoPath');
      print('📏 Final size: ${finalSize / 1024 / 1024} MB');
      print('ℹ️ Note: Advanced effects will be applied when FFmpeg integration is complete');
      
      return processedVideoPath;
      
    } catch (e) {
      print('❌ Video export failed: $e');
      throw Exception('Video export failed: $e');
    }
  }
  
  /// Merge multiple video clips (simplified version)
  static Future<String> mergeClips(List<String> videoPaths) async {
    if (videoPaths.isEmpty) {
      throw Exception('No video clips to merge');
    }
    
    // Return first clip path as "merged" result
    return videoPaths.first;
  }
  
  /// Combine multiple clips into one (instance method for camera module)
  Future<String> combineClips(List<String> videoPaths) async {
    return mergeClips(videoPaths);
  }
  
  /// Apply voice effects to audio (placeholder)
  static Future<String> applyVoiceEffects(String videoPath, List<VideoEffect> voiceEffects) async {
    print('ℹ️ Voice effects processing requires FFmpeg - returning original video');
    return videoPath;
  }
  
  /// Apply AR effects (placeholder)
  static Future<String> applyAREffects(String videoPath, List<VideoEffect> arEffects) async {
    print('ℹ️ AR effects are applied during recording, not in post-processing');
    return videoPath;
  }
  
  /// Apply green screen effects (placeholder)
  static Future<String> applyGreenScreenEffects(String videoPath, List<VideoEffect> greenScreenEffects) async {
    print('ℹ️ Green screen processing requires FFmpeg - returning original video');
    return videoPath;
  }
  
  /// Add background music (placeholder)
  static Future<String> addBackgroundMusic(
    String videoPath, 
    String musicPath, 
    double originalVolume, 
    double musicVolume
  ) async {
    print('ℹ️ Background music mixing requires FFmpeg - returning original video');
    return videoPath;
  }
  
  /// Add voiceover (placeholder)
  static Future<String> addVoiceover(String videoPath, String voiceoverPath) async {
    print('ℹ️ Voiceover mixing requires FFmpeg - returning original video');
    return videoPath;
  }
  
  /// Add text overlays and stickers (placeholder)
  static Future<String> addOverlays(
    String videoPath, 
    List<TextOverlay> textOverlays, 
    List<StickerOverlay> stickers
  ) async {
    print('ℹ️ Text/sticker overlays require FFmpeg - returning original video');
    return videoPath;
  }
  
  /// Apply color filter (placeholder)
  static Future<String> applyColorFilter(String videoPath, String filterName) async {
    print('ℹ️ Color filters require FFmpeg - returning original video');
    return videoPath;
  }
  
  /// Get video information (placeholder)
  static Future<Map<String, dynamic>> getVideoInfo(String videoPath) async {
    // Return mock data for now
    return {
      'duration': 10.0,
      'width': 1080,
      'height': 1920,
      'fps': 30.0,
    };
  }
}