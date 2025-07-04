import 'package:flutter/material.dart';

class VideoFiltersWidget extends StatefulWidget {
  final String videoPath;

  const VideoFiltersWidget({super.key, required this.videoPath});

  @override
  State<VideoFiltersWidget> createState() => _VideoFiltersWidgetState();
}

class _VideoFiltersWidgetState extends State<VideoFiltersWidget> {
  final List<String> _filters = [
    'none',
    'blackAndWhite',
    'vintage',
    'cool',
    'warm',
    'dramatic',
  ];

  final List<String> _filterNames = [
    'None',
    'B&W',
    'Vintage',
    'Cool',
    'Warm',
    'Dramatic',
  ];

  int _selectedFilterIndex = 0;
  double _brightness = 0.0;
  double _contrast = 1.0;
  double _saturation = 1.0;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Filters & Adjustments',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Filter presets
          SizedBox(
            height: 80,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _filters.length,
              itemBuilder: (context, index) {
                final isSelected = index == _selectedFilterIndex;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedFilterIndex = index;
                    });
                    // Apply filter to video
                    print('Applying filter: ${_filterNames[index]} to ${widget.videoPath}');
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
                          Icons.filter_vintage,
                          color: isSelected ? Colors.white : Colors.grey[400],
                          size: 24,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _filterNames[index],
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.grey[400],
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Manual adjustments
          _buildSlider('Brightness', _brightness, -1.0, 1.0, (value) {
            setState(() {
              _brightness = value;
            });
            // Apply brightness adjustment
            _applyColorAdjustments();
          }),
          
          _buildSlider('Contrast', _contrast, 0.0, 2.0, (value) {
            setState(() {
              _contrast = value;
            });
            // Apply contrast adjustment
            _applyColorAdjustments();
          }),
          
          _buildSlider('Saturation', _saturation, 0.0, 2.0, (value) {
            setState(() {
              _saturation = value;
            });
            // Apply saturation adjustment
            _applyColorAdjustments();
          }),
        ],
      ),
    );
  }

  Widget _buildSlider(String label, double value, double min, double max, Function(double) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 14),
        ),
        const SizedBox(height: 4),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: const Color(0xFF00CED1),
            inactiveTrackColor: Colors.grey[700],
            thumbColor: const Color(0xFF00CED1),
            overlayColor: const Color(0xFF00CED1).withOpacity(0.3),
          ),
          child: Slider(
            value: value,
            min: min,
            max: max,
            onChanged: onChanged,
          ),
        ),
      ],
    );
  }

  void _applyColorAdjustments() {
    // Apply color adjustments to the video
    print('Applying adjustments - Brightness: $_brightness, Contrast: $_contrast, Saturation: $_saturation');
    print('Video path: ${widget.videoPath}');
  }
}