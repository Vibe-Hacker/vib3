import 'package:flutter/material.dart';

class VideoFiltersWidget extends StatefulWidget {
  final String videoPath;

  const VideoFiltersWidget({super.key, required this.videoPath});

  @override
  State<VideoFiltersWidget> createState() => _VideoFiltersWidgetState();
}

class _VideoFiltersWidgetState extends State<VideoFiltersWidget> {
  String _selectedFilter = 'None';
  
  final List<_FilterOption> _filters = [
    _FilterOption(name: 'None', color: null, icon: Icons.block),
    _FilterOption(name: 'Vintage', color: Color(0x40F4A460), icon: Icons.photo_filter),
    _FilterOption(name: 'B&W', color: Color(0xFF000000), icon: Icons.filter_b_and_w),
    _FilterOption(name: 'Warm', color: Color(0x20FF8C00), icon: Icons.wb_sunny),
    _FilterOption(name: 'Cool', color: Color(0x20008CFF), icon: Icons.ac_unit),
    _FilterOption(name: 'Dramatic', color: Color(0x40800080), icon: Icons.theaters),
    _FilterOption(name: 'Vivid', color: Color(0x20FF0080), icon: Icons.palette),
    _FilterOption(name: 'Retro', color: Color(0x30FF69B4), icon: Icons.camera_alt),
    _FilterOption(name: 'Film', color: Color(0x25000000), icon: Icons.movie),
  ];

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
          Text(
            'Video Filters',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Filter grid - TikTok style
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1,
              ),
              itemCount: _filters.length,
              itemBuilder: (context, index) {
                final filter = _filters[index];
                final isSelected = _selectedFilter == filter.name;
                
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedFilter = filter.name;
                    });
                    
                    // Notify parent about filter change
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${filter.name} filter applied'),
                        backgroundColor: Color(0xFF00CED1),
                        duration: Duration(seconds: 1),
                      ),
                    );
                  },
                  child: AnimatedContainer(
                    duration: Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? Color(0xFF00CED1) : Colors.grey[700]!,
                        width: isSelected ? 3 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: Color(0xFF00CED1).withOpacity(0.3),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ]
                          : null,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(11),
                      child: Stack(
                        children: [
                          // Background
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Colors.grey[800]!,
                                  Colors.grey[900]!,
                                ],
                              ),
                            ),
                          ),
                          
                          // Filter preview
                          if (filter.color != null)
                            Container(
                              color: filter.color,
                            ),
                          
                          // Content
                          Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  filter.icon,
                                  color: Colors.white,
                                  size: 28,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  filter.name,
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          
                          // Selected indicator
                          if (isSelected)
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: Color(0xFF00CED1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.check,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Manual adjustments section
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[850],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _buildSlider('Brightness', _brightness, -1.0, 1.0, (value) {
                  setState(() {
                    _brightness = value;
                  });
                }),
                _buildSlider('Contrast', _contrast, 0.0, 2.0, (value) {
                  setState(() {
                    _contrast = value;
                  });
                }),
                _buildSlider('Saturation', _saturation, 0.0, 2.0, (value) {
                  setState(() {
                    _saturation = value;
                  });
                }),
              ],
            ),
          ),
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
              thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6),
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
          width: 40,
          child: Text(
            value.toStringAsFixed(1),
            style: TextStyle(color: Colors.white54, fontSize: 12),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}

class _FilterOption {
  final String name;
  final Color? color;
  final IconData icon;

  const _FilterOption({
    required this.name,
    this.color,
    required this.icon,
  });
}