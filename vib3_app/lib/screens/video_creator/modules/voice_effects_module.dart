import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:io';
import '../providers/creation_state_provider.dart';
import '../../../services/voice_effects_processor.dart';

class VoiceEffectsModule extends StatefulWidget {
  const VoiceEffectsModule({super.key});
  
  @override
  State<VoiceEffectsModule> createState() => _VoiceEffectsModuleState();
}

class _VoiceEffectsModuleState extends State<VoiceEffectsModule> {
  // Available voice effects
  final List<VoiceEffect> _voiceEffects = [
    VoiceEffect(
      id: 'chipmunk',
      name: 'Chipmunk',
      icon: Icons.pets,
      pitch: 1.5,
      speed: 1.2,
      color: const Color(0xFFFF6B6B),
    ),
    VoiceEffect(
      id: 'deep',
      name: 'Deep',
      icon: Icons.record_voice_over,
      pitch: 0.6,
      speed: 0.9,
      color: const Color(0xFF4ECDC4),
    ),
    VoiceEffect(
      id: 'robot',
      name: 'Robot',
      icon: Icons.smart_toy,
      pitch: 1.0,
      speed: 1.0,
      modulation: true,
      color: const Color(0xFF95E1D3),
    ),
    VoiceEffect(
      id: 'echo',
      name: 'Echo',
      icon: Icons.surround_sound,
      pitch: 1.0,
      speed: 1.0,
      echo: true,
      echoDelay: 0.2,
      color: const Color(0xFFA8E6CF),
    ),
    VoiceEffect(
      id: 'alien',
      name: 'Alien',
      icon: Icons.blur_circular,
      pitch: 1.3,
      speed: 0.8,
      modulation: true,
      color: const Color(0xFFDDA0DD),
    ),
    VoiceEffect(
      id: 'helium',
      name: 'Helium',
      icon: Icons.bubble_chart,
      pitch: 1.8,
      speed: 1.0,
      color: const Color(0xFFFFB6C1),
    ),
    VoiceEffect(
      id: 'giant',
      name: 'Giant',
      icon: Icons.terrain,
      pitch: 0.5,
      speed: 0.8,
      reverb: true,
      color: const Color(0xFF708090),
    ),
    VoiceEffect(
      id: 'telephone',
      name: 'Phone',
      icon: Icons.phone,
      pitch: 1.0,
      speed: 1.0,
      bandpass: true,
      color: const Color(0xFFFFD700),
    ),
    VoiceEffect(
      id: 'underwater',
      name: 'Underwater',
      icon: Icons.water,
      pitch: 0.9,
      speed: 0.95,
      muffle: true,
      color: const Color(0xFF00CED1),
    ),
    VoiceEffect(
      id: 'whisper',
      name: 'Whisper',
      icon: Icons.volume_down,
      pitch: 1.0,
      speed: 1.0,
      whisper: true,
      color: const Color(0xFFE6E6FA),
    ),
    VoiceEffect(
      id: 'megaphone',
      name: 'Megaphone',
      icon: Icons.campaign,
      pitch: 1.0,
      speed: 1.0,
      distortion: true,
      color: const Color(0xFFFF4500),
    ),
    VoiceEffect(
      id: 'reverse',
      name: 'Reverse',
      icon: Icons.replay,
      pitch: 1.0,
      speed: -1.0, // Negative speed for reverse
      color: const Color(0xFF9370DB),
    ),
  ];
  
  String? _selectedEffect;
  AudioPlayer? _audioPlayer;
  bool _isPlaying = false;
  double _effectIntensity = 0.5;
  
  @override
  void dispose() {
    _audioPlayer?.dispose();
    super.dispose();
  }
  
  void _selectEffect(VoiceEffect effect) {
    setState(() {
      _selectedEffect = effect.id;
    });
    
    // Stop any playing audio
    _audioPlayer?.stop();
    
    // Add effect to creation state
    final creationState = context.read<CreationStateProvider>();
    creationState.addEffect(
      VideoEffect(
        type: 'voice_effect',
        parameters: {
          'effectId': effect.id,
          'pitch': effect.pitch,
          'speed': effect.speed,
          'intensity': _effectIntensity,
          'modulation': effect.modulation,
          'echo': effect.echo,
          'echoDelay': effect.echoDelay,
          'reverb': effect.reverb,
          'bandpass': effect.bandpass,
          'muffle': effect.muffle,
          'whisper': effect.whisper,
          'distortion': effect.distortion,
        },
      ),
    );
  }
  
