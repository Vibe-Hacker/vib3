import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:camera/camera.dart';
import 'package:image/image.dart' as img;
import 'dart:math' as math;

/// Processes camera frames with real-time filters
class RealTimeFilterProcessor {
  static final RealTimeFilterProcessor _instance = RealTimeFilterProcessor._internal();
  factory RealTimeFilterProcessor() => _instance;
  RealTimeFilterProcessor._internal();

  String? _currentFilter;
  double _filterIntensity = 1.0;
  Map<String, double> _beautySettings = {
    'smooth': 0.0,
    'brightness': 0.0,
    'contrast': 0.0,
    'saturation': 0.0,
  };

  void setFilter(String? filterId, {double intensity = 1.0}) {
    _currentFilter = filterId;
    _filterIntensity = intensity;
  }

  void setBeautySettings(Map<String, double> settings) {
    _beautySettings = {...settings};
  }

  /// Process a camera frame with the current filter
  Future<ui.Image?> processFrame(CameraImage cameraImage) async {
    try {
      // Convert camera image to bytes
      final imageBytes = _convertCameraImageToBytes(cameraImage);
      if (imageBytes == null) return null;

      // Decode image
      var image = img.decodeImage(imageBytes);
      if (image == null) return null;

      // Apply beauty settings first
      if (_beautySettings['smooth']! > 0 || 
          _beautySettings['brightness']! != 0 ||
          _beautySettings['contrast']! != 0 ||
          _beautySettings['saturation']! != 0) {
        image = _applyBeautySettings(image);
      }

      // Apply selected filter
      if (_currentFilter != null) {
        image = _applyFilter(image, _currentFilter!, _filterIntensity);
      }

      // Convert back to ui.Image
      final pngBytes = img.encodePng(image);
      final codec = await ui.instantiateImageCodec(pngBytes);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('Error processing filter frame: $e');
      return null;
    }
  }

  img.Image _applyBeautySettings(img.Image image) {
    var result = image;

    // Apply smoothing (simple blur)
    if (_beautySettings['smooth']! > 0) {
      final smoothAmount = (_beautySettings['smooth']! * 3).toInt();
      if (smoothAmount > 0) {
        result = img.gaussianBlur(result, radius: smoothAmount);
      }
    }

    // Apply brightness
    if (_beautySettings['brightness']! != 0) {
      final brightnessFactor = 1.0 + (_beautySettings['brightness']! * 0.5);
      result = img.adjustColor(result, brightness: brightnessFactor);
    }

    // Apply contrast
    if (_beautySettings['contrast']! != 0) {
      final contrastFactor = 1.0 + (_beautySettings['contrast']! * 0.5);
      result = img.adjustColor(result, contrast: contrastFactor);
    }

    // Apply saturation
    if (_beautySettings['saturation']! != 0) {
      final saturationFactor = 1.0 + (_beautySettings['saturation']! * 0.5);
      result = img.adjustColor(result, saturation: saturationFactor);
    }

    return result;
  }

  img.Image _applyFilter(img.Image image, String filterId, double intensity) {
    switch (filterId) {
      // Portrait filters
      case 'smooth':
        return _applySmoothFilter(image, intensity);
      case 'glow':
        return _applyGlowFilter(image, intensity);
      case 'beauty':
        return _applyBeautyFilter(image, intensity);
      case 'clear':
        return _applyClearFilter(image, intensity);
      
      // Landscape filters
      case 'vivid':
        return _applyVividFilter(image, intensity);
      case 'sunny':
        return _applySunnyFilter(image, intensity);
      case 'cloudy':
        return _applyCloudyFilter(image, intensity);
      case 'sunset':
        return _applySunsetFilter(image, intensity);
      
      // Vibe filters
      case 'vintage':
        return _applyVintageFilter(image, intensity);
      case 'retro':
        return _applyRetroFilter(image, intensity);
      case 'film':
        return _applyFilmFilter(image, intensity);
      case 'polaroid':
        return _applyPolaroidFilter(image, intensity);
      
      // Food filters
      case 'delicious':
        return _applyDeliciousFilter(image, intensity);
      case 'fresh':
        return _applyFreshFilter(image, intensity);
      case 'warm_meal':
        return _applyWarmMealFilter(image, intensity);
      case 'crispy':
        return _applyCrispyFilter(image, intensity);
      
      // Black & White filters
      case 'classic_bw':
        return _applyClassicBWFilter(image, intensity);
      case 'contrast_bw':
        return _applyContrastBWFilter(image, intensity);
      case 'soft_bw':
        return _applySoftBWFilter(image, intensity);
      case 'dramatic_bw':
        return _applyDramaticBWFilter(image, intensity);
      
      default:
        return image;
    }
  }

