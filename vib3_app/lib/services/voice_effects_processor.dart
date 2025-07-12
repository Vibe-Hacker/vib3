import 'dart:typed_data';
import 'dart:math' as math;
import 'package:flutter/foundation.dart';

enum VoiceEffectType {
  none,
  chipmunk,
  deepVoice,
  robot,
  echo,
  reverb,
  whisper,
  monster,
  alien,
  cartoon,
  oldRadio,
  underwater,
}

class VoiceEffectsProcessor {
  static final VoiceEffectsProcessor _instance = VoiceEffectsProcessor._internal();
  factory VoiceEffectsProcessor() => _instance;
  VoiceEffectsProcessor._internal();

  bool _isInitialized = false;
  VoiceEffectType _currentEffect = VoiceEffectType.none;
  double _intensity = 1.0;
  int _sampleRate = 44100;
  
  // Effect parameters
  Map<VoiceEffectType, Map<String, dynamic>> _effectParams = {
    VoiceEffectType.chipmunk: {
      'pitchShift': 1.5,
      'speedMultiplier': 1.2,
      'formantShift': 1.3,
    },
    VoiceEffectType.deepVoice: {
      'pitchShift': 0.7,
      'speedMultiplier': 0.9,
      'formantShift': 0.8,
    },
    VoiceEffectType.robot: {
      'vocoder': true,
      'carrierFreq': 440.0,
      'modulation': 0.8,
      'bitCrush': 8,
    },
    VoiceEffectType.echo: {
      'delayMs': 200,
      'feedback': 0.4,
      'wetLevel': 0.3,
    },
    VoiceEffectType.reverb: {
      'roomSize': 0.7,
      'damping': 0.5,
      'wetLevel': 0.4,
      'dryLevel': 0.6,
    },
    VoiceEffectType.whisper: {
      'noiseMix': 0.3,
      'highPassCutoff': 1000,
      'dynamicRange': 0.2,
    },
    VoiceEffectType.monster: {
      'pitchShift': 0.5,
      'formantShift': 0.6,
      'distortion': 0.4,
      'tremolo': 6.0,
    },
    VoiceEffectType.alien: {
      'ringMod': 120.0,
      'pitchShift': 1.1,
      'phaser': true,
      'bitCrush': 12,
    },
    VoiceEffectType.cartoon: {
      'pitchShift': 1.3,
      'formantShift': 1.4,
      'compression': 0.8,
      'brightness': 1.2,
    },
    VoiceEffectType.oldRadio: {
      'lowPassCutoff': 3000,
      'highPassCutoff': 300,
      'distortion': 0.1,
      'noiseLevel': 0.05,
    },
    VoiceEffectType.underwater: {
      'lowPassCutoff': 800,
      'chorus': true,
      'wetLevel': 0.8,
      'bubbleNoise': 0.1,
    },
  };

  // Audio processing buffers
  List<double> _delayBuffer = [];
  List<double> _reverbBuffer = [];
  int _delayBufferIndex = 0;
  int _reverbBufferIndex = 0;

  Future<void> initialize({int sampleRate = 44100}) async {
    if (_isInitialized) return;
    
    try {
      _sampleRate = sampleRate;
      
      // Initialize processing buffers
      _initializeBuffers();
      
      _isInitialized = true;
      print('✅ Voice Effects Processor initialized at ${_sampleRate}Hz');
    } catch (e) {
      print('❌ Failed to initialize Voice Effects Processor: $e');
    }
  }

  void _initializeBuffers() {
    // Initialize delay buffer (max 1 second)
    final maxDelayLength = _sampleRate;
    _delayBuffer = List.filled(maxDelayLength, 0.0);
    
    // Initialize reverb buffer (max 2 seconds)
    final maxReverbLength = _sampleRate * 2;
    _reverbBuffer = List.filled(maxReverbLength, 0.0);
    
    _delayBufferIndex = 0;
    _reverbBufferIndex = 0;
  }

  void setEffect(VoiceEffectType effect, {double intensity = 1.0}) {
    _currentEffect = effect;
    _intensity = intensity.clamp(0.0, 1.0);
    print('🎙️ Voice effect set: $effect (intensity: $_intensity)');
  }