  Future<void> _previewEffect() async {
    if (_selectedEffect == null) return;
    
    final creationState = context.read<CreationStateProvider>();
    if (creationState.videoClips.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No audio to preview'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    // For preview, we would apply the effect to the audio
    // This is a simplified version
    setState(() {
      _isPlaying = !_isPlaying;
    });
    
    if (_isPlaying) {
      _audioPlayer = AudioPlayer();
      // Play original audio with effect parameters
      // In production, this would process the audio with effects
    } else {
      _audioPlayer?.stop();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Voice Effects',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    if (_selectedEffect != null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Voice effect applied: ${_voiceEffects.firstWhere((e) => e.id == _selectedEffect).name}'),
                          backgroundColor: const Color(0xFF00CED1),
                        ),
                      );
                    }
                  },
                  child: const Text(
                    'Done',
                    style: TextStyle(
                      color: Color(0xFF00CED1),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Effects grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemCount: _voiceEffects.length,
              itemBuilder: (context, index) {
                final effect = _voiceEffects[index];
                final isSelected = _selectedEffect == effect.id;
                
                return GestureDetector(
                  onTap: () => _selectEffect(effect),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? effect.color.withOpacity(0.3)
                          : Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? effect.color : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          effect.icon,
                          color: isSelected ? effect.color : Colors.white70,
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          effect.name,
                          style: TextStyle(
                            color: isSelected ? effect.color : Colors.white70,
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Intensity control and preview
          if (_selectedEffect != null) ...[
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Intensity slider
                  Row(
                    children: [
                      const Icon(
                        Icons.tune,
                        color: Colors.white70,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Intensity',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: SliderTheme(
                          data: SliderTheme.of(context).copyWith(
                            activeTrackColor: const Color(0xFF00CED1),
                            inactiveTrackColor: Colors.grey[800],
                            thumbColor: const Color(0xFF00CED1),
                          ),
                          child: Slider(
                            value: _effectIntensity,
                            min: 0.0,
                            max: 1.0,
                            onChanged: (value) {
                              setState(() {
                                _effectIntensity = value;
                              });
                              
                              // Update effect intensity
                              final creationState = context.read<CreationStateProvider>();
                              final effect = creationState.effects.firstWhere(
                                (e) => e.type == 'voice_effect',
                                orElse: () => VideoEffect(type: 'voice_effect'),
                              );
                              effect.parameters['intensity'] = value;
                              creationState.notifyListeners();
                            },
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 40,
                        child: Text(
                          '${(_effectIntensity * 100).toInt()}%',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.right,
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Preview button
                  ElevatedButton.icon(
                    onPressed: _previewEffect,
                    icon: Icon(
                      _isPlaying ? Icons.stop : Icons.play_arrow,
                    ),
                    label: Text(_isPlaying ? 'Stop' : 'Preview'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00CED1),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // Tips
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue.withOpacity(0.3)),
            ),
            child: Row(
              children: const [
                Icon(
                  Icons.lightbulb_outline,
                  color: Colors.blue,
                  size: 20,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Voice effects will be applied to all audio in your video',
                    style: TextStyle(
                      color: Colors.blue,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class VoiceEffect {
  final String id;
  final String name;
  final IconData icon;
  final double pitch;
  final double speed;
  final Color color;
  final bool modulation;
  final bool echo;
  final double? echoDelay;
  final bool reverb;
  final bool bandpass;
  final bool muffle;
  final bool whisper;
  final bool distortion;
  
  VoiceEffect({
    required this.id,
    required this.name,
    required this.icon,
    required this.pitch,
    required this.speed,
    required this.color,
    this.modulation = false,
    this.echo = false,
    this.echoDelay,
    this.reverb = false,
    this.bandpass = false,
    this.muffle = false,
    this.whisper = false,
    this.distortion = false,
  });
}