import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:io';

class AudioOverlayWidget extends StatefulWidget {
  final String videoPath;

  const AudioOverlayWidget({super.key, required this.videoPath});

  @override
  State<AudioOverlayWidget> createState() => _AudioOverlayWidgetState();
}

class _AudioOverlayWidgetState extends State<AudioOverlayWidget> {
  AudioPlayer? _audioPlayer;
  String? _selectedAudioPath;
  bool _isPlaying = false;
  double _audioVolume = 0.5;
  double _originalVideoVolume = 1.0;
  Duration _audioStartTime = Duration.zero;
  
  final List<Map<String, dynamic>> _presetSounds = [
    {'name': 'Trending Beat 1', 'icon': Icons.music_note, 'path': null},
    {'name': 'Chill Vibes', 'icon': Icons.music_note, 'path': null},
    {'name': 'Hip Hop Beat', 'icon': Icons.music_note, 'path': null},
    {'name': 'Pop Remix', 'icon': Icons.music_note, 'path': null},
    {'name': 'Acoustic Guitar', 'icon': Icons.music_note, 'path': null},
    {'name': 'Electronic Dance', 'icon': Icons.music_note, 'path': null},
  ];

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer();
  }

  Future<void> _selectAudioFile() async {
    try {
      // Simulate audio file selection
      setState(() {
        _selectedAudioPath = 'custom_audio_file.mp3';
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Audio file selected successfully!'),
          backgroundColor: Color(0xFF00CED1),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting audio: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _playPauseAudio() async {
    if (_selectedAudioPath == null) return;

    try {
      if (_isPlaying) {
        await _audioPlayer?.pause();
      } else {
        // Simulate audio playback
        print('Playing audio: $_selectedAudioPath');
      }
      setState(() {
        _isPlaying = !_isPlaying;
      });
    } catch (e) {
      print('Error playing audio: $e');
    }
  }

  void _removeAudio() {
    setState(() {
      _selectedAudioPath = null;
      _isPlaying = false;
    });
    _audioPlayer?.stop();
  }

  @override
  void dispose() {
    _audioPlayer?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Audio & Music',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Preset sounds
          SizedBox(
            height: 60,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _presetSounds.length,
              itemBuilder: (context, index) {
                final sound = _presetSounds[index];
                return GestureDetector(
                  onTap: () {
                    // Simulate selecting a preset sound
                    setState(() {
                      _selectedAudioPath = 'preset_${index}';
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Selected: ${sound['name']}'),
                        backgroundColor: const Color(0xFF00CED1),
                      ),
                    );
                  },
                  child: Container(
                    width: 100,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00CED1), Color(0xFF1E90FF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(sound['icon'], color: Colors.white, size: 20),
                        const SizedBox(height: 4),
                        Text(
                          sound['name'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Custom audio selection
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _selectAudioFile,
                  icon: const Icon(Icons.file_upload, color: Colors.white),
                  label: const Text(
                    'Add Custom Audio',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.grey[800],
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Audio controls (only show if audio is selected)
          if (_selectedAudioPath != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[850],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(Icons.music_note, color: Colors.grey[400]),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _selectedAudioPath!.startsWith('preset_')
                              ? _presetSounds[int.parse(_selectedAudioPath!.split('_')[1])]['name']
                              : 'Custom Audio',
                          style: const TextStyle(color: Colors.white),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        onPressed: _playPauseAudio,
                        icon: Icon(
                          _isPlaying ? Icons.pause : Icons.play_arrow,
                          color: const Color(0xFF00CED1),
                        ),
                      ),
                      IconButton(
                        onPressed: _removeAudio,
                        icon: const Icon(Icons.delete, color: Colors.red),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Volume controls
                  _buildSlider('Audio Volume', _audioVolume, 0.0, 1.0, (value) {
                    setState(() {
                      _audioVolume = value;
                    });
                    _audioPlayer?.setVolume(value);
                  }),
                  
                  _buildSlider('Original Audio', _originalVideoVolume, 0.0, 1.0, (value) {
                    setState(() {
                      _originalVideoVolume = value;
                    });
                    // Apply original video volume adjustment
                  }),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSlider(String label, double value, double min, double max, Function(double) onChanged) {
    return Row(
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ),
        Expanded(
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: const Color(0xFF00CED1),
              inactiveTrackColor: Colors.grey[700],
              thumbColor: const Color(0xFF00CED1),
              overlayColor: const Color(0xFF00CED1).withOpacity(0.3),
              trackHeight: 2,
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              onChanged: onChanged,
            ),
          ),
        ),
        SizedBox(
          width: 30,
          child: Text(
            '${(value * 100).toInt()}%',
            style: const TextStyle(color: Colors.white70, fontSize: 10),
          ),
        ),
      ],
    );
  }
}