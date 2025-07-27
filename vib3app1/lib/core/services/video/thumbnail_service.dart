import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'package:video_player/video_player.dart';
import 'package:video_thumbnail/video_thumbnail.dart' as vt;
import 'package:image/image.dart';

/// Service for generating video thumbnails
class ThumbnailService {
  /// Generate a thumbnail from a video file
  static Future<File?> generateVideoThumbnail(String videoPath) async {
    try {
      print('🖼️ Generating thumbnail for: $videoPath');
      
      // Method 1: Use video_thumbnail package to extract frame
      final uint8list = await vt.VideoThumbnail.thumbnailData(
        video: videoPath,
        imageFormat: vt.ImageFormat.JPEG,
        maxWidth: 720,
        quality: 85,
        // Try to get frame at 10% of video duration for better thumbnail
        timeMs: 2000, // 2 seconds in, usually a good spot
      );
      
      if (uint8list != null && uint8list.isNotEmpty) {
        // Save thumbnail to temporary file
        final tempDir = await getTemporaryDirectory();
        final fileName = path.basenameWithoutExtension(videoPath);
        final thumbnailPath = path.join(tempDir.path, '${fileName}_thumb.jpg');
        
        final thumbnailFile = File(thumbnailPath);
        await thumbnailFile.writeAsBytes(uint8list);
        
        print('✅ Thumbnail generated successfully: $thumbnailPath');
        print('📏 Thumbnail size: ${uint8list.length / 1024} KB');
        return thumbnailFile;
      } else {
        print('⚠️ No thumbnail data generated, trying fallback method');
      }
      
      // Method 2: Try alternative timestamp if first attempt failed
      final fallbackThumbnail = await vt.VideoThumbnail.thumbnailData(
        video: videoPath,
        imageFormat: vt.ImageFormat.JPEG,
        maxWidth: 720,
        quality: 85,
        timeMs: 0, // Try first frame
      );
      
      if (fallbackThumbnail != null && fallbackThumbnail.isNotEmpty) {
        final tempDir = await getTemporaryDirectory();
        final fileName = path.basenameWithoutExtension(videoPath);
        final thumbnailPath = path.join(tempDir.path, '${fileName}_thumb_fallback.jpg');
        
        final thumbnailFile = File(thumbnailPath);
        await thumbnailFile.writeAsBytes(fallbackThumbnail);
        
        print('✅ Fallback thumbnail generated: $thumbnailPath');
        return thumbnailFile;
      }
      
      // Method 3: If video extraction fails, generate a branded thumbnail
      print('⚠️ Video thumbnail extraction failed, generating branded thumbnail');
      return await _generateFallbackThumbnail(videoPath);
      
    } catch (e) {
      print('❌ Thumbnail generation error: $e');
      // Try fallback thumbnail as last resort
      return await _generateFallbackThumbnail(videoPath);
    }
  }
  
  /// Generate a fallback thumbnail with VIB3 branding
  static Future<File?> _generateFallbackThumbnail(String videoPath) async {
    try {
      final tempDir = await getTemporaryDirectory();
      final fileName = path.basenameWithoutExtension(videoPath);
      final thumbnailPath = path.join(tempDir.path, '${fileName}_branded_thumb.jpg');
      
      // Create a simple branded thumbnail using canvas
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      const size = Size(720, 1280);
      
      // Draw gradient background
      final gradient = ui.Gradient.linear(
        Offset.zero,
        Offset(size.width, size.height),
        [const ui.Color(0xFFFF0080), const ui.Color(0xFF7928CA)],
      );
      
      final paint = Paint()..shader = gradient;
      canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);
      
      // Draw dark overlay
      final overlayPaint = Paint()..color = Colors.black.withOpacity(0.3);
      canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), overlayPaint);
      
      // Draw play icon
      final iconPaint = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.fill;
      
      // Draw circle for play button
      final center = Offset(size.width / 2, size.height / 2);
      canvas.drawCircle(center, 60, iconPaint);
      
      // Draw play triangle
      final trianglePaint = Paint()
        ..color = const ui.Color(0xFF7928CA)
        ..style = PaintingStyle.fill;
      
      final trianglePath = Path()
        ..moveTo(center.dx - 20, center.dy - 30)
        ..lineTo(center.dx - 20, center.dy + 30)
        ..lineTo(center.dx + 30, center.dy)
        ..close();
      
      canvas.drawPath(trianglePath, trianglePaint);
      
      // Draw VIB3 text
      final textPainter = TextPainter(
        text: const TextSpan(
          text: 'VIB3',
          style: TextStyle(
            color: Colors.white,
            fontSize: 48,
            fontWeight: FontWeight.bold,
            letterSpacing: 8,
          ),
        ),
        textDirection: TextDirection.ltr,
      );
      
      textPainter.layout();
      textPainter.paint(
        canvas,
        Offset(
          (size.width - textPainter.width) / 2,
          center.dy + 100,
        ),
      );
      
      // Convert to image
      final picture = recorder.endRecording();
      final image = await picture.toImage(size.width.toInt(), size.height.toInt());
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      
      if (byteData != null) {
        final pngBytes = byteData.buffer.asUint8List();
        
        // Convert PNG to JPEG using image package
        final decodedImage = decodeImage(pngBytes);
        if (decodedImage != null) {
          final jpgBytes = encodeJpg(decodedImage, quality: 85);
          
          final file = File(thumbnailPath);
          await file.writeAsBytes(jpgBytes);
          
          print('✅ Branded fallback thumbnail generated: $thumbnailPath');
          return file;
        }
      }
      
      return null;
    } catch (e) {
      print('❌ Failed to generate fallback thumbnail: $e');
      return null;
    }
  }
  
  /// Generate thumbnail from video URL (for existing videos)
  static Future<String?> generateThumbnailUrl(String videoUrl) {
    // Try common thumbnail URL patterns
    if (videoUrl.contains('.mp4')) {
      // Check if thumbnail exists at common locations
      final patterns = [
        videoUrl.replaceAll('/videos/', '/thumbnails/').replaceAll('.mp4', '.jpg'),
        videoUrl.replaceAll('.mp4', '_thumb.jpg'),
        videoUrl.replaceAll('.mp4', '-thumb.jpg'),
        videoUrl.replaceAll('.mp4', '.jpg'),
      ];
      
      // In production, you'd check if these URLs actually exist
      // For now, return the first pattern
      return Future.value(patterns.first);
    }
    
    return Future.value(null);
  }
}