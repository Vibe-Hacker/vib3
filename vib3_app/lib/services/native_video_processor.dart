import 'dart:io';
import 'package:flutter/services.dart';

/// Native video processor using platform channels
/// Uses Android MediaCodec and iOS AVFoundation for efficient video processing
class NativeVideoProcessor {
  static const MethodChannel _channel = MethodChannel('com.vib3.video/processor');

  /// Flip video horizontally using native platform APIs
  /// Returns the path to the flipped video file
  static Future<String?> flipVideoHorizontal(String inputPath) async {
    try {
      print('🔄 Calling native video flip for: $inputPath');

      final String? outputPath = await _channel.invokeMethod(
        'flipVideoHorizontal',
        {'inputPath': inputPath},
      );

      if (outputPath != null && await File(outputPath).exists()) {
        print('✅ Native flip completed: $outputPath');
        return outputPath;
      } else {
        print('⚠️ Native flip returned null or file not found');
        return null;
      }
    } on PlatformException catch (e) {
      print('❌ Native flip failed: ${e.message}');
      return null;
    } catch (e) {
      print('❌ Unexpected error during native flip: $e');
      return null;
    }
  }

  /// Check if native video processing is available on this platform
  static Future<bool> isAvailable() async {
    try {
      final bool? available = await _channel.invokeMethod('isAvailable');
      return available ?? false;
    } catch (e) {
      return false;
    }
  }
}