  Future<Uint8List> processAudioData(Uint8List audioData) async {
    if (!_isInitialized || _currentEffect == VoiceEffectType.none) {
      return audioData;
    }

    try {
      // Convert bytes to float samples
      final samples = _bytesToSamples(audioData);
      
      // Apply the selected effect
      final processedSamples = await _applyEffect(samples, _currentEffect);
      
      // Convert back to bytes
      return _samplesToBytes(processedSamples);
    } catch (e) {
      print('❌ Error processing voice effect: $e');
      return audioData;
    }
  }

  Future<List<double>> _applyEffect(List<double> samples, VoiceEffectType effect) async {
    switch (effect) {
      case VoiceEffectType.chipmunk:
        return _applyChipmunkEffect(samples);
      case VoiceEffectType.deepVoice:
        return _applyDeepVoiceEffect(samples);
      case VoiceEffectType.robot:
        return _applyRobotEffect(samples);
      case VoiceEffectType.echo:
        return _applyEchoEffect(samples);
      case VoiceEffectType.reverb:
        return _applyReverbEffect(samples);
      case VoiceEffectType.whisper:
        return _applyWhisperEffect(samples);
      case VoiceEffectType.monster:
        return _applyMonsterEffect(samples);
      case VoiceEffectType.alien:
        return _applyAlienEffect(samples);
      case VoiceEffectType.cartoon:
        return _applyCartoonEffect(samples);
      case VoiceEffectType.oldRadio:
        return _applyOldRadioEffect(samples);
      case VoiceEffectType.underwater:
        return _applyUnderwaterEffect(samples);
      default:
        return samples;
    }
  }

