import 'package:flutter/material.dart';

class SpeedControlWidget extends StatefulWidget {
  final String videoPath;

  const SpeedControlWidget({super.key, required this.videoPath});

  @override
  State<SpeedControlWidget> createState() => _SpeedControlWidgetState();
}

class _SpeedControlWidgetState extends State<SpeedControlWidget> {
  double _playbackSpeed = 1.0;
  int _selectedPresetIndex = 2; // Normal speed (1.0x)

  final List<Map<String, dynamic>> _speedPresets = [
    {'speed': 0.25, 'label': '0.25x', 'icon': Icons.slow_motion_video},
    {'speed': 0.5, 'label': '0.5x', 'icon': Icons.slow_motion_video},
    {'speed': 1.0, 'label': '1x', 'icon': Icons.play_arrow},
    {'speed': 1.5, 'label': '1.5x', 'icon': Icons.fast_forward},
    {'speed': 2.0, 'label': '2x', 'icon': Icons.fast_forward},
    {'speed': 3.0, 'label': '3x', 'icon': Icons.fast_forward},
  ];

  void _applySpeed(double speed) {
    setState(() {
      _playbackSpeed = speed;
    });
    
    // Apply speed to video controller
    // This would typically involve FFmpeg processing
    print('Applying speed: ${speed}x to ${widget.videoPath}');
    
    // Show feedback to user
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Video speed set to ${speed}x'),
        backgroundColor: const Color(0xFF00CED1),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  String _getSpeedDescription(double speed) {
    if (speed < 1.0) {
      return 'Slow Motion';
    } else if (speed > 1.0) {
      return 'Fast Forward';
    } else {
      return 'Normal Speed';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Speed Control',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Speed presets
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _speedPresets.length,
              itemBuilder: (context, index) {
                final preset = _speedPresets[index];
                final isSelected = index == _selectedPresetIndex;
                
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedPresetIndex = index;
                      _playbackSpeed = preset['speed'];
                    });
                    _applySpeed(preset['speed']);
                  },
                  child: Container(
                    width: 70,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      gradient: isSelected
                          ? const LinearGradient(
                              colors: [Color(0xFF00CED1), Color(0xFF1E90FF)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : null,
                      color: isSelected ? null : Colors.grey[800],
                      borderRadius: BorderRadius.circular(8),
                      border: isSelected
                          ? null
                          : Border.all(color: Colors.grey[700]!),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          preset['icon'],
                          color: isSelected ? Colors.white : Colors.grey[400],
                          size: 24,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          preset['label'],
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.grey[400],
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
          
          const SizedBox(height: 20),
          
          // Custom speed slider
          const Text(
            'Custom Speed',
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 8),
          
          Row(
            children: [
              const Text(
                '0.1x',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: const Color(0xFF00CED1),
                    inactiveTrackColor: Colors.grey[700],
                    thumbColor: const Color(0xFF00CED1),
                    overlayColor: const Color(0xFF00CED1).withOpacity(0.3),
                    trackHeight: 3,
                  ),
                  child: Slider(
                    value: _playbackSpeed,
                    min: 0.1,
                    max: 4.0,
                    divisions: 39, // 0.1 increments
                    onChanged: (value) {
                      setState(() {
                        _playbackSpeed = value;
                        // Update selected preset if it matches
                        for (int i = 0; i < _speedPresets.length; i++) {
                          if ((_speedPresets[i]['speed'] - value).abs() < 0.05) {
                            _selectedPresetIndex = i;
                            break;
                          }
                        }
                      });
                    },
                    onChangeEnd: (value) {
                      _applySpeed(value);
                    },
                  ),
                ),
              ),
              const Text(
                '4.0x',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Current speed display
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.grey[850],
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  Text(
                    '${_playbackSpeed.toStringAsFixed(1)}x',
                    style: const TextStyle(
                      color: Color(0xFF00CED1),
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    _getSpeedDescription(_playbackSpeed),
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Speed effects info
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[850]?.withOpacity(0.5),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[700]!),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: Colors.grey[400],
                  size: 16,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _playbackSpeed < 1.0
                        ? 'Slow motion effect - creates dramatic emphasis'
                        : _playbackSpeed > 1.0
                            ? 'Time-lapse effect - condenses time for dynamic content'
                            : 'Normal playback speed',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 11,
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