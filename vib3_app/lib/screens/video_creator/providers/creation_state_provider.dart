import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'dart:io';
import '../../../services/video_export_service.dart';

/// Manages the entire video creation state
class CreationStateProvider extends ChangeNotifier {
  // Video clips
  final List<VideoClip> _videoClips = [];
  List<VideoClip> get videoClips => _videoClips;
  
  // Current editing clip
  int _currentClipIndex = 0;
  int get currentClipIndex => _currentClipIndex;
  
  // Audio tracks
  String? _backgroundMusicPath;
  String? _backgroundMusicName;
  String? _voiceoverPath;
  final List<SoundEffect> _soundEffects = [];
  
  // Volume levels
  double _originalVolume = 1.0;
  double _musicVolume = 0.7;
  bool _beatSyncEnabled = false;
  
  // Effects and filters
  String _selectedFilter = 'none';
  final List<VideoEffect> _effects = [];
  final List<TextOverlay> _textOverlays = [];
  final List<StickerOverlay> _stickers = [];
  
  // Export settings
  VideoQuality _exportQuality = VideoQuality.high;
  bool _includeWatermark = false;
  
  // Recording settings
  RecordingMode _recordingMode = RecordingMode.normal;
  int _recordingDuration = 15; // seconds
  double _recordingSpeed = 1.0;
  bool _beautyMode = false;
  double _beautyIntensity = 0.5;
  
  // Getters
  String get backgroundMusicPath => _backgroundMusicPath ?? '';
  String? get backgroundMusicName => _backgroundMusicName;
  String? get voiceoverPath => _voiceoverPath;
  String get selectedFilter => _selectedFilter;
  double get originalVolume => _originalVolume;
  double get musicVolume => _musicVolume;
  RecordingMode get recordingMode => _recordingMode;
  int get recordingDuration => _recordingDuration;
  double get recordingSpeed => _recordingSpeed;
  bool get beautyMode => _beautyMode;
  double get beautyIntensity => _beautyIntensity;
  List<VideoEffect> get effects => _effects;
  List<TextOverlay> get textOverlays => _textOverlays;
  List<StickerOverlay> get stickers => _stickers;
  bool get beatSyncEnabled => _beatSyncEnabled;
  
  // Add video clip
  void addVideoClip(String path, {Duration? trimStart, Duration? trimEnd}) {
    print('CreationStateProvider: Adding video clip: $path');
    final clip = VideoClip(
      path: path,
      trimStart: trimStart ?? Duration.zero,
      trimEnd: trimEnd,
    );
    _videoClips.add(clip);
    print('CreationStateProvider: Total clips now: ${_videoClips.length}');
    notifyListeners();
  }
  
  // Load existing video
  void loadExistingVideo(String path) {
    _videoClips.clear();
    _videoClips.add(VideoClip(path: path));
    notifyListeners();
  }
  
  // Remove clip
  void removeClip(int index) {
    if (index >= 0 && index < _videoClips.length) {
      _videoClips.removeAt(index);
      if (_currentClipIndex >= _videoClips.length && _videoClips.isNotEmpty) {
        _currentClipIndex = _videoClips.length - 1;
      }
      notifyListeners();
    }
  }
  
  // Reorder clips
  void reorderClips(int oldIndex, int newIndex) {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final clip = _videoClips.removeAt(oldIndex);
    _videoClips.insert(newIndex, clip);
    notifyListeners();
  }
  
  // Update clip speed
  void updateClipSpeed(int index, double speed) {
    if (index >= 0 && index < _videoClips.length) {
      _videoClips[index].speed = speed;
      notifyListeners();
    }
  }
  
  // Update clip property
  void updateClipProperty(int index, String property, dynamic value) {
    if (index >= 0 && index < _videoClips.length) {
      switch (property) {
        case 'isReversed':
          _videoClips[index].isReversed = value as bool;
          break;
        case 'speed':
          _videoClips[index].speed = value as double;
          break;
        // Add more properties as needed
      }
      notifyListeners();
    }
  }

  // Set current clip
  void setCurrentClip(int index) {
    if (index >= 0 && index < _videoClips.length) {
      _currentClipIndex = index;
      notifyListeners();
    }
  }
  
  // Audio management
  void setBackgroundMusic(String path, {String? musicName}) {
    _backgroundMusicPath = path;
    _backgroundMusicName = musicName;
    notifyListeners();
  }
  
  void setVoiceover(String path) {
    _voiceoverPath = path;
    notifyListeners();
  }
  
  void addSoundEffect(SoundEffect effect) {
    _soundEffects.add(effect);
    notifyListeners();
  }
  
  void setOriginalVolume(double volume) {
    _originalVolume = volume.clamp(0.0, 1.0);
    notifyListeners();
  }
  
  void setMusicVolume(double volume) {
    _musicVolume = volume.clamp(0.0, 1.0);
    notifyListeners();
  }
  
  void setBeatSyncEnabled(bool enabled) {
    _beatSyncEnabled = enabled;
    notifyListeners();
  }
  
  // Filter management
  void setFilter(String filter) {
    _selectedFilter = filter;
    notifyListeners();
  }
  
  // Effect management
  void addEffect(VideoEffect effect) {
    _effects.add(effect);
    notifyListeners();
  }
  