  List<double> _applyChipmunkEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.chipmunk]!;
    final pitchShift = params['pitchShift'] as double;
    
    // Simple pitch shifting using time-domain approach
    final outputLength = (samples.length / pitchShift).round();
    final output = List<double>.filled(outputLength, 0.0);
    
    for (int i = 0; i < outputLength; i++) {
      final sourceIndex = (i * pitchShift).round();
      if (sourceIndex < samples.length) {
        output[i] = samples[sourceIndex] * _intensity;
      }
    }
    
    return output;
  }

  List<double> _applyDeepVoiceEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.deepVoice]!;
    final pitchShift = params['pitchShift'] as double;
    
    // Lower pitch by stretching time and resampling
    final stretchedLength = (samples.length / pitchShift).round();
    final stretched = List<double>.filled(stretchedLength, 0.0);
    
    for (int i = 0; i < stretchedLength; i++) {
      final sourceIndex = (i * pitchShift);
      final intIndex = sourceIndex.floor();
      final frac = sourceIndex - intIndex;
      
      if (intIndex < samples.length - 1) {
        // Linear interpolation
        stretched[i] = samples[intIndex] * (1.0 - frac) + samples[intIndex + 1] * frac;
      } else if (intIndex < samples.length) {
        stretched[i] = samples[intIndex];
      }
    }
    
    // Apply intensity
    return stretched.map((sample) => sample * _intensity).toList();
  }

  List<double> _applyRobotEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.robot]!;
    final carrierFreq = params['carrierFreq'] as double;
    final modulation = params['modulation'] as double;
    
    final output = List<double>.filled(samples.length, 0.0);
    
    for (int i = 0; i < samples.length; i++) {
      final t = i / _sampleRate;
      final carrier = math.sin(2 * math.pi * carrierFreq * t);
      
      // Ring modulation
      final modulated = samples[i] * carrier * modulation;
      
      // Mix with original
      output[i] = (samples[i] * (1.0 - _intensity) + modulated * _intensity);
    }
    
    return output;
  }

  List<double> _applyEchoEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.echo]!;
    final delayMs = params['delayMs'] as int;
    final feedback = params['feedback'] as double;
    final wetLevel = params['wetLevel'] as double;
    
    final delaySamples = (delayMs * _sampleRate / 1000).round();
    final output = List<double>.filled(samples.length, 0.0);
    
    for (int i = 0; i < samples.length; i++) {
      final delayedIndex = (_delayBufferIndex - delaySamples) % _delayBuffer.length;
      if (delayedIndex >= 0) {
        final delayedSample = _delayBuffer[delayedIndex];
        final echoSample = samples[i] + delayedSample * feedback;
        
        // Store in delay buffer
        _delayBuffer[_delayBufferIndex] = echoSample;
        _delayBufferIndex = (_delayBufferIndex + 1) % _delayBuffer.length;
        
        // Mix dry and wet signals
        output[i] = samples[i] * (1.0 - wetLevel * _intensity) + 
                   echoSample * wetLevel * _intensity;
      } else {
        output[i] = samples[i];
      }
    }
    
    return output;
  }

  List<double> _applyReverbEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.reverb]!;
    final roomSize = params['roomSize'] as double;
    final damping = params['damping'] as double;
    final wetLevel = params['wetLevel'] as double;
    
    final output = List<double>.filled(samples.length, 0.0);
    
    // Simple reverb using multiple delay lines
    final delays = [
      (roomSize * 0.1 * _sampleRate).round(),
      (roomSize * 0.15 * _sampleRate).round(),
      (roomSize * 0.22 * _sampleRate).round(),
      (roomSize * 0.35 * _sampleRate).round(),
    ];
    
    for (int i = 0; i < samples.length; i++) {
      double reverbSum = 0.0;
      
      for (final delay in delays) {
        final delayedIndex = (_reverbBufferIndex - delay) % _reverbBuffer.length;
        if (delayedIndex >= 0) {
          reverbSum += _reverbBuffer[delayedIndex] * damping;
        }
      }
      
      final reverbSample = samples[i] + reverbSum * 0.25;
      _reverbBuffer[_reverbBufferIndex] = reverbSample;
      _reverbBufferIndex = (_reverbBufferIndex + 1) % _reverbBuffer.length;
      
      output[i] = samples[i] * (1.0 - wetLevel * _intensity) + 
                 reverbSample * wetLevel * _intensity;
    }
    
    return output;
  }

  List<double> _applyWhisperEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.whisper]!;
    final noiseMix = params['noiseMix'] as double;
    final dynamicRange = params['dynamicRange'] as double;
    
    final output = List<double>.filled(samples.length, 0.0);
    final random = math.Random();
    
    for (int i = 0; i < samples.length; i++) {
      // Add noise
      final noise = (random.nextDouble() - 0.5) * 2.0 * noiseMix;
      
      // Compress dynamic range
      var compressed = samples[i] * dynamicRange;
      if (compressed > 0) {
        compressed = math.sqrt(compressed);
      } else {
        compressed = -math.sqrt(-compressed);
      }
      
      output[i] = (compressed + noise) * _intensity + samples[i] * (1.0 - _intensity);
    }
    
    return output;
  }

  List<double> _applyMonsterEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.monster]!;
    final pitchShift = params['pitchShift'] as double;
    final distortion = params['distortion'] as double;
    final tremolo = params['tremolo'] as double;
    
    // First apply pitch shift (deep voice)
    var output = _applyPitchShift(samples, pitchShift);
    
    // Add distortion
    for (int i = 0; i < output.length; i++) {
      if (output[i] > 0) {
        output[i] = math.min(1.0, output[i] + output[i] * distortion);
      } else {
        output[i] = math.max(-1.0, output[i] + output[i] * distortion);
      }
      
      // Add tremolo
      final t = i / _sampleRate;
      final tremoloMod = 1.0 + 0.3 * math.sin(2 * math.pi * tremolo * t);
      output[i] *= tremoloMod;
      
      // Apply intensity
      output[i] = output[i] * _intensity + samples[i % samples.length] * (1.0 - _intensity);
    }
    
    return output;
  }

  List<double> _applyAlienEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.alien]!;
    final ringMod = params['ringMod'] as double;
    final pitchShift = params['pitchShift'] as double;
    
    var output = _applyPitchShift(samples, pitchShift);
    
    // Apply ring modulation
    for (int i = 0; i < output.length; i++) {
      final t = i / _sampleRate;
      final modulator = math.sin(2 * math.pi * ringMod * t);
      output[i] *= modulator;
      
      // Apply intensity
      output[i] = output[i] * _intensity + samples[i % samples.length] * (1.0 - _intensity);
    }
    
    return output;
  }

  List<double> _applyCartoonEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.cartoon]!;
    final pitchShift = params['pitchShift'] as double;
    final compression = params['compression'] as double;
    final brightness = params['brightness'] as double;
    
    var output = _applyPitchShift(samples, pitchShift);
    
    // Apply compression and brightness
    for (int i = 0; i < output.length; i++) {
      // Compression
      output[i] *= compression;
      
      // Brightness (simple high-frequency boost)
      if (i > 0) {
        final highFreq = output[i] - output[i - 1];
        output[i] += highFreq * (brightness - 1.0);
      }
      
      // Apply intensity
      output[i] = output[i] * _intensity + samples[i % samples.length] * (1.0 - _intensity);
    }
    
    return output;
  }

  List<double> _applyOldRadioEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.oldRadio]!;
    final distortion = params['distortion'] as double;
    final noiseLevel = params['noiseLevel'] as double;
    
    final output = List<double>.filled(samples.length, 0.0);
    final random = math.Random();
    
    for (int i = 0; i < samples.length; i++) {
      // Apply simple band-pass filtering (simulated)
      var filtered = samples[i] * 0.8; // Reduce overall level
      
      // Add distortion
      if (filtered.abs() > 0.5) {
        filtered = filtered > 0 ? 0.5 + (filtered - 0.5) * distortion : 
                                 -0.5 + (filtered + 0.5) * distortion;
      }
      
      // Add noise
      final noise = (random.nextDouble() - 0.5) * noiseLevel;
      
      output[i] = (filtered + noise) * _intensity + samples[i] * (1.0 - _intensity);
    }
    
    return output;
  }

  List<double> _applyUnderwaterEffect(List<double> samples) {
    final params = _effectParams[VoiceEffectType.underwater]!;
    final wetLevel = params['wetLevel'] as double;
    final bubbleNoise = params['bubbleNoise'] as double;
    
    final output = List<double>.filled(samples.length, 0.0);
    final random = math.Random();
    
    for (int i = 0; i < samples.length; i++) {
      // Low-pass filtering (simulated)
      var filtered = samples[i] * 0.6;
      if (i > 0) filtered = (filtered + output[i - 1]) * 0.5;
      
      // Add bubble noise occasionally
      if (random.nextDouble() < 0.001) {
        filtered += (random.nextDouble() - 0.5) * bubbleNoise;
      }
      
      output[i] = filtered * wetLevel * _intensity + samples[i] * (1.0 - wetLevel * _intensity);
    }
    
    return output;
  }

  List<double> _applyPitchShift(List<double> samples, double shift) {
    if (shift == 1.0) return samples;
    
    final outputLength = (samples.length / shift).round();
    final output = List<double>.filled(outputLength, 0.0);
    
    for (int i = 0; i < outputLength; i++) {
      final sourceIndex = i * shift;
      final intIndex = sourceIndex.floor();
      final frac = sourceIndex - intIndex;
      
      if (intIndex < samples.length - 1) {
        output[i] = samples[intIndex] * (1.0 - frac) + samples[intIndex + 1] * frac;
      } else if (intIndex < samples.length) {
        output[i] = samples[intIndex];
      }
    }
    
    return output;
  }

  List<double> _bytesToSamples(Uint8List bytes) {
    // Assuming 16-bit PCM audio
    final samples = <double>[];
    for (int i = 0; i < bytes.length - 1; i += 2) {
      final sample = (bytes[i] | (bytes[i + 1] << 8));
      final normalized = sample < 32768 ? sample / 32768.0 : (sample - 65536) / 32768.0;
      samples.add(normalized);
    }
    return samples;
  }

  Uint8List _samplesToBytes(List<double> samples) {
    final bytes = Uint8List(samples.length * 2);
    for (int i = 0; i < samples.length; i++) {
      final clamped = samples[i].clamp(-1.0, 1.0);
      final intSample = (clamped * 32767).round();
      final unsignedSample = intSample < 0 ? intSample + 65536 : intSample;
      
      bytes[i * 2] = unsignedSample & 0xFF;
      bytes[i * 2 + 1] = (unsignedSample >> 8) & 0xFF;
    }
    return bytes;
  }

  void dispose() {
    _isInitialized = false;
    _delayBuffer.clear();
    _reverbBuffer.clear();
  }
}