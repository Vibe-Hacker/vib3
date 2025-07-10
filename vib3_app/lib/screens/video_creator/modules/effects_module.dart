import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';
import 'green_screen_module.dart';

class EffectsModule extends StatefulWidget {
  const EffectsModule({super.key});
  
  @override
  State<EffectsModule> createState() => _EffectsModuleState();
}

class _EffectsModuleState extends State<EffectsModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedCategory = 'Trending';
  
  // Effect categories with items
  final Map<String, List<EffectItem>> _effectCategories = {
    'Trending': [
      EffectItem(id: 'time_warp', name: 'Time Warp Scan', icon: Icons.timeline),
      EffectItem(id: 'green_screen', name: 'Green Screen', icon: Icons.crop_free),
      EffectItem(id: 'clone', name: 'Clone', icon: Icons.content_copy),
      EffectItem(id: 'split_screen', name: 'Split Screen', icon: Icons.splitscreen),
    ],
    'Interactive': [
      EffectItem(id: 'body_tracking', name: 'Body Tracking', icon: Icons.accessibility),
      EffectItem(id: 'face_zoom', name: 'Face Zoom', icon: Icons.zoom_in),
      EffectItem(id: 'shake', name: 'Shake', icon: Icons.vibration),
      EffectItem(id: 'bounce', name: 'Bounce', icon: Icons.sports_basketball),
    ],
    'Visual': [
      EffectItem(id: 'blur_bg', name: 'Blur Background', icon: Icons.blur_on),
      EffectItem(id: 'particle', name: 'Particles', icon: Icons.auto_awesome),
      EffectItem(id: 'glitch', name: 'Glitch', icon: Icons.broken_image),
      EffectItem(id: 'mirror', name: 'Mirror', icon: Icons.flip),
    ],
    'AR': [
      EffectItem(id: 'face_mask', name: 'Face Masks', icon: Icons.face),
      EffectItem(id: '3d_objects', name: '3D Objects', icon: Icons.view_in_ar),
      EffectItem(id: 'makeup', name: 'Makeup', icon: Icons.brush),
      EffectItem(id: 'accessories', name: 'Accessories', icon: Icons.emoji_emotions),
    ],
    'Transitions': [
      EffectItem(id: 'zoom_in', name: 'Zoom In', icon: Icons.zoom_out_map),
      EffectItem(id: 'slide', name: 'Slide', icon: Icons.slideshow),
      EffectItem(id: 'fade', name: 'Fade', icon: Icons.gradient),
      EffectItem(id: 'spin', name: 'Spin', icon: Icons.rotate_right),
    ],
  };
  
  // Background options for green screen
  final List<BackgroundOption> _backgrounds = [
    BackgroundOption(id: 'beach', name: 'Beach', thumbnail: 'assets/bg/beach.jpg'),
    BackgroundOption(id: 'city', name: 'City', thumbnail: 'assets/bg/city.jpg'),
    BackgroundOption(id: 'space', name: 'Space', thumbnail: 'assets/bg/space.jpg'),
    BackgroundOption(id: 'nature', name: 'Nature', thumbnail: 'assets/bg/nature.jpg'),
    BackgroundOption(id: 'studio', name: 'Studio', thumbnail: 'assets/bg/studio.jpg'),
    BackgroundOption(id: 'custom', name: 'Upload', thumbnail: 'add'),
  ];
  
  String? _selectedEffect;
  String? _selectedBackground;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _effectCategories.length, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
    return Column(
      children: [
        // Category tabs
        Container(
          color: Colors.black.withOpacity(0.5),
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: const Color(0xFF00CED1),
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: _effectCategories.keys.map((category) => 
              Tab(text: category)
            ).toList(),
          ),
        ),
        
        // Effects grid
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: _effectCategories.entries.map((entry) =>
              _buildEffectGrid(entry.value, creationState)
            ).toList(),
          ),
        ),
        
        // Effect-specific controls
        if (_selectedEffect != null)
          _buildEffectControls(_selectedEffect!, creationState),
      ],
    );
  }
  
  Widget _buildEffectGrid(List<EffectItem> effects, CreationStateProvider creationState) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.9,
      ),
      itemCount: effects.length,
      itemBuilder: (context, index) {
        final effect = effects[index];
        final isSelected = _selectedEffect == effect.id;
        
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedEffect = isSelected ? null : effect.id;
            });
            
            // Special handling for green screen
            if (effect.id == 'green_screen' && !isSelected) {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => const GreenScreenModule(),
              );
            } else if (!isSelected) {
              creationState.addEffect(
                VideoEffect(
                  type: effect.id,
                  parameters: _getDefaultParameters(effect.id),
                ),
              );
            } else {
              // Remove effect
              creationState.effects.removeWhere((e) => e.type == effect.id);
              creationState.notifyListeners();
            }
          },
          child: Container(
            decoration: BoxDecoration(
              color: isSelected 
                  ? const Color(0xFF00CED1).withOpacity(0.3)
                  : Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: isSelected 
                  ? Border.all(color: const Color(0xFF00CED1), width: 2)
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  effect.icon,
                  color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                  size: 40,
                ),
                const SizedBox(height: 8),
                Text(
                  effect.name,
                  style: TextStyle(
                    color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildEffectControls(String effectId, CreationStateProvider creationState) {
    switch (effectId) {
      case 'green_screen':
        return _buildGreenScreenControls(creationState);
      case 'time_warp':
        return _buildTimeWarpControls(creationState);
      case 'blur_bg':
        return _buildBlurControls(creationState);
      case 'clone':
        return _buildCloneControls(creationState);
      case 'split_screen':
        return _buildSplitScreenControls(creationState);
      default:
        return const SizedBox.shrink();
    }
  }
  
  Widget _buildGreenScreenControls(CreationStateProvider creationState) {
    return Container(
      height: 150,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Choose Background',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _backgrounds.length,
              itemBuilder: (context, index) {
                final bg = _backgrounds[index];
                final isSelected = _selectedBackground == bg.id;
                
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedBackground = bg.id;
                    });
                    
                    if (bg.id == 'custom') {
                      // Open gallery picker
                      _pickCustomBackground();
                    } else {
                      // Update effect parameters
                      final effect = creationState.effects.firstWhere(
                        (e) => e.type == 'green_screen',
                      );
                      effect.parameters['background'] = bg.id;
                      creationState.notifyListeners();
                    }
                  },
                  child: Container(
                    width: 80,
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF00CED1) : Colors.white30,
                        width: isSelected ? 3 : 1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: bg.id == 'custom'
                          ? Container(
                              color: Colors.white.withOpacity(0.1),
                              child: const Icon(
                                Icons.add_photo_alternate,
                                color: Colors.white54,
                                size: 30,
                              ),
                            )
                          : Container(
                              color: Colors.grey[800],
                              child: Center(
                                child: Text(
                                  bg.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTimeWarpControls(CreationStateProvider creationState) {
    return Container(
      height: 100,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Scan Direction',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              'Vertical', 'Horizontal', 'Radial'
            ].map((direction) => Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: ChoiceChip(
                    label: Text(direction),
                    selected: false,
                    onSelected: (selected) {
                      // Update effect parameters
                    },
                    backgroundColor: Colors.white.withOpacity(0.1),
                    labelStyle: const TextStyle(color: Colors.white),
                  ),
                )).toList(),
          ),
        ],
      ),
    );
  }
  
  Widget _buildBlurControls(CreationStateProvider creationState) {
    return Container(
      height: 100,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Blur Intensity',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Slider(
            value: 0.5,
            onChanged: (value) {
              // Update blur intensity
            },
            activeColor: const Color(0xFF00CED1),
            inactiveColor: Colors.white.withOpacity(0.2),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCloneControls(CreationStateProvider creationState) {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Number of Clones',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: List.generate(5, (index) => 
              Padding(
                padding: const EdgeInsets.only(right: 10),
                child: ChoiceChip(
                  label: Text('${index + 2}'),
                  selected: false,
                  onSelected: (selected) {
                    // Update clone count
                  },
                  backgroundColor: Colors.white.withOpacity(0.1),
                  labelStyle: const TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSplitScreenControls(CreationStateProvider creationState) {
    return Container(
      height: 120,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Split Layout',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildLayoutOption(Icons.splitscreen, 'Vertical'),
              _buildLayoutOption(Icons.view_stream, 'Horizontal'),
              _buildLayoutOption(Icons.grid_view, 'Grid'),
              _buildLayoutOption(Icons.picture_in_picture, 'PiP'),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildLayoutOption(IconData icon, String label) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: GestureDetector(
        onTap: () {
          // Select layout
        },
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 24),
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _pickCustomBackground() {
    // TODO: Implement gallery picker for custom background
  }
  
  Map<String, dynamic> _getDefaultParameters(String effectId) {
    switch (effectId) {
      case 'green_screen':
        return {'background': 'beach', 'sensitivity': 0.5};
      case 'time_warp':
        return {'direction': 'vertical', 'speed': 1.0};
      case 'blur_bg':
        return {'intensity': 0.5};
      case 'clone':
        return {'count': 2, 'offset': 50};
      case 'split_screen':
        return {'layout': 'vertical', 'ratio': 0.5};
      default:
        return {};
    }
  }
}

// Data models
class EffectItem {
  final String id;
  final String name;
  final IconData icon;
  
  EffectItem({
    required this.id,
    required this.name,
    required this.icon,
  });
}

class BackgroundOption {
  final String id;
  final String name;
  final String thumbnail;
  
  BackgroundOption({
    required this.id,
    required this.name,
    required this.thumbnail,
  });
}