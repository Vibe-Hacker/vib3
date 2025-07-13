import 'dart:async';
import 'dart:io';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter/material.dart';

/// Service for converting speech to text for auto-captions
class SpeechToTextService {
  static final SpeechToTextService _instance = SpeechToTextService._internal();
  factory SpeechToTextService() => _instance;
  SpeechToTextService._internal();

  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isInitialized = false;
  bool _isListening = false;
  
  // Caption data
  final List<Caption> _captions = [];
  Timer? _captionTimer;
  String _currentText = '';
  DateTime? _currentCaptionStart;
  
  // Callbacks
  Function(List<Caption>)? onCaptionsUpdated;
  Function(String)? onLiveTextUpdated;
  
  /// Initialize the speech recognition service
  Future<bool> initialize() async {
    if (_isInitialized) return true;
    
    try {
      _isInitialized = await _speech.initialize(
        onStatus: (status) {
          print('Speech recognition status: $status');
        },
        onError: (error) {
          print('Speech recognition error: $error');
        },
      );
      
      if (_isInitialized) {
        print('✅ Speech to text service initialized');
      }
      
      return _isInitialized;
    } catch (e) {
      print('❌ Failed to initialize speech to text: $e');
      return false;
    }
  }
  
  /// Start listening for speech during video recording
  Future<void> startListening({
    required String languageCode,
    Function(List<Caption>)? onCaptionsUpdated,
    Function(String)? onLiveTextUpdated,
  }) async {
    if (!_isInitialized) {
      await initialize();
    }
    
    if (_isListening) return;
    
    this.onCaptionsUpdated = onCaptionsUpdated;
    this.onLiveTextUpdated = onLiveTextUpdated;
    
    _captions.clear();
    _currentText = '';
    _currentCaptionStart = DateTime.now();
    
    try {
      await _speech.listen(
        onResult: _handleSpeechResult,
        localeId: languageCode,
        listenMode: stt.ListenMode.dictation,
        partialResults: true,
        cancelOnError: false,
        listenFor: const Duration(hours: 1), // Long duration for video recording
      );
      
      _isListening = true;
      print('🎤 Started listening for captions in $languageCode');
      
      // Start caption segmentation timer
      _startCaptionTimer();
    } catch (e) {
      print('❌ Error starting speech recognition: $e');
    }
  }
  
  /// Stop listening and finalize captions
  Future<List<Caption>> stopListening() async {
    if (!_isListening) return _captions;
    
    try {
      await _speech.stop();
      _isListening = false;
      _captionTimer?.cancel();
      
      // Add final caption if there's pending text
      if (_currentText.isNotEmpty && _currentCaptionStart != null) {
        _captions.add(Caption(
          text: _currentText,
          startTime: _currentCaptionStart!,
          endTime: DateTime.now(),
        ));
      }
      
      print('🛑 Stopped listening. Generated ${_captions.length} captions');
      return _captions;
    } catch (e) {
      print('❌ Error stopping speech recognition: $e');
      return _captions;
    }
  }
  
  /// Handle speech recognition results
  void _handleSpeechResult(stt.SpeechRecognitionResult result) {
    _currentText = result.recognizedWords;
    
    // Update live text
    onLiveTextUpdated?.call(_currentText);
    
    if (result.finalResult) {
      // Segment caption when we get a final result
      _segmentCaption();
    }
  }
  