  // Portrait filters
  img.Image _applySmoothFilter(img.Image image, double intensity) {
    final smoothed = img.gaussianBlur(image, radius: (intensity * 2).toInt());
    return _blendImages(image, smoothed, intensity * 0.5);
  }

  img.Image _applyGlowFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image, brightness: 1.0 + (intensity * 0.2));
    result = img.adjustColor(result, contrast: 1.0 - (intensity * 0.1));
    return result;
  }

  img.Image _applyBeautyFilter(img.Image image, double intensity) {
    var result = _applySmoothFilter(image, intensity * 0.7);
    result = img.adjustColor(result, brightness: 1.0 + (intensity * 0.1));
    result = img.adjustColor(result, saturation: 1.0 + (intensity * 0.1));
    return result;
  }

  img.Image _applyClearFilter(img.Image image, double intensity) {
    return img.adjustColor(image, 
      contrast: 1.0 + (intensity * 0.2),
      brightness: 1.0 + (intensity * 0.1)
    );
  }

  // Landscape filters
  img.Image _applyVividFilter(img.Image image, double intensity) {
    return img.adjustColor(image,
      saturation: 1.0 + (intensity * 0.5),
      contrast: 1.0 + (intensity * 0.2)
    );
  }

  img.Image _applySunnyFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      brightness: 1.0 + (intensity * 0.2),
      saturation: 1.0 + (intensity * 0.1)
    );
    // Add warm tint
    return _applyColorTint(result, 255, 245, 200, intensity * 0.1);
  }

  img.Image _applyCloudyFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      brightness: 1.0 - (intensity * 0.1),
      saturation: 1.0 - (intensity * 0.2)
    );
    // Add cool tint
    return _applyColorTint(result, 200, 220, 255, intensity * 0.1);
  }

  img.Image _applySunsetFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      saturation: 1.0 + (intensity * 0.3)
    );
    // Add orange/pink tint
    return _applyColorTint(result, 255, 200, 150, intensity * 0.2);
  }

  // Vibe filters
  img.Image _applyVintageFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      saturation: 1.0 - (intensity * 0.3),
      contrast: 1.0 - (intensity * 0.1)
    );
    // Add sepia tone
    return _applySepiaTone(result, intensity);
  }

  img.Image _applyRetroFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      saturation: 1.0 + (intensity * 0.2),
      contrast: 1.0 + (intensity * 0.3)
    );
    // Add slight vignette
    return _applyVignette(result, intensity * 0.5);
  }

  img.Image _applyFilmFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      contrast: 1.0 + (intensity * 0.2)
    );
    // Add film grain
    return _addFilmGrain(result, intensity * 0.3);
  }

  img.Image _applyPolaroidFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      saturation: 1.0 - (intensity * 0.1),
      brightness: 1.0 + (intensity * 0.1)
    );
    return _applyColorTint(result, 250, 248, 240, intensity * 0.15);
  }

  // Food filters
  img.Image _applyDeliciousFilter(img.Image image, double intensity) {
    return img.adjustColor(image,
      saturation: 1.0 + (intensity * 0.4),
      contrast: 1.0 + (intensity * 0.1),
      brightness: 1.0 + (intensity * 0.1)
    );
  }

  img.Image _applyFreshFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      saturation: 1.0 + (intensity * 0.2),
      brightness: 1.0 + (intensity * 0.15)
    );
    return _applyColorTint(result, 240, 255, 240, intensity * 0.1);
  }

  img.Image _applyWarmMealFilter(img.Image image, double intensity) {
    var result = img.adjustColor(image,
      saturation: 1.0 + (intensity * 0.1)
    );
    return _applyColorTint(result, 255, 230, 200, intensity * 0.15);
  }

  img.Image _applyCrispyFilter(img.Image image, double intensity) {
    return img.adjustColor(image,
      contrast: 1.0 + (intensity * 0.3),
      saturation: 1.0 + (intensity * 0.2)
    );
  }

  // Black & White filters
  img.Image _applyClassicBWFilter(img.Image image, double intensity) {
    final grayscale = img.grayscale(image);
    return _blendImages(image, grayscale, intensity);
  }

  img.Image _applyContrastBWFilter(img.Image image, double intensity) {
    var grayscale = img.grayscale(image);
    grayscale = img.adjustColor(grayscale, contrast: 1.5);
    return _blendImages(image, grayscale, intensity);
  }

  img.Image _applySoftBWFilter(img.Image image, double intensity) {
    var grayscale = img.grayscale(image);
    grayscale = img.adjustColor(grayscale, contrast: 0.8, brightness: 1.1);
    return _blendImages(image, grayscale, intensity);
  }

  img.Image _applyDramaticBWFilter(img.Image image, double intensity) {
    var grayscale = img.grayscale(image);
    grayscale = img.adjustColor(grayscale, contrast: 2.0);
    return _blendImages(image, grayscale, intensity);
  }

  // Helper methods
  img.Image _applyColorTint(img.Image image, int r, int g, int b, double opacity) {
    final result = img.Image.from(image);
    
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final blended = img.ColorRgb8(
          (pixel.r * (1 - opacity) + r * opacity).toInt(),
          (pixel.g * (1 - opacity) + g * opacity).toInt(),
          (pixel.b * (1 - opacity) + b * opacity).toInt(),
        );
        result.setPixel(x, y, blended);
      }
    }
    
    return result;
  }

  img.Image _applySepiaTone(img.Image image, double intensity) {
    final result = img.Image.from(image);
    
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        
        final tr = (0.393 * pixel.r + 0.769 * pixel.g + 0.189 * pixel.b).clamp(0, 255).toInt();
        final tg = (0.349 * pixel.r + 0.686 * pixel.g + 0.168 * pixel.b).clamp(0, 255).toInt();
        final tb = (0.272 * pixel.r + 0.534 * pixel.g + 0.131 * pixel.b).clamp(0, 255).toInt();
        
        final blended = img.ColorRgb8(
          (pixel.r * (1 - intensity) + tr * intensity).toInt(),
          (pixel.g * (1 - intensity) + tg * intensity).toInt(),
          (pixel.b * (1 - intensity) + tb * intensity).toInt(),
        );
        result.setPixel(x, y, blended);
      }
    }
    
    return result;
  }

  img.Image _applyVignette(img.Image image, double intensity) {
    final result = img.Image.from(image);
    final centerX = image.width / 2;
    final centerY = image.height / 2;
    final maxDist = math.sqrt(centerX * centerX + centerY * centerY);
    
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final dist = math.sqrt(
          math.pow(x - centerX, 2) + math.pow(y - centerY, 2)
        );
        final vignette = 1.0 - (dist / maxDist * intensity);
        
        result.setPixel(x, y, img.ColorRgb8(
          (pixel.r * vignette).toInt(),
          (pixel.g * vignette).toInt(),
          (pixel.b * vignette).toInt(),
        ));
      }
    }
    
    return result;
  }

  img.Image _addFilmGrain(img.Image image, double intensity) {
    final result = img.Image.from(image);
    final random = math.Random();
    
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final noise = (random.nextDouble() - 0.5) * 255 * intensity;
        
        result.setPixel(x, y, img.ColorRgb8(
          (pixel.r + noise).clamp(0, 255).toInt(),
          (pixel.g + noise).clamp(0, 255).toInt(),
          (pixel.b + noise).clamp(0, 255).toInt(),
        ));
      }
    }
    
    return result;
  }

  img.Image _blendImages(img.Image base, img.Image overlay, double opacity) {
    final result = img.Image.from(base);
    
    for (int y = 0; y < base.height; y++) {
      for (int x = 0; x < base.width; x++) {
        final basePixel = base.getPixel(x, y);
        final overlayPixel = overlay.getPixel(x, y);
        
        result.setPixel(x, y, img.ColorRgb8(
          (basePixel.r * (1 - opacity) + overlayPixel.r * opacity).toInt(),
          (basePixel.g * (1 - opacity) + overlayPixel.g * opacity).toInt(),
          (basePixel.b * (1 - opacity) + overlayPixel.b * opacity).toInt(),
        ));
      }
    }
    
    return result;
  }

  Uint8List? _convertCameraImageToBytes(CameraImage cameraImage) {
    try {
      final int width = cameraImage.width;
      final int height = cameraImage.height;
      
      // Create RGBA image
      final img.Image image = img.Image(width: width, height: height);
      
      // Convert YUV420 to RGB
      final int uvRowStride = cameraImage.planes[1].bytesPerRow;
      final int uvPixelStride = cameraImage.planes[1].bytesPerPixel ?? 2;
      
      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          final int uvIndex = uvPixelStride * (x / 2).floor() + uvRowStride * (y / 2).floor();
          final int yIndex = y * width + x;
          
          final int yValue = cameraImage.planes[0].bytes[yIndex];
          final int uValue = cameraImage.planes[1].bytes[uvIndex];
          final int vValue = cameraImage.planes[2].bytes[uvIndex];
          
          // YUV to RGB conversion
          final int r = (yValue + 1.402 * (vValue - 128)).clamp(0, 255).toInt();
          final int g = (yValue - 0.344136 * (uValue - 128) - 0.714136 * (vValue - 128)).clamp(0, 255).toInt();
          final int b = (yValue + 1.772 * (uValue - 128)).clamp(0, 255).toInt();
          
          image.setPixelRgb(x, y, r, g, b);
        }
      }
      
      return Uint8List.fromList(img.encodePng(image));
    } catch (e) {
      print('Error converting camera image: $e');
      return null;
    }
  }
}