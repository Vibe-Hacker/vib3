import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class FiltersModule extends StatefulWidget {
  const FiltersModule({super.key});
  
  @override
  State<FiltersModule> createState() => _FiltersModuleState();
}

class _FiltersModuleState extends State<FiltersModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Filter categories
  final Map<String, List<FilterItem>> _filterCategories = {
    'Portrait': [
      FilterItem(id: 'smooth', name: 'Smooth', intensity: 0.5),
      FilterItem(id: 'glow', name: 'Glow', intensity: 0.3),
      FilterItem(id: 'beauty', name: 'Beauty', intensity: 0.6),
      FilterItem(id: 'clear', name: 'Clear', intensity: 0.4),
    ],
    'Landscape': [
      FilterItem(id: 'vivid', name: 'Vivid', intensity: 0.7),
      FilterItem(id: 'sunny', name: 'Sunny', intensity: 0.5),
      FilterItem(id: 'cloudy', name: 'Cloudy', intensity: 0.4),
      FilterItem(id: 'sunset', name: 'Sunset', intensity: 0.6),
    ],
    'Vibe': [
      FilterItem(id: 'vintage', name: 'Vintage', intensity: 0.5),
      FilterItem(id: 'retro', name: 'Retro', intensity: 0.6),
      FilterItem(id: 'film', name: 'Film', intensity: 0.4),
      FilterItem(id: 'polaroid', name: 'Polaroid', intensity: 0.5),
    ],
    'Food': [
      FilterItem(id: 'delicious', name: 'Delicious', intensity: 0.6),
      FilterItem(id: 'fresh', name: 'Fresh', intensity: 0.5),
      FilterItem(id: 'warm_meal', name: 'Warm', intensity: 0.4),
      FilterItem(id: 'crispy', name: 'Crispy', intensity: 0.5),
    ],
    'Black & White': [
      FilterItem(id: 'classic_bw', name: 'Classic', intensity: 1.0),
      FilterItem(id: 'contrast_bw', name: 'Contrast', intensity: 0.8),
      FilterItem(id: 'soft_bw', name: 'Soft', intensity: 0.6),
      FilterItem(id: 'dramatic_bw', name: 'Dramatic', intensity: 0.9),
    ],
  };
  
  // Beauty adjustments
  final Map<String, double> _beautyAdjustments = {
    'smooth_skin': 0.0,
    'big_eyes': 0.0,
    'slim_face': 0.0,
    'whitening': 0.0,
    'rosy': 0.0,
  };
  
  // Color adjustments
  final Map<String, double> _colorAdjustments = {
    'brightness': 0.0,
    'contrast': 0.0,
    'saturation': 0.0,
    'temperature': 0.0,
    'sharpness': 0.0,
    'vignette': 0.0,
  };
  
  String? _selectedFilter;
  double _filterIntensity = 1.0;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        // Tab bar
        Container(
          color: Colors.black.withOpacity(0.5),
          child: TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Filters'),
              Tab(text: 'Beauty'),
              Tab(text: 'Adjust'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildFiltersTab(creationState),
              _buildBeautyTab(creationState),
              _buildAdjustTab(creationState),
            ],
          ),
        ),
        
        // Intensity slider (shown for filters and beauty)
        if (_tabController.index < 2 && _selectedFilter != null)
          _buildIntensitySlider(),
      ],
    );
  }
  
  Widget _buildFiltersTab(CreationStateProvider creationState) {
    return DefaultTabController(
      length: _filterCategories.length,
      child: Column(
        children: [
          // Category tabs
          Container(
            height: 40,
            color: Colors.black.withOpacity(0.3),
            child: TabBar(
              isScrollable: true,
              indicatorColor: const Color(0xFF00CED1),
              indicatorWeight: 2,
              labelColor: const Color(0xFF00CED1),
              unselectedLabelColor: Colors.white54,
              labelStyle: const TextStyle(fontSize: 12),
              tabs: _filterCategories.keys.map((category) => 
                Tab(text: category)
              ).toList(),
            ),
          ),
          
          // Filter options
          Expanded(
            child: TabBarView(
              children: _filterCategories.entries.map((entry) => 
                _buildFilterGrid(entry.value, creationState)
              ).toList(),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildFilterGrid(List<FilterItem> filters, CreationStateProvider creationState) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.8,
      ),
      itemCount: filters.length + 1, // +1 for "None" option
      itemBuilder: (context, index) {
        if (index == 0) {
          // None option
          final isSelected = _selectedFilter == null;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedFilter = null;
              });
              creationState.setFilter('none');
            },
            child: _buildFilterTile(
              name: 'None',
              isSelected: isSelected,
              preview: Container(
                color: Colors.grey[800],
                child: const Center(
                  child: Icon(
                    Icons.block,
                    color: Colors.white54,
                    size: 30,
                  ),
                ),
              ),
            ),
          );
        }
        
        final filter = filters[index - 1];
        final isSelected = _selectedFilter == filter.id;
        
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedFilter = filter.id;
              _filterIntensity = filter.intensity;
            });
            creationState.setFilter(filter.id);
          },
          child: _buildFilterTile(
            name: filter.name,
            isSelected: isSelected,
            preview: Container(
              decoration: BoxDecoration(
                gradient: _getFilterGradient(filter.id),
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildFilterTile({
    required String name,
    required bool isSelected,
    required Widget preview,
  }) {
    return Column(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? const Color(0xFF00CED1) : Colors.white30,
                width: isSelected ? 3 : 1,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: preview,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          style: TextStyle(
            color: isSelected ? const Color(0xFF00CED1) : Colors.white,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
  
  Widget _buildBeautyTab(CreationStateProvider creationState) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: _beautyAdjustments.entries.map((entry) => 
          _buildAdjustmentSlider(
            label: _getBeautyLabel(entry.key),
            icon: _getBeautyIcon(entry.key),
            value: entry.value,
            onChanged: (value) {
              setState(() {
                _beautyAdjustments[entry.key] = value;
              });
              // Apply beauty adjustment
              creationState.setBeautyIntensity(value);
            },
          ),
        ).toList(),
      ),
    );
  }
  
  Widget _buildAdjustTab(CreationStateProvider creationState) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: _colorAdjustments.entries.map((entry) => 
          _buildAdjustmentSlider(
            label: _getAdjustmentLabel(entry.key),
            icon: _getAdjustmentIcon(entry.key),
            value: entry.value,
            min: -1.0,
            max: 1.0,
            onChanged: (value) {
              setState(() {
                _colorAdjustments[entry.key] = value;
              });
              // Apply color adjustment
            },
          ),
        ).toList(),
      ),
    );
  }
  
  Widget _buildAdjustmentSlider({
    required String label,
    required IconData icon,
    required double value,
    double min = 0.0,
    double max = 1.0,
    required Function(double) onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: Column(
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.white54, size: 20),
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
              const Spacer(),
              Text(
                '${((value - min) / (max - min) * 100).toInt()}%',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              activeColor: const Color(0xFF00CED1),
              inactiveColor: Colors.white.withOpacity(0.2),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildIntensitySlider() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.1)),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.opacity, color: Colors.white54, size: 20),
          const SizedBox(width: 10),
          const Text(
            'Intensity',
            style: TextStyle(color: Colors.white, fontSize: 14),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Slider(
              value: _filterIntensity,
              onChanged: (value) {
                setState(() {
                  _filterIntensity = value;
                });
                // Apply intensity change
              },
              activeColor: const Color(0xFF00CED1),
              inactiveColor: Colors.white.withOpacity(0.2),
            ),
          ),
          Text(
            '${(_filterIntensity * 100).toInt()}%',
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ],
      ),
    );
  }
  
  LinearGradient _getFilterGradient(String filterId) {
    switch (filterId) {
      case 'vintage':
        return LinearGradient(
          colors: [Colors.brown.withOpacity(0.3), Colors.orange.withOpacity(0.2)],
        );
      case 'sunny':
        return LinearGradient(
          colors: [Colors.yellow.withOpacity(0.3), Colors.orange.withOpacity(0.2)],
        );
      case 'cloudy':
        return LinearGradient(
          colors: [Colors.grey.withOpacity(0.3), Colors.blue.withOpacity(0.2)],
        );
      case 'sunset':
        return LinearGradient(
          colors: [Colors.orange.withOpacity(0.4), Colors.pink.withOpacity(0.3)],
        );
      default:
        return LinearGradient(
          colors: [Colors.white.withOpacity(0.1), Colors.white.withOpacity(0.2)],
        );
    }
  }
  
  String _getBeautyLabel(String key) {
    switch (key) {
      case 'smooth_skin':
        return 'Smooth Skin';
      case 'big_eyes':
        return 'Big Eyes';
      case 'slim_face':
        return 'Slim Face';
      case 'whitening':
        return 'Whitening';
      case 'rosy':
        return 'Rosy';
      default:
        return key;
    }
  }
  
  IconData _getBeautyIcon(String key) {
    switch (key) {
      case 'smooth_skin':
        return Icons.blur_on;
      case 'big_eyes':
        return Icons.visibility;
      case 'slim_face':
        return Icons.face_retouching_natural;
      case 'whitening':
        return Icons.brightness_7;
      case 'rosy':
        return Icons.local_florist;
      default:
        return Icons.auto_awesome;
    }
  }
  
  String _getAdjustmentLabel(String key) {
    switch (key) {
      case 'brightness':
        return 'Brightness';
      case 'contrast':
        return 'Contrast';
      case 'saturation':
        return 'Saturation';
      case 'temperature':
        return 'Temperature';
      case 'sharpness':
        return 'Sharpness';
      case 'vignette':
        return 'Vignette';
      default:
        return key;
    }
  }
  
  IconData _getAdjustmentIcon(String key) {
    switch (key) {
      case 'brightness':
        return Icons.brightness_6;
      case 'contrast':
        return Icons.contrast;
      case 'saturation':
        return Icons.color_lens;
      case 'temperature':
        return Icons.thermostat;
      case 'sharpness':
        return Icons.details;
      case 'vignette':
        return Icons.vignette;
      default:
        return Icons.tune;
    }
  }
}

// Data model
class FilterItem {
  final String id;
  final String name;
  final double intensity;
  
  FilterItem({
    required this.id,
    required this.name,
    required this.intensity,
  });
}