  /// Start timer for automatic caption segmentation
  void _startCaptionTimer() {
    _captionTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (_currentText.isNotEmpty) {
        _segmentCaption();
      }
    });
  }
  
  /// Segment current text into a caption
  void _segmentCaption() {
    if (_currentText.isEmpty || _currentCaptionStart == null) return;
    
    final now = DateTime.now();
    
    // Create caption
    final caption = Caption(
      text: _currentText,
      startTime: _currentCaptionStart!,
      endTime: now,
    );
    
    _captions.add(caption);
    
    // Reset for next caption
    _currentText = '';
    _currentCaptionStart = now;
    
    // Notify listeners
    onCaptionsUpdated?.call(_captions);
  }
  
  /// Process audio file to generate captions (post-processing)
  Future<List<Caption>> processAudioFile(String audioPath) async {
    // This would use a cloud speech-to-text API for better accuracy
    // For now, return empty list as this requires server-side processing
    print('ℹ️ Audio file processing requires server-side implementation');
    return [];
  }
  
  /// Get available languages for speech recognition
  Future<List<LocaleName>> getAvailableLanguages() async {
    if (!_isInitialized) {
      await initialize();
    }
    
    try {
      final locales = await _speech.locales();
      return locales.map((locale) => LocaleName(
        id: locale.localeId,
        name: locale.name,
      )).toList();
    } catch (e) {
      print('❌ Error getting available languages: $e');
      return _getDefaultLanguages();
    }
  }
  
  /// Get default language options
  List<LocaleName> _getDefaultLanguages() {
    return [
      LocaleName(id: 'en_US', name: 'English (US)'),
      LocaleName(id: 'es_ES', name: 'Spanish'),
      LocaleName(id: 'fr_FR', name: 'French'),
      LocaleName(id: 'de_DE', name: 'German'),
      LocaleName(id: 'it_IT', name: 'Italian'),
      LocaleName(id: 'pt_BR', name: 'Portuguese (Brazil)'),
      LocaleName(id: 'ru_RU', name: 'Russian'),
      LocaleName(id: 'ja_JP', name: 'Japanese'),
      LocaleName(id: 'ko_KR', name: 'Korean'),
      LocaleName(id: 'zh_CN', name: 'Chinese (Simplified)'),
    ];
  }
  
  /// Format captions for display with timing
  static List<TimedCaption> formatCaptionsForVideo(
    List<Caption> captions,
    Duration videoDuration,
  ) {
    return captions.map((caption) {
      final startOffset = caption.startTime.difference(captions.first.startTime);
      final endOffset = caption.endTime.difference(captions.first.startTime);
      
      return TimedCaption(
        text: caption.text,
        start: startOffset,
        end: endOffset,
      );
    }).toList();
  }
  
  /// Check if speech recognition is available
  Future<bool> isAvailable() async {
    if (!_isInitialized) {
      await initialize();
    }
    return _isInitialized && await _speech.hasPermission();
  }
  
  /// Request microphone permission
  Future<bool> requestPermission() async {
    if (!_isInitialized) {
      await initialize();
    }
    
    final hasPermission = await _speech.hasPermission();
    if (!hasPermission) {
      // Permission will be requested when initialize() is called
      return await initialize();
    }
    return true;
  }
  
  bool get isListening => _isListening;
  List<Caption> get currentCaptions => List.unmodifiable(_captions);
  
  void dispose() {
    _captionTimer?.cancel();
    if (_isListening) {
      _speech.stop();
    }
  }
}

/// Caption data model
class Caption {
  final String text;
  final DateTime startTime;
  final DateTime endTime;
  
  Caption({
    required this.text,
    required this.startTime,
    required this.endTime,
  });
  
  Map<String, dynamic> toJson() => {
    'text': text,
    'startTime': startTime.toIso8601String(),
    'endTime': endTime.toIso8601String(),
  };
  
  factory Caption.fromJson(Map<String, dynamic> json) => Caption(
    text: json['text'],
    startTime: DateTime.parse(json['startTime']),
    endTime: DateTime.parse(json['endTime']),
  );
}

/// Timed caption for video playback
class TimedCaption {
  final String text;
  final Duration start;
  final Duration end;
  
  TimedCaption({
    required this.text,
    required this.start,
    required this.end,
  });
}

/// Language name model
class LocaleName {
  final String id;
  final String name;
  
  LocaleName({
    required this.id,
    required this.name,
  });
}