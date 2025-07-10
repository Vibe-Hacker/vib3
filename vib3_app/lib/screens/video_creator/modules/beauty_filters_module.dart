import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class BeautyFiltersModule extends StatefulWidget {
  const BeautyFiltersModule({super.key});
  
  @override
  State<BeautyFiltersModule> createState() => _BeautyFiltersModuleState();
}

class _BeautyFiltersModuleState extends State<BeautyFiltersModule> {
  // Beauty settings
  double _smoothness = 0.5;
  double _brightness = 0.5;
  double _contrast = 0.5;
  double _slim = 0.0;
  double _eyeEnlarge = 0.0;
  double _lipEnhance = 0.0;
  double _teethWhiten = 0.0;
  double _blush = 0.0;
  double _contour = 0.0;
  
  // Preset filters
  String _selectedPreset = 'natural';
  
  final List<BeautyPreset> _presets = [
    BeautyPreset(
      id: 'natural',
      name: 'Natural',
      icon: Icons.eco,
      settings: {
        'smoothness': 0.3,
        'brightness': 0.5,
        'contrast': 0.5,
        'slim': 0.0,
        'eyeEnlarge': 0.0,
        'lipEnhance': 0.1,
      },
    ),
    BeautyPreset(
      id: 'soft',
      name: 'Soft',
      icon: Icons.blur_on,
      settings: {
        'smoothness': 0.6,
        'brightness': 0.6,
        'contrast': 0.4,
        'slim': 0.1,
        'eyeEnlarge': 0.1,
        'lipEnhance': 0.2,
      },
    ),
    BeautyPreset(
      id: 'glamour',
      name: 'Glamour',
      icon: Icons.auto_awesome,
      settings: {
        'smoothness': 0.7,
        'brightness': 0.7,
        'contrast': 0.6,
        'slim': 0.2,
        'eyeEnlarge': 0.2,
        'lipEnhance': 0.3,
        'blush': 0.3,
        'contour': 0.3,
      },
    ),
    BeautyPreset(
      id: 'fresh',
      name: 'Fresh',
      icon: Icons.wb_sunny,
      settings: {
        'smoothness': 0.4,
        'brightness': 0.7,
        'contrast': 0.5,
        'slim': 0.0,
        'eyeEnlarge': 0.1,
        'lipEnhance': 0.2,
        'blush': 0.2,
      },
    ),
    BeautyPreset(
      id: 'flawless',
      name: 'Flawless',
      icon: Icons.face,
      settings: {
        'smoothness': 0.8,
        'brightness': 0.6,
        'contrast': 0.5,
        'slim': 0.3,
        'eyeEnlarge': 0.2,
        'lipEnhance': 0.3,
        'teethWhiten': 0.5,
        'contour': 0.4,
      },
    ),
    BeautyPreset(
      id: 'none',
      name: 'None',
      icon: Icons.face_retouching_off,
      settings: {
        'smoothness': 0.0,
        'brightness': 0.5,
        'contrast': 0.5,
        'slim': 0.0,
        'eyeEnlarge': 0.0,
        'lipEnhance': 0.0,
      },
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _loadCurrentSettings();
  }
  
  void _loadCurrentSettings() {
    final creationState = context.read<CreationStateProvider>();
    if (creationState.beautyMode) {
      setState(() {
        _smoothness = creationState.beautyIntensity;
      });
    }
  }
  
  void _applyPreset(BeautyPreset preset) {
    setState(() {
      _selectedPreset = preset.id;
      _smoothness = preset.settings['smoothness'] ?? 0.5;
      _brightness = preset.settings['brightness'] ?? 0.5;
      _contrast = preset.settings['contrast'] ?? 0.5;
      _slim = preset.settings['slim'] ?? 0.0;
      _eyeEnlarge = preset.settings['eyeEnlarge'] ?? 0.0;
      _lipEnhance = preset.settings['lipEnhance'] ?? 0.0;
      _teethWhiten = preset.settings['teethWhiten'] ?? 0.0;
      _blush = preset.settings['blush'] ?? 0.0;
      _contour = preset.settings['contour'] ?? 0.0;
    });
    
    _applyBeautySettings();
  }
  
  void _applyBeautySettings() {
    final creationState = context.read<CreationStateProvider>();
    
    // Enable beauty mode
    creationState.setBeautyMode(true);
    creationState.setBeautyIntensity(_smoothness);
    
    // Add beauty effect with all parameters
    creationState.addEffect(
      VideoEffect(
        type: 'beauty_filter',
        parameters: {
          'preset': _selectedPreset,
          'smoothness': _smoothness,
          'brightness': _brightness,
          'contrast': _contrast,
          'slim': _slim,
          'eyeEnlarge': _eyeEnlarge,
          'lipEnhance': _lipEnhance,
          'teethWhiten': _teethWhiten,
          'blush': _blush,
          'contour': _contour,
        },
      ),
    );
  }
  
  Widget _buildSlider({
    required String label,
    required double value,
    required Function(double) onChanged,
    IconData? icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: Colors.white70, size: 18),
              const SizedBox(width: 8),
            ],
            Text(
              label,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
            const Spacer(),
            Text(
              '${(value * 100).toInt()}%',
              style: const TextStyle(
                color: Color(0xFF00CED1),
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: const Color(0xFF00CED1),
            inactiveTrackColor: Colors.grey[800],
            thumbColor: const Color(0xFF00CED1),
            overlayColor: const Color(0xFF00CED1).withOpacity(0.3),
            trackHeight: 4,
          ),
          child: Slider(
            value: value,
            onChanged: (newValue) {
              onChanged(newValue);
              _applyBeautySettings();
            },
          ),
        ),
      ],
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
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
                  'Beauty Filters',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    TextButton(
                      onPressed: () {
                        // Reset all values
                        setState(() {
                          _smoothness = 0.5;
                          _brightness = 0.5;
                          _contrast = 0.5;
                          _slim = 0.0;
                          _eyeEnlarge = 0.0;
                          _lipEnhance = 0.0;
                          _teethWhiten = 0.0;
                          _blush = 0.0;
                          _contour = 0.0;
                          _selectedPreset = 'natural';
                        });
                        _applyBeautySettings();
                      },
                      child: const Text(
                        'Reset',
                        style: TextStyle(color: Colors.white54),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Beauty filters applied'),
                            backgroundColor: Color(0xFF00CED1),
                          ),
                        );
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
              ],
            ),
          ),
          
          // Preset filters
          Container(
            height: 100,
            padding: const EdgeInsets.only(bottom: 16),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _presets.length,
              itemBuilder: (context, index) {
                final preset = _presets[index];
                final isSelected = _selectedPreset == preset.id;
                
                return GestureDetector(
                  onTap: () => _applyPreset(preset),
                  child: Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? const Color(0xFF00CED1).withOpacity(0.2)
                          : Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected 
                            ? const Color(0xFF00CED1)
                            : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          preset.icon,
                          color: isSelected 
                              ? const Color(0xFF00CED1)
                              : Colors.white70,
                          size: 28,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          preset.name,
                          style: TextStyle(
                            color: isSelected 
                                ? const Color(0xFF00CED1)
                                : Colors.white70,
                            fontSize: 12,
                            fontWeight: isSelected 
                                ? FontWeight.bold 
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Beauty settings
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Basic adjustments
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Basic',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildSlider(
                        label: 'Smooth',
                        value: _smoothness,
                        onChanged: (value) => setState(() => _smoothness = value),
                        icon: Icons.blur_on,
                      ),
                      _buildSlider(
                        label: 'Brighten',
                        value: _brightness,
                        onChanged: (value) => setState(() => _brightness = value),
                        icon: Icons.wb_sunny,
                      ),
                      _buildSlider(
                        label: 'Contrast',
                        value: _contrast,
                        onChanged: (value) => setState(() => _contrast = value),
                        icon: Icons.contrast,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Face shape
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Face Shape',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildSlider(
                        label: 'Slim Face',
                        value: _slim,
                        onChanged: (value) => setState(() => _slim = value),
                        icon: Icons.face,
                      ),
                      _buildSlider(
                        label: 'Eye Enlarge',
                        value: _eyeEnlarge,
                        onChanged: (value) => setState(() => _eyeEnlarge = value),
                        icon: Icons.visibility,
                      ),
                      _buildSlider(
                        label: 'Contour',
                        value: _contour,
                        onChanged: (value) => setState(() => _contour = value),
                        icon: Icons.gesture,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Makeup
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Makeup',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      _buildSlider(
                        label: 'Lip Color',
                        value: _lipEnhance,
                        onChanged: (value) => setState(() => _lipEnhance = value),
                        icon: Icons.favorite,
                      ),
                      _buildSlider(
                        label: 'Blush',
                        value: _blush,
                        onChanged: (value) => setState(() => _blush = value),
                        icon: Icons.palette,
                      ),
                      _buildSlider(
                        label: 'Teeth Whiten',
                        value: _teethWhiten,
                        onChanged: (value) => setState(() => _teethWhiten = value),
                        icon: Icons.sentiment_satisfied,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Tips
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFF0080).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFFF0080).withOpacity(0.3)),
            ),
            child: Row(
              children: const [
                Icon(
                  Icons.tips_and_updates,
                  color: Color(0xFFFF0080),
                  size: 20,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Tap the front camera to see beauty filters in real-time',
                    style: TextStyle(
                      color: Color(0xFFFF0080),
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

class BeautyPreset {
  final String id;
  final String name;
  final IconData icon;
  final Map<String, double> settings;
  
  BeautyPreset({
    required this.id,
    required this.name,
    required this.icon,
    required this.settings,
  });
}