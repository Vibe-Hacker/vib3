import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class TemplatesModule extends StatefulWidget {
  const TemplatesModule({super.key});
  
  @override
  State<TemplatesModule> createState() => _TemplatesModuleState();
}

class _TemplatesModuleState extends State<TemplatesModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  VideoTemplate? _selectedTemplate;
  String _selectedCategory = 'All';
  
  // Template categories
  final List<String> _categories = [
    'All',
    'Trending',
    'Fashion',
    'Travel',
    'Food',
    'Music',
    'Sports',
    'Education',
    'Comedy',
  ];
  
  // Video templates
  final List<VideoTemplate> _templates = [
    VideoTemplate(
      id: 'beat_drop',
      name: 'Beat Drop',
      category: 'Music',
      thumbnail: 'beat_drop.jpg',
      duration: const Duration(seconds: 15),
      description: 'Epic beat drop transition for music videos',
      clipCount: 3,
      transitions: [
        TemplateTransition(
          type: TransitionType.zoomIn,
          duration: 500,
          beatSync: true,
        ),
        TemplateTransition(
          type: TransitionType.shake,
          duration: 300,
          beatSync: true,
        ),
      ],
      effects: ['slow_motion', 'flash'],
      isPremium: false,
    ),
    VideoTemplate(
      id: 'fashion_runway',
      name: 'Fashion Runway',
      category: 'Fashion',
      thumbnail: 'fashion.jpg',
      duration: const Duration(seconds: 20),
      description: 'Showcase outfits with style',
      clipCount: 4,
      transitions: [
        TemplateTransition(
          type: TransitionType.slide,
          duration: 400,
        ),
        TemplateTransition(
          type: TransitionType.fade,
          duration: 600,
        ),
      ],
      effects: ['blur_transition', 'color_filter'],
      isPremium: true,
    ),
    VideoTemplate(
      id: 'travel_montage',
      name: 'Travel Montage',
      category: 'Travel',
      thumbnail: 'travel.jpg',
      duration: const Duration(seconds: 30),
      description: 'Perfect for vacation highlights',
      clipCount: 6,
      transitions: [
        TemplateTransition(
          type: TransitionType.wipe,
          duration: 500,
        ),
        TemplateTransition(
          type: TransitionType.spin,
          duration: 400,
        ),
      ],
      effects: ['panorama', 'vintage_filter'],
      isPremium: false,
    ),
    VideoTemplate(
      id: 'food_reveal',
      name: 'Food Reveal',
      category: 'Food',
      thumbnail: 'food.jpg',
      duration: const Duration(seconds: 10),
      description: 'Mouth-watering food presentations',
      clipCount: 2,
      transitions: [
        TemplateTransition(
          type: TransitionType.dissolve,
          duration: 800,
        ),
      ],
      effects: ['zoom_focus', 'warm_filter'],
      isPremium: false,
    ),
    VideoTemplate(
      id: 'sports_highlights',
      name: 'Sports Highlights',
      category: 'Sports',
      thumbnail: 'sports.jpg',
      duration: const Duration(seconds: 25),
      description: 'Dynamic sports action compilation',
      clipCount: 5,
      transitions: [
        TemplateTransition(
          type: TransitionType.glitch,
          duration: 200,
        ),
        TemplateTransition(
          type: TransitionType.zoomOut,
          duration: 300,
        ),
      ],
      effects: ['speed_ramp', 'motion_blur'],
      isPremium: true,
    ),
    VideoTemplate(
      id: 'comedy_timing',
      name: 'Comedy Timing',
      category: 'Comedy',
      thumbnail: 'comedy.jpg',
      duration: const Duration(seconds: 15),
      description: 'Perfect comedic timing cuts',
      clipCount: 3,
      transitions: [
        TemplateTransition(
          type: TransitionType.cut,
          duration: 0,
        ),
        TemplateTransition(
          type: TransitionType.freeze,
          duration: 1000,
        ),
      ],
      effects: ['zoom_punch', 'sound_effect'],
      isPremium: false,
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
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
                  'Video Templates',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _selectedTemplate != null ? _useTemplate : null,
                  child: Text(
                    'Use',
                    style: TextStyle(
                      color: _selectedTemplate != null 
                          ? const Color(0xFF00CED1)
                          : Colors.white30,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Tabs
          TabBar(
            controller: _tabController,
            indicatorColor: const Color(0xFF00CED1),
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Templates'),
              Tab(text: 'My Templates'),
            ],
          ),
          
          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTemplatesTab(),
                _buildMyTemplatesTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTemplatesTab() {
    final filteredTemplates = _templates.where((template) {
      return _selectedCategory == 'All' || template.category == _selectedCategory;
    }).toList();
    
    return Column(
      children: [
        // Category filter
        Container(
          height: 40,
          margin: const EdgeInsets.symmetric(vertical: 16),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _categories.length,
            itemBuilder: (context, index) {
              final category = _categories[index];
              final isSelected = _selectedCategory == category;
              
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCategory = category;
                    });
                  },
                  backgroundColor: Colors.white.withOpacity(0.1),
                  selectedColor: const Color(0xFF00CED1),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.black : Colors.white,
                    fontSize: 12,
                  ),
                ),
              );
            },
          ),
        ),
        
        // Template grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.75,
            ),
            itemCount: filteredTemplates.length,
            itemBuilder: (context, index) {
              final template = filteredTemplates[index];
              return _buildTemplateCard(template);
            },
          ),
        ),
        
        // Selected template details
        if (_selectedTemplate != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border(
                top: BorderSide(color: Colors.white.withOpacity(0.1)),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _selectedTemplate!.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _selectedTemplate!.description,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_selectedTemplate!.isPremium)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.amber,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.star, color: Colors.black, size: 14),
                            SizedBox(width: 4),
                            Text(
                              'Premium',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildTemplateInfo(
                      Icons.timer,
                      '${_selectedTemplate!.duration.inSeconds}s',
                    ),
                    const SizedBox(width: 16),
                    _buildTemplateInfo(
                      Icons.movie_filter,
                      '${_selectedTemplate!.clipCount} clips',
                    ),
                    const SizedBox(width: 16),
                    _buildTemplateInfo(
                      Icons.auto_awesome,
                      '${_selectedTemplate!.transitions.length} transitions',
                    ),
                  ],
                ),
              ],
            ),
          ),
      ],
    );
  }
  
  Widget _buildMyTemplatesTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.video_library,
            size: 64,
            color: Colors.white.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'No saved templates yet',
            style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _createCustomTemplate,
            icon: const Icon(Icons.add),
            label: const Text('Create Template'),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF00CED1),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildTemplateCard(VideoTemplate template) {
    final isSelected = _selectedTemplate == template;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTemplate = template;
        });
        HapticFeedback.lightImpact();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected 
                ? const Color(0xFF00CED1)
                : Colors.transparent,
            width: 2,
          ),
        ),
        child: Stack(
          children: [
            // Thumbnail
            Container(
              decoration: BoxDecoration(
                color: Colors.grey[800],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _getCategoryIcon(template.category),
                      color: Colors.white54,
                      size: 40,
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${template.duration.inSeconds}s',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Gradient overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.8),
                    ],
                  ),
                ),
              ),
            ),
            
            // Template info
            Positioned(
              bottom: 12,
              left: 12,
              right: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          template.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (template.isPremium)
                        const Icon(
                          Icons.star,
                          color: Colors.amber,
                          size: 16,
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.movie_filter,
                        color: Colors.white54,
                        size: 12,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${template.clipCount} clips',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 10,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.auto_fix_high,
                        color: Colors.white54,
                        size: 12,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${template.transitions.length}',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            // Play preview button
            if (isSelected)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: const Color(0xFF00CED1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.play_arrow,
                    color: Colors.black,
                    size: 20,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTemplateInfo(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: Colors.white54, size: 16),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
  
  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Music':
        return Icons.music_note;
      case 'Fashion':
        return Icons.checkroom;
      case 'Travel':
        return Icons.flight;
      case 'Food':
        return Icons.restaurant;
      case 'Sports':
        return Icons.sports_basketball;
      case 'Education':
        return Icons.school;
      case 'Comedy':
        return Icons.sentiment_very_satisfied;
      default:
        return Icons.video_library;
    }
  }
  
  void _createCustomTemplate() {
    // Navigate to template creator
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const TemplateCreatorScreen(),
      ),
    );
  }
  
  void _useTemplate() {
    if (_selectedTemplate == null) return;
    
    final creationState = context.read<CreationStateProvider>();
    
    // Apply template settings
    creationState.addEffect(
      VideoEffect(
        type: 'template',
        parameters: {
          'templateId': _selectedTemplate!.id,
          'name': _selectedTemplate!.name,
          'clipCount': _selectedTemplate!.clipCount,
          'duration': _selectedTemplate!.duration.inMilliseconds,
          'transitions': _selectedTemplate!.transitions.map((t) => {
            'type': t.type.toString(),
            'duration': t.duration,
            'beatSync': t.beatSync,
          }).toList(),
          'effects': _selectedTemplate!.effects,
        },
      ),
    );
    
    Navigator.pop(context);
    
    // Show instruction modal
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.check_circle,
              color: Color(0xFF00CED1),
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              '${_selectedTemplate!.name} Template Applied',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Record ${_selectedTemplate!.clipCount} clips of ${_selectedTemplate!.duration.inSeconds ~/ _selectedTemplate!.clipCount} seconds each',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00CED1),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  'Start Recording',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Template creator screen (placeholder)
class TemplateCreatorScreen extends StatelessWidget {
  const TemplateCreatorScreen({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Create Template'),
      ),
      body: const Center(
        child: Text(
          'Template Creator',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}

// Data models
class VideoTemplate {
  final String id;
  final String name;
  final String category;
  final String thumbnail;
  final Duration duration;
  final String description;
  final int clipCount;
  final List<TemplateTransition> transitions;
  final List<String> effects;
  final bool isPremium;
  
  VideoTemplate({
    required this.id,
    required this.name,
    required this.category,
    required this.thumbnail,
    required this.duration,
    required this.description,
    required this.clipCount,
    required this.transitions,
    required this.effects,
    required this.isPremium,
  });
}

class TemplateTransition {
  final TransitionType type;
  final int duration; // milliseconds
  final bool beatSync;
  
  TemplateTransition({
    required this.type,
    required this.duration,
    this.beatSync = false,
  });
}

enum TransitionType {
  cut,
  fade,
  slide,
  zoomIn,
  zoomOut,
  spin,
  wipe,
  dissolve,
  glitch,
  shake,
  freeze,
}