  void removeEffect(VideoEffect effect) {
    _effects.remove(effect);
    notifyListeners();
  }
  
  // Text overlay management
  void addTextOverlay(TextOverlay overlay) {
    _textOverlays.add(overlay);
    notifyListeners();
  }
  
  void updateTextOverlay(int index, TextOverlay overlay) {
    if (index >= 0 && index < _textOverlays.length) {
      _textOverlays[index] = overlay;
      notifyListeners();
    }
  }
  
  void removeTextOverlay(int index) {
    if (index >= 0 && index < _textOverlays.length) {
      _textOverlays.removeAt(index);
      notifyListeners();
    }
  }
  
  // Sticker management
  void addSticker(StickerOverlay sticker) {
    _stickers.add(sticker);
    notifyListeners();
  }
  
  void removeSticker(int index) {
    if (index >= 0 && index < _stickers.length) {
      _stickers.removeAt(index);
      notifyListeners();
    }
  }
  
  // Recording settings
  void setRecordingMode(RecordingMode mode) {
    _recordingMode = mode;
    notifyListeners();
  }
  
  void setRecordingDuration(int seconds) {
    _recordingDuration = seconds;
    notifyListeners();
  }
  
  void setRecordingSpeed(double speed) {
    _recordingSpeed = speed;
    notifyListeners();
  }
  
  void setBeautyMode(bool enabled) {
    _beautyMode = enabled;
    notifyListeners();
  }
  
  void setBeautyIntensity(double intensity) {
    _beautyIntensity = intensity.clamp(0.0, 1.0);
    notifyListeners();
  }
  
  // Export settings
  void setExportQuality(VideoQuality quality) {
    _exportQuality = quality;
    notifyListeners();
  }
  
  void setIncludeWatermark(bool include) {
    _includeWatermark = include;
    notifyListeners();
  }
  
  // Calculate total duration
  Duration getTotalDuration() {
    Duration total = Duration.zero;
    for (final clip in _videoClips) {
      total += clip.duration;
    }
    return total;
  }
  
  // Export final video
  Future<String> exportFinalVideo({Function(double)? onProgress}) async {
    if (_videoClips.isEmpty) {
      throw Exception('No video clips to export');
    }
    
    try {
      final exportedPath = await VideoExportService.exportVideo(
        clips: _videoClips,
        backgroundMusicPath: _backgroundMusicPath,
        voiceoverPath: _voiceoverPath,
        textOverlays: _textOverlays,
        stickers: _stickers,
        selectedFilter: _selectedFilter,
        originalVolume: _originalVolume,
        musicVolume: _musicVolume,
        onProgress: onProgress,
      );
      
      return exportedPath;
    } catch (e) {
      print('Export error: $e');
      rethrow;
    }
  }
  
  // Clear all edits
  void clearAll() {
    _videoClips.clear();
    _currentClipIndex = 0;
    _backgroundMusicPath = null;
    _voiceoverPath = null;
    _soundEffects.clear();
    _effects.clear();
    _textOverlays.clear();
    _stickers.clear();
    _selectedFilter = 'none';
    _originalVolume = 1.0;
    _musicVolume = 0.7;
    notifyListeners();
  }
}

// Data models
class VideoClip {
  final String path;
  final Duration trimStart;
  final Duration? trimEnd;
  double speed;
  bool isReversed;
  
  VideoClip({
    required this.path,
    this.trimStart = Duration.zero,
    this.trimEnd,
    this.speed = 1.0,
    this.isReversed = false,
  });
  
  Duration get duration {
    // TODO: Get actual video duration
    return const Duration(seconds: 15);
  }
}

class VideoEffect {
  final String type;
  final Map<String, dynamic> parameters;
  final Duration? startTime;
  final Duration? endTime;
  
  VideoEffect({
    required this.type,
    this.parameters = const {},
    this.startTime,
    this.endTime,
  });
}

class TextOverlay {
  String text;
  Offset position;
  double fontSize;
  String fontFamily;
  int color;
  TextAnimation animation;
  Duration startTime;
  Duration duration;
  
  TextOverlay({
    required this.text,
    required this.position,
    this.fontSize = 24,
    this.fontFamily = 'System',
    this.color = 0xFFFFFFFF,
    this.animation = TextAnimation.none,
    this.startTime = Duration.zero,
    this.duration = const Duration(seconds: 5),
  });
}

class StickerOverlay {
  final String path;
  Offset position;
  double scale;
  double rotation;
  Duration startTime;
  Duration duration;
  
  StickerOverlay({
    required this.path,
    required this.position,
    this.scale = 1.0,
    this.rotation = 0.0,
    this.startTime = Duration.zero,
    this.duration = const Duration(seconds: 5),
  });
}

class SoundEffect {
  final String path;
  final String name;
  final Duration startTime;
  double volume;
  
  SoundEffect({
    required this.path,
    required this.name,
    required this.startTime,
    this.volume = 1.0,
  });
}

// Enums
enum RecordingMode {
  normal,
  photo,
  story,
  live,
}

enum VideoQuality {
  low,
  medium,
  high,
  ultra,
}

enum TextAnimation {
  none,
  typewriter,
  fade,
  bounce,
  slide,
  zoom,
}