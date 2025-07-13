import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:google_mlkit_selfie_segmentation/google_mlkit_selfie_segmentation.dart';
import 'package:image/image.dart' as img;
import '../screens/video_creator/modules/ar_effects_module.dart';

class AREffectsProcessor {
  static final AREffectsProcessor _instance = AREffectsProcessor._internal();
  factory AREffectsProcessor() => _instance;
  AREffectsProcessor._internal();

  late FaceDetector _faceDetector;
  late SelfieSegmenter _segmenter;
  bool _isInitialized = false;
  AREffect? _currentEffect;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Initialize face detector for AR tracking
      _faceDetector = FaceDetector(
        options: FaceDetectorOptions(
          enableClassification: true,
          enableLandmarks: true,
          enableContours: true,
          enableTracking: true,
          minFaceSize: 0.15,
          performanceMode: FaceDetectorMode.fast,
        ),
      );

      // Initialize selfie segmenter for background effects
      _segmenter = SelfieSegmenter(
        mode: SegmenterMode.stream,
      );

      _isInitialized = true;
      print('✅ AR Effects Processor initialized');
    } catch (e) {
      print('❌ Failed to initialize AR Effects Processor: $e');
    }
  }

  void setCurrentEffect(AREffect? effect) {
    _currentEffect = effect;
    print('🎭 AR Effect set: ${effect?.name ?? "none"}');
  }

  Future<ui.Image?> processFrame(CameraImage cameraImage) async {
    if (!_isInitialized || _currentEffect == null) return null;

    try {
      // Convert camera image to ML Kit input image
      final inputImage = _convertCameraImage(cameraImage);
      if (inputImage == null) return null;

      // Process based on effect type
      switch (_currentEffect!.type) {
        case AREffectType.faceMask:
        case AREffectType.accessory:
        case AREffectType.makeup:
        case AREffectType.distortion:
          return await _processFaceEffect(inputImage, cameraImage);
        
        case AREffectType.background:
          return await _processBackgroundEffect(inputImage, cameraImage);
        
        case AREffectType.object3D:
          return await _process3DObjectEffect(inputImage, cameraImage);
      }
    } catch (e) {
      print('❌ Error processing AR frame: $e');
      return null;
    }
  }

  Future<ui.Image?> _processFaceEffect(InputImage inputImage, CameraImage cameraImage) async {
    try {
      // Detect faces
      final faces = await _faceDetector.processImage(inputImage);
      if (faces.isEmpty) return null;

      // Convert camera image to processable format
      final imageBytes = _convertCameraImageToBytes(cameraImage);
      if (imageBytes == null) return null;

      var image = img.decodeImage(imageBytes);
      if (image == null) return null;

      // Apply face-based effects
      for (final face in faces) {
        final processedImage = await _applyFaceEffect(image!, face, _currentEffect!);
        if (processedImage != null) {
          image = processedImage;
        }
      }

      // Convert back to ui.Image
      final pngBytes = img.encodePng(image!);
      final codec = await ui.instantiateImageCodec(pngBytes);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('❌ Error processing face effect: $e');
      return null;
    }
  }

  Future<ui.Image?> _processBackgroundEffect(InputImage inputImage, CameraImage cameraImage) async {
    try {
      // Get segmentation mask
      final mask = await _segmenter.processImage(inputImage);
      if (mask == null) return null;

      // Convert camera image to processable format
      final imageBytes = _convertCameraImageToBytes(cameraImage);
      if (imageBytes == null) return null;

      var image = img.decodeImage(imageBytes);
      if (image == null) return null;

      // Apply background effect
      image = await _applyBackgroundEffect(image, mask, _currentEffect!);

      // Convert back to ui.Image
      final pngBytes = img.encodePng(image);
      final codec = await ui.instantiateImageCodec(pngBytes);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('❌ Error processing background effect: $e');
      return null;
    }
  }

  Future<ui.Image?> _process3DObjectEffect(InputImage inputImage, CameraImage cameraImage) async {
    try {
      // For 3D objects, we need face position for anchoring
      final faces = await _faceDetector.processImage(inputImage);
      
      final imageBytes = _convertCameraImageToBytes(cameraImage);
      if (imageBytes == null) return null;

      var image = img.decodeImage(imageBytes);
      if (image == null) return null;

      // Apply 3D object effects
      image = await _apply3DObjectEffect(image, faces, _currentEffect!);

      // Convert back to ui.Image
      final pngBytes = img.encodePng(image);
      final codec = await ui.instantiateImageCodec(pngBytes);
      final frame = await codec.getNextFrame();
      return frame.image;
    } catch (e) {
      print('❌ Error processing 3D object effect: $e');
      return null;
    }
  }

  Future<img.Image> _applyFaceEffect(img.Image image, Face face, AREffect effect) async {
    final boundingBox = face.boundingBox;
    
    switch (effect.id) {
      case 'cat_ears':
        return _applyCatEars(image, face);
      case 'dog_face':
        return _applyDogFace(image, face);
      case 'sunglasses':
        return _applySunglasses(image, face);
      case 'big_eyes':
        return _applyBigEyes(image, face);
      case 'blush':
        return _applyBlush(image, face);
      default:
        return _applyGenericFaceEffect(image, face, effect);
    }
  }

  Future<img.Image> _applyBackgroundEffect(img.Image image, SegmentationMask mask, AREffect effect) async {
    switch (effect.id) {
      case 'bokeh':
        return _applyBokehEffect(image, mask);
      case 'galaxy':
        return _applyGalaxyBackground(image, mask);
      case 'neon':
        return _applyNeonOutline(image, mask);
      default:
        return _applyGenericBackgroundEffect(image, mask, effect);
    }
  }

  Future<img.Image> _apply3DObjectEffect(img.Image image, List<Face> faces, AREffect effect) async {
    switch (effect.id) {
      case 'floating_hearts':
        return _applyFloatingHearts(image, faces);
      case 'butterflies':
        return _applyButterflies(image, faces);
      case 'snow':
        return _applySnowEffect(image);
      default:
        return _applyGeneric3DEffect(image, faces, effect);
    }
  }

  // Specific effect implementations
  img.Image _applyCatEars(img.Image image, Face face) {
    final landmarks = face.landmarks;
    if (landmarks[FaceLandmarkType.leftEar] == null || landmarks[FaceLandmarkType.rightEar] == null) {
      return image;
    }

    // Draw cat ears above the detected ear positions
    final leftEar = landmarks[FaceLandmarkType.leftEar]!.position;
    final rightEar = landmarks[FaceLandmarkType.rightEar]!.position;
    
    // Create triangular cat ears
    img.drawLine(image, 
      x1: leftEar.x.toInt() - 20, y1: leftEar.y.toInt() - 30,
      x2: leftEar.x.toInt(), y2: leftEar.y.toInt() - 60,
      color: img.ColorRgb8(255, 192, 203), // Pink
      thickness: 3);
    
    img.drawLine(image,
      x1: leftEar.x.toInt(), y1: leftEar.y.toInt() - 60,
      x2: leftEar.x.toInt() + 20, y2: leftEar.y.toInt() - 30,
      color: img.ColorRgb8(255, 192, 203),
      thickness: 3);
    
    img.drawLine(image,
      x1: rightEar.x.toInt() - 20, y1: rightEar.y.toInt() - 30,
      x2: rightEar.x.toInt(), y2: rightEar.y.toInt() - 60,
      color: img.ColorRgb8(255, 192, 203),
      thickness: 3);
    
    img.drawLine(image,
      x1: rightEar.x.toInt(), y1: rightEar.y.toInt() - 60,
      x2: rightEar.x.toInt() + 20, y2: rightEar.y.toInt() - 30,
      color: img.ColorRgb8(255, 192, 203),
      thickness: 3);

    return image;
  }

  img.Image _applyDogFace(img.Image image, Face face) {
    final landmarks = face.landmarks;
    
    // Add dog nose
    if (landmarks[FaceLandmarkType.noseBase] != null) {
      final nose = landmarks[FaceLandmarkType.noseBase]!.position;
      img.fillCircle(image, 
        x: nose.x.toInt(), 
        y: nose.y.toInt(), 
        radius: 8, 
        color: img.ColorRgb8(0, 0, 0));
    }
    
    // Add dog tongue
    if (landmarks[FaceLandmarkType.bottomMouth] != null) {
      final mouth = landmarks[FaceLandmarkType.bottomMouth]!.position;
      img.fillRect(image,
        x1: mouth.x.toInt() - 10,
        y1: mouth.y.toInt(),
        x2: mouth.x.toInt() + 10,
        y2: mouth.y.toInt() + 20,
        color: img.ColorRgb8(255, 182, 193)); // Light pink tongue
    }

    return image;
  }

  img.Image _applySunglasses(img.Image image, Face face) {
    final landmarks = face.landmarks;
    if (landmarks[FaceLandmarkType.leftEye] == null || landmarks[FaceLandmarkType.rightEye] == null) {
      return image;
    }

    final leftEye = landmarks[FaceLandmarkType.leftEye]!.position;
    final rightEye = landmarks[FaceLandmarkType.rightEye]!.position;
    
    // Draw sunglasses lenses
    img.fillCircle(image,
      x: leftEye.x.toInt(),
      y: leftEye.y.toInt(),
      radius: 25,
      color: img.ColorRgb8(0, 0, 0)); // Black lens
    
    img.fillCircle(image,
      x: rightEye.x.toInt(),
      y: rightEye.y.toInt(),
      radius: 25,
      color: img.ColorRgb8(0, 0, 0)); // Black lens
    
    // Draw bridge
    img.drawLine(image,
      x1: leftEye.x.toInt() + 25,
      y1: leftEye.y.toInt(),
      x2: rightEye.x.toInt() - 25,
      y2: rightEye.y.toInt(),
      color: img.ColorRgb8(0, 0, 0),
      thickness: 3);

    return image;
  }

  img.Image _applyBigEyes(img.Image image, Face face) {
    final landmarks = face.landmarks;
    if (landmarks[FaceLandmarkType.leftEye] == null || landmarks[FaceLandmarkType.rightEye] == null) {
      return image;
    }

    final leftEye = landmarks[FaceLandmarkType.leftEye]!.position;
    final rightEye = landmarks[FaceLandmarkType.rightEye]!.position;
    
    // Draw enlarged eyes
    img.drawCircle(image,
      x: leftEye.x.toInt(),
      y: leftEye.y.toInt(),
      radius: 35,
      color: img.ColorRgb8(255, 255, 255));
    
    img.fillCircle(image,
      x: leftEye.x.toInt(),
      y: leftEye.y.toInt(),
      radius: 15,
      color: img.ColorRgb8(0, 0, 0)); // Pupil
    
    img.drawCircle(image,
      x: rightEye.x.toInt(),
      y: rightEye.y.toInt(),
      radius: 35,
      color: img.ColorRgb8(255, 255, 255));
    
    img.fillCircle(image,
      x: rightEye.x.toInt(),
      y: rightEye.y.toInt(),
      radius: 15,
      color: img.ColorRgb8(0, 0, 0)); // Pupil

    return image;
  }

  img.Image _applyBlush(img.Image image, Face face) {
    final leftCheek = face.landmarks[FaceLandmarkType.leftCheek]?.position;
    final rightCheek = face.landmarks[FaceLandmarkType.rightCheek]?.position;
    
    if (leftCheek != null) {
      img.fillCircle(image,
        x: leftCheek.x.toInt(),
        y: leftCheek.y.toInt(),
        radius: 20,
        color: img.ColorRgb8(255, 182, 193)); // Light pink
    }
    
    if (rightCheek != null) {
      img.fillCircle(image,
        x: rightCheek.x.toInt(),
        y: rightCheek.y.toInt(),
        radius: 20,
        color: img.ColorRgb8(255, 182, 193)); // Light pink
    }

    return image;
  }

  img.Image _applyBokehEffect(img.Image image, SegmentationMask mask) {
    // Apply blur to background areas (where mask confidence is low)
    final blurredImage = img.gaussianBlur(image, radius: 10);
    
    // Composite based on segmentation mask
    // This is a simplified version - in practice you'd use the actual mask data
    // Apply blur effect by overlaying
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final blurPixel = blurredImage.getPixel(x, y);
        image.setPixel(x, y, blurPixel);
      }
    }
    return image;
  }

  img.Image _applyGalaxyBackground(img.Image image, SegmentationMask mask) {
    // Create a galaxy-like background
    final width = image.width;
    final height = image.height;
    
    // Create starfield effect for background
    for (int i = 0; i < 100; i++) {
      final x = (i * 37) % width;
      final y = (i * 73) % height;
      image.setPixel(x, y, img.ColorRgb8(255, 255, 255));
    }
    
    return image;
  }

  img.Image _applyNeonOutline(img.Image image, SegmentationMask mask) {
    // Apply neon glow effect around person outline
    final outlined = img.sobel(image);
    // Apply outline effect
    for (int y = 0; y < image.height; y++) {
      for (int x = 0; x < image.width; x++) {
        final outlinePixel = outlined.getPixel(x, y);
        if (outlinePixel.r > 0 || outlinePixel.g > 0 || outlinePixel.b > 0) {
          image.setPixel(x, y, outlinePixel);
        }
      }
    }
    return image;
  }

  img.Image _applyFloatingHearts(img.Image image, List<Face> faces) {
    // Add floating hearts above faces
    for (final face in faces) {
      final center = face.boundingBox.center;
      for (int i = 0; i < 5; i++) {
        final x = center.dx.toInt() + (i * 20) - 40;
        final y = center.dy.toInt() - 50 - (i * 10);
        _drawHeart(image, x, y);
      }
    }
    return image;
  }

  img.Image _applyButterflies(img.Image image, List<Face> faces) {
    // Add butterfly sprites around faces
    for (final face in faces) {
      final center = face.boundingBox.center;
      for (int i = 0; i < 3; i++) {
        final x = center.dx.toInt() + (i * 30) - 30;
        final y = center.dy.toInt() - 30 - (i * 15);
        _drawButterfly(image, x, y);
      }
    }
    return image;
  }

  img.Image _applySnowEffect(img.Image image) {
    // Add falling snow particles
    final width = image.width;
    final height = image.height;
    
    for (int i = 0; i < 50; i++) {
      final x = (i * 67) % width;
      final y = (i * 89) % height;
      img.fillCircle(image, x: x, y: y, radius: 2, 
        color: img.ColorRgb8(255, 255, 255));
    }
    
    return image;
  }

  void _drawHeart(img.Image image, int x, int y) {
    // Simple heart shape using circles and triangle
    img.fillCircle(image, x: x - 5, y: y, radius: 5, 
      color: img.ColorRgb8(255, 20, 147));
    img.fillCircle(image, x: x + 5, y: y, radius: 5, 
      color: img.ColorRgb8(255, 20, 147));
    // Triangle for bottom of heart
    // Simplified version - in practice would use proper triangle drawing
  }

  void _drawButterfly(img.Image image, int x, int y) {
    // Simple butterfly using ellipses
    img.drawCircle(image, x: x, y: y, radius: 8, 
      color: img.ColorRgb8(255, 165, 0));
    img.drawCircle(image, x: x - 6, y: y - 3, radius: 4, 
      color: img.ColorRgb8(255, 165, 0));
    img.drawCircle(image, x: x + 6, y: y - 3, radius: 4, 
      color: img.ColorRgb8(255, 165, 0));
  }

  // Generic fallback methods
  img.Image _applyGenericFaceEffect(img.Image image, Face face, AREffect effect) {
    // Fallback for unimplemented face effects
    final center = face.boundingBox.center;
    img.drawRect(image,
      x1: center.dx.toInt() - 20,
      y1: center.dy.toInt() - 20,
      x2: center.dx.toInt() + 20,
      y2: center.dy.toInt() + 20,
      color: img.ColorRgb8(0, 206, 209), // VIB3 cyan
      thickness: 2);
    return image;
  }

  img.Image _applyGenericBackgroundEffect(img.Image image, SegmentationMask mask, AREffect effect) {
    // Fallback for unimplemented background effects
    return img.colorOffset(image, red: 10, green: 10, blue: 20);
  }

  img.Image _applyGeneric3DEffect(img.Image image, List<Face> faces, AREffect effect) {
    // Fallback for unimplemented 3D effects
    return image;
  }

  // Helper methods
  InputImage? _convertCameraImage(CameraImage cameraImage) {
    try {
      final allBytes = WriteBuffer();
      for (final Plane plane in cameraImage.planes) {
        allBytes.putUint8List(plane.bytes);
      }
      final bytes = allBytes.done().buffer.asUint8List();

      final Size imageSize = Size(
        cameraImage.width.toDouble(),
        cameraImage.height.toDouble(),
      );

      final camera = CameraDescription(
        name: 'camera',
        lensDirection: CameraLensDirection.back,
        sensorOrientation: 90,
      );

      const InputImageRotation imageRotation = InputImageRotation.rotation0deg;

      final InputImageFormat inputImageFormat = InputImageFormat.nv21;

      final inputImageData = InputImageMetadata(
        size: imageSize,
        rotation: imageRotation,
        format: inputImageFormat,
        bytesPerRow: cameraImage.planes[0].bytesPerRow,
      );

      return InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageData,
      );
    } catch (e) {
      print('Error converting camera image: $e');
      return null;
    }
  }

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

  void dispose() {
    if (_isInitialized) {
      _faceDetector.close();
      _segmenter.close();
      _isInitialized = false;
    }
  }
}