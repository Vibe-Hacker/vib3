import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../app/theme/app_theme.dart';

// Unique VIB3 Feature: Vibe Meter - Content mood matching
class VibeMeterScreen extends StatefulWidget {
  const VibeMeterScreen({Key? key}) : super(key: key);

  @override
  State<VibeMeterScreen> createState() => _VibeMeterScreenState();
}

class _VibeMeterScreenState extends State<VibeMeterScreen> {
  double _vibeLevel = 50.0;
  String _currentVibe = 'Chill';
  Color _vibeColor = AppTheme.primaryColor;
  
  final Map<String, VibeData> _vibes = {
    'Energetic': VibeData(
      color: Colors.orange,
      emoji: '⚡',
      contentTypes: ['workout', 'dance', 'motivation'],
    ),
    'Chill': VibeData(
      color: Colors.blue,
      emoji: '😌',
      contentTypes: ['lofi', 'nature', 'meditation'],
    ),
    'Creative': VibeData(
      color: Colors.purple,
      emoji: '🎨',
      contentTypes: ['art', 'music', 'diy'],
    ),
    'Social': VibeData(
      color: Colors.pink,
      emoji: '🎉',
      contentTypes: ['party', 'friends', 'events'],
    ),
    'Focused': VibeData(
      color: Colors.green,
      emoji: '🎯',
      contentTypes: ['study', 'work', 'productivity'],
    ),
  };
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Vibe Meter'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Vibe Visualization
          Expanded(
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Animated background
                  Container(
                    width: 300,
                    height: 300,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          _vibeColor.withOpacity(0.3),
                          _vibeColor.withOpacity(0.1),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                  
                  // Vibe indicator
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _vibes[_currentVibe]!.emoji,
                        style: const TextStyle(fontSize: 80),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _currentVibe,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      Text(
                        '${_vibeLevel.round()}% Vibe',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: _vibeColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Vibe Selector
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.surfaceColor,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(32),
              ),
            ),
            child: Column(
              children: [
                Text(
                  'How are you vibing today?',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 24),
                
                // Vibe slider
                SliderTheme(
                  data: SliderThemeData(
                    activeTrackColor: _vibeColor,
                    inactiveTrackColor: _vibeColor.withOpacity(0.3),
                    thumbColor: _vibeColor,
                    overlayColor: _vibeColor.withOpacity(0.2),
                  ),
                  child: Slider(
                    value: _vibeLevel,
                    min: 0,
                    max: 100,
                    onChanged: (value) {
                      setState(() {
                        _vibeLevel = value;
                        _updateVibe();
                      });
                      HapticFeedback.selectionClick();
                    },
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Vibe options
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: _vibes.entries.map((entry) {
                    final isSelected = entry.key == _currentVibe;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _currentVibe = entry.key;
                          _vibeColor = entry.value.color;
                        });
                        HapticFeedback.mediumImpact();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? entry.value.color.withOpacity(0.2)
                              : AppTheme.cardColor,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: isSelected
                                ? entry.value.color
                                : Colors.transparent,
                            width: 2,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              entry.value.emoji,
                              style: const TextStyle(fontSize: 20),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              entry.key,
                              style: TextStyle(
                                color: isSelected
                                    ? entry.value.color
                                    : Colors.white,
                                fontWeight: isSelected
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                
                const SizedBox(height: 32),
                
                // Apply vibe button
                ElevatedButton(
                  onPressed: () {
                    // Apply vibe to content algorithm
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Your feed is now tuned to $_currentVibe vibes!'),
                        backgroundColor: _vibeColor,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _vibeColor,
                  ),
                  child: const Text('Tune My Feed'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  void _updateVibe() {
    if (_vibeLevel < 20) {
      _currentVibe = 'Chill';
    } else if (_vibeLevel < 40) {
      _currentVibe = 'Focused';
    } else if (_vibeLevel < 60) {
      _currentVibe = 'Creative';
    } else if (_vibeLevel < 80) {
      _currentVibe = 'Social';
    } else {
      _currentVibe = 'Energetic';
    }
    _vibeColor = _vibes[_currentVibe]!.color;
  }
}

class VibeData {
  final Color color;
  final String emoji;
  final List<String> contentTypes;
  
  VibeData({
    required this.color,
    required this.emoji,
    required this.contentTypes,
  });
}