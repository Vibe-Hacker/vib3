import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image/image.dart' as img;
import 'dart:math' as math;

class GreenScreenProcessor {
  static final GreenScreenProcessor _instance = GreenScreenProcessor._internal();
  factory GreenScreenProcessor() => _instance;
  GreenScreenProcessor._internal();

  bool _isInitialized = false;
  ui.Image? _backgroundImage;
  Color _chromaKeyColor = Colors.green;
  double _threshold = 0.4;
  double _smoothing = 0.1;
  bool _isEnabled = false;

  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      _isInitialized = true;
      print('✅ Green Screen Processor initialized');
    } catch (e) {
      print('❌ Failed to initialize Green Screen Processor: $e');
    }
  }

  void setBackground(ui.Image? backgroundImage) {
    _backgroundImage = backgroundImage;
    print('🖼️ Background image set: ${backgroundImage != null ? "loaded" : "cleared"}');
  }

  void setChromaKeyColor(Color color) {
    _chromaKeyColor = color;
    print('🎨 Chroma key color set: $color');
  }

  void setThreshold(double threshold) {
    _threshold = threshold.clamp(0.0, 1.0);
    print('📊 Threshold set: $_threshold');
  }

  void setSmoothing(double smoothing) {
    _smoothing = smoothing.clamp(0.0, 1.0);
    print('🔧 Smoothing set: $_smoothing');
  }

  void setEnabled(bool enabled) {
    _isEnabled = enabled;
    print('🎬 Green screen ${enabled ? "enabled" : "disabled"}');
  }

  Future<ui.Image?> processFrame(CameraImage cameraImage) async {
    if (!_isInitialized || !_isEnabled || _backgroundImage == null) {
      return null;
    }

    try {
      // Convert camera image to processable format
      final imageBytes = _convertCameraImageToBytes(cameraImage);
      if (imageBytes == null) return null;

      var foregroundImage = img.decodeImage(imageBytes);
      if (foregroundImage == null) return null;

      // Resize foreground to match background if needed
      final bgWidth = _backgroundImage!.width;
      final bgHeight = _backgroundImage!.height;
      
      if (foregroundImage.width != bgWidth || foregroundImage.height != bgHeight) {
        foregroundImage = img.copyResize(foregroundImage, width: bgWidth, height: bgHeight);
      }

      // Convert background to img.Image for processing
      final backgroundBytes = await _imageToBytes(_backgroundImage!);
      var backgroundImage = img.decodeImage(backgroundBytes);
      if (backgroundImage == null) return null;

      // Apply chroma key effect
      final resultImage = _applyChromaKey(foregroundImage, backgroundImage);

      // Convert result back to ui.Image
      final resultBytes = img.encodePng(resultImage);
      final codec = await ui.instantiateImageCodec(resultBytes);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('❌ Error processing green screen frame: $e');
      return null;
    }
  }

  img.Image _applyChromaKey(img.Image foreground, img.Image background) {
    final width = foreground.width;
    final height = foreground.height;
    final result = img.Image(width: width, height: height);

    // Pre-calculate chroma key values for efficiency
    final chromaR = _chromaKeyColor.red;
    final chromaG = _chromaKeyColor.green;
    final chromaB = _chromaKeyColor.blue;

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final foregroundPixel = foreground.getPixel(x, y);
        final backgroundPixel = background.getPixel(x, y);
        
        // Extract RGB values
        final fgR = foregroundPixel.r.toInt();
        final fgG = foregroundPixel.g.toInt();
        final fgB = foregroundPixel.b.toInt();
        
        // Calculate distance from chroma key color
        final distance = _calculateColorDistance(fgR, fgG, fgB, chromaR, chromaG, chromaB);
        
        // Determine alpha based on distance and threshold
        double alpha = 1.0;
        if (distance < _threshold) {
          // Pixel should be transparent (replaced with background)
          alpha = 0.0;
        } else if (distance < _threshold + _smoothing) {
          // Smooth transition zone
          alpha = (distance - _threshold) / _smoothing;
        }
        
        // Blend foreground and background based on alpha
        if (alpha <= 0.0) {
          // Use background pixel
          result.setPixel(x, y, backgroundPixel);
        } else if (alpha >= 1.0) {
          // Use foreground pixel
          result.setPixel(x, y, foregroundPixel);
        } else {
          // Blend pixels
          final bgR = backgroundPixel.r.toInt();
          final bgG = backgroundPixel.g.toInt();
          final bgB = backgroundPixel.b.toInt();
          
          final blendedR = (fgR * alpha + bgR * (1.0 - alpha)).round();
          final blendedG = (fgG * alpha + bgG * (1.0 - alpha)).round();
          final blendedB = (fgB * alpha + bgB * (1.0 - alpha)).round();
          
          result.setPixelRgb(x, y, blendedR, blendedG, blendedB);
        }
      }
    }

    return result;
  }

  double _calculateColorDistance(int r1, int g1, int b1, int r2, int g2, int b2) {
    // Use Euclidean distance in RGB space
    final dr = r1 - r2;
    final dg = g1 - g2;
    final db = b1 - b2;
    
    // Normalize to 0-1 range
    return math.sqrt(dr * dr + dg * dg + db * db) / (255 * math.sqrt(3));
  }

  // Alternative: HSV-based chroma key for better green screen performance
  img.Image _applyHSVChromaKey(img.Image foreground, img.Image background) {
    final width = foreground.width;
    final height = foreground.height;
    final result = img.Image(width: width, height: height);

    // Convert chroma key color to HSV
    final chromaHSV = _rgbToHSV(_chromaKeyColor.red, _chromaKeyColor.green, _chromaKeyColor.blue);
    final targetHue = chromaHSV[0];
    final targetSat = chromaHSV[1];

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final foregroundPixel = foreground.getPixel(x, y);
        final backgroundPixel = background.getPixel(x, y);
        
        final fgR = foregroundPixel.r.toInt();
        final fgG = foregroundPixel.g.toInt();
        final fgB = foregroundPixel.b.toInt();
        
        // Convert to HSV
        final hsv = _rgbToHSV(fgR, fgG, fgB);
        final hue = hsv[0];
        final sat = hsv[1];
        final val = hsv[2];
        
        // Calculate hue difference (accounting for circular nature)
        var hueDiff = (hue - targetHue).abs();
        if (hueDiff > 180) hueDiff = 360 - hueDiff;
        
        // Calculate saturation difference
        final satDiff = (sat - targetSat).abs();
        
        // Determine if pixel should be keyed out
        final hueMatch = hueDiff < (30 * _threshold); // Hue tolerance
        final satMatch = satDiff < (50 * _threshold); // Saturation tolerance
        final valThreshold = val > (30); // Minimum brightness
        
        if (hueMatch && satMatch && valThreshold) {
          // Replace with background
          double alpha = 0.0;
          
          // Apply smoothing
          if (_smoothing > 0) {
            final edgeFactor = math.min(hueDiff / 30, satDiff / 50);
            alpha = (edgeFactor / _threshold).clamp(0.0, 1.0);
          }
          
          if (alpha <= 0.0) {
            result.setPixel(x, y, backgroundPixel);
          } else {
            // Blend
            final bgR = backgroundPixel.r.toInt();
            final bgG = backgroundPixel.g.toInt();
            final bgB = backgroundPixel.b.toInt();
            
            final blendedR = (fgR * alpha + bgR * (1.0 - alpha)).round();
            final blendedG = (fgG * alpha + bgG * (1.0 - alpha)).round();
            final blendedB = (fgB * alpha + bgB * (1.0 - alpha)).round();
            
            result.setPixelRgb(x, y, blendedR, blendedG, blendedB);
          }
        } else {
          // Keep foreground pixel
          result.setPixel(x, y, foregroundPixel);
        }
      }
    }

    return result;
  }

  List<double> _rgbToHSV(int r, int g, int b) {
    final rNorm = r / 255.0;
    final gNorm = g / 255.0;
    final bNorm = b / 255.0;
    
    final maxVal = math.max(rNorm, math.max(gNorm, bNorm));
    final minVal = math.min(rNorm, math.min(gNorm, bNorm));
    final delta = maxVal - minVal;
    
    // Hue calculation
    double hue = 0;
    if (delta != 0) {
      if (maxVal == rNorm) {
        hue = ((gNorm - bNorm) / delta) % 6;
      } else if (maxVal == gNorm) {
        hue = (bNorm - rNorm) / delta + 2;
      } else {
        hue = (rNorm - gNorm) / delta + 4;
      }
    }
    hue *= 60;
    if (hue < 0) hue += 360;
    
    // Saturation calculation
    final saturation = maxVal == 0 ? 0 : (delta / maxVal) * 100;
    
    // Value calculation
    final value = maxVal * 100;
    
    return [hue, saturation, value];
  }

  // Advanced chroma key with spill suppression
  img.Image _applyAdvancedChromaKey(img.Image foreground, img.Image background) {
    final width = foreground.width;
    final height = foreground.height;
    final result = img.Image(width: width, height: height);

    for (int y = 0; y < height; y++) {
      for (int x = 0; x < width; x++) {
        final foregroundPixel = foreground.getPixel(x, y);
        final backgroundPixel = background.getPixel(x, y);
        
        final fgR = foregroundPixel.r.toInt();
        final fgG = foregroundPixel.g.toInt();
        final fgB = foregroundPixel.b.toInt();
        
        // Calculate green spill suppression
        final greenSpill = _calculateGreenSpill(fgR, fgG, fgB);
        var adjustedR = fgR;
        var adjustedG = fgG;
        var adjustedB = fgB;
        
        if (greenSpill > 0.1) {
          // Suppress green spill
          adjustedG = (fgG * (1.0 - greenSpill * 0.5)).round();
          adjustedR = (fgR * (1.0 + greenSpill * 0.1)).round();
          adjustedB = (fgB * (1.0 + greenSpill * 0.1)).round();
        }
        
        // Apply standard chroma key
        final distance = _calculateColorDistance(adjustedR, adjustedG, adjustedB, 
          _chromaKeyColor.red, _chromaKeyColor.green, _chromaKeyColor.blue);
        
        double alpha = 1.0;
        if (distance < _threshold) {
          alpha = 0.0;
        } else if (distance < _threshold + _smoothing) {
          alpha = (distance - _threshold) / _smoothing;
        }
        
        if (alpha <= 0.0) {
          result.setPixel(x, y, backgroundPixel);
        } else if (alpha >= 1.0) {
          result.setPixelRgb(x, y, 
            adjustedR.clamp(0, 255), 
            adjustedG.clamp(0, 255), 
            adjustedB.clamp(0, 255));
        } else {
          final bgR = backgroundPixel.r.toInt();
          final bgG = backgroundPixel.g.toInt();
          final bgB = backgroundPixel.b.toInt();
          
          final blendedR = (adjustedR * alpha + bgR * (1.0 - alpha)).round();
          final blendedG = (adjustedG * alpha + bgG * (1.0 - alpha)).round();
          final blendedB = (adjustedB * alpha + bgB * (1.0 - alpha)).round();
          
          result.setPixelRgb(x, y, blendedR, blendedG, blendedB);
        }
      }
    }

    return result;
  }

  double _calculateGreenSpill(int r, int g, int b) {
    // Calculate how much green light is spilling onto the subject
    final maxNonGreen = math.max(r, b);
    if (maxNonGreen == 0) return 0.0;
    
    final greenRatio = g / maxNonGreen;
    return (greenRatio - 1.0).clamp(0.0, 1.0);
  }

  // Helper methods
  Uint8List? _convertCameraImageToBytes(CameraImage cameraImage) {
    try {
      if (cameraImage.format.group == ImageFormatGroup.yuv420) {
        return _convertYUV420ToImage(cameraImage);
      } else if (cameraImage.format.group == ImageFormatGroup.bgra8888) {
        return cameraImage.planes.first.bytes;
      }
      return null;
    } catch (e) {
      print('Error converting camera image to bytes: $e');
      return null;
    }
  }

  Uint8List _convertYUV420ToImage(CameraImage cameraImage) {
    final int width = cameraImage.width;
    final int height = cameraImage.height;
    final int uvRowStride = cameraImage.planes[1].bytesPerRow;
    final int uvPixelStride = cameraImage.planes[1].bytesPerPixel!;

    final image = img.Image(width: width, height: height);

    for (int x = 0; x < width; x++) {
      for (int y = 0; y < height; y++) {
        final int uvIndex = uvPixelStride * (x / 2).floor() + uvRowStride * (y / 2).floor();
        final int index = y * width + x;

        final yp = cameraImage.planes[0].bytes[index];
        final up = cameraImage.planes[1].bytes[uvIndex];
        final vp = cameraImage.planes[2].bytes[uvIndex];

        int r = (yp + vp * 1436 / 1024 - 179).round().clamp(0, 255);
        int g = (yp - up * 46549 / 131072 + 44 - vp * 93604 / 131072 + 91).round().clamp(0, 255);
        int b = (yp + up * 1814 / 1024 - 227).round().clamp(0, 255);

        image.setPixelRgb(x, y, r, g, b);
      }
    }

    return Uint8List.fromList(img.encodePng(image));
  }

  Future<Uint8List> _imageToBytes(ui.Image image) async {
    final ByteData? byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData!.buffer.asUint8List();
  }

  void dispose() {
    _isInitialized = false;
    _backgroundImage?.dispose();
    _backgroundImage = null;
  }
}