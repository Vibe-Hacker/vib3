import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';
import '../../../services/ar_effects_processor.dart';

class AREffectsModule extends StatefulWidget {
  const AREffectsModule({super.key});
  
  @override
  State<AREffectsModule> createState() => _AREffectsModuleState();
}

class _AREffectsModuleState extends State<AREffectsModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedEffect;
  
  // AR effect categories
  final Map<String, List<AREffect>> _effectCategories = {
    'Face Masks': [
      AREffect(
        id: 'cat_ears',
        name: 'Cat Ears',
        icon: '🐱',
        type: AREffectType.faceMask,
        tracking: ['face', 'head_rotation'],
      ),
      AREffect(
        id: 'dog_face',
        name: 'Dog Face',
        icon: '🐶',
        type: AREffectType.faceMask,
        tracking: ['face', 'mouth', 'head_rotation'],
      ),
      AREffect(
        id: 'bunny',
        name: 'Bunny',
        icon: '🐰',
        type: AREffectType.faceMask,
        tracking: ['face', 'head_rotation'],
      ),
      AREffect(
        id: 'fox',
        name: 'Fox',
        icon: '🦊',
        type: AREffectType.faceMask,
        tracking: ['face', 'head_rotation'],
      ),
      AREffect(
        id: 'bear',
        name: 'Bear',
        icon: '🐻',
        type: AREffectType.faceMask,
        tracking: ['face', 'mouth'],
      ),
      AREffect(
        id: 'panda',
        name: 'Panda',
        icon: '🐼',
        type: AREffectType.faceMask,
        tracking: ['face', 'eyes'],
      ),
    ],
    'Accessories': [
      AREffect(
        id: 'sunglasses',
        name: 'Sunglasses',
        icon: '🕶️',
        type: AREffectType.accessory,
        tracking: ['eyes', 'face'],
      ),
      AREffect(
        id: 'crown',
        name: 'Crown',
        icon: '👑',
        type: AREffectType.accessory,
        tracking: ['head_top'],
      ),
      AREffect(
        id: 'party_hat',
        name: 'Party Hat',
        icon: '🎉',
        type: AREffectType.accessory,
        tracking: ['head_top'],
      ),
      AREffect(
        id: 'horns',
        name: 'Devil Horns',
        icon: '😈',
        type: AREffectType.accessory,
        tracking: ['head_top'],
      ),
      AREffect(
        id: 'halo',
        name: 'Angel Halo',
        icon: '😇',
        type: AREffectType.accessory,
        tracking: ['head_top'],
      ),
      AREffect(
        id: 'glasses',
        name: 'Glasses',
        icon: '👓',
        type: AREffectType.accessory,
        tracking: ['eyes', 'face'],
      ),
    ],
    'Makeup': [
      AREffect(
        id: 'glitter',
        name: 'Glitter',
        icon: '✨',
        type: AREffectType.makeup,
        tracking: ['face', 'cheeks'],
      ),
      AREffect(
        id: 'blush',
        name: 'Blush',
        icon: '🌸',
        type: AREffectType.makeup,
        tracking: ['cheeks'],
      ),
      AREffect(
        id: 'eyeshadow',
        name: 'Eye Shadow',
        icon: '👁️',
        type: AREffectType.makeup,
        tracking: ['eyes'],
      ),
      AREffect(
        id: 'lipstick',
        name: 'Lipstick',
        icon: '💄',
        type: AREffectType.makeup,
        tracking: ['lips'],
      ),
      AREffect(
        id: 'face_paint',
        name: 'Face Paint',
        icon: '🎨',
        type: AREffectType.makeup,
        tracking: ['face'],
      ),
      AREffect(
        id: 'freckles',
        name: 'Freckles',
        icon: '🟤',
        type: AREffectType.makeup,
        tracking: ['cheeks', 'nose'],
      ),
    ],
    '3D Objects': [
      AREffect(
        id: 'floating_hearts',
        name: 'Hearts',
        icon: '💕',
        type: AREffectType.object3D,
        tracking: ['head_position'],
      ),
      AREffect(
        id: 'butterflies',
        name: 'Butterflies',
        icon: '🦋',
        type: AREffectType.object3D,
        tracking: ['head_position', 'face'],
      ),
      AREffect(
        id: 'stars',
        name: 'Stars',
        icon: '⭐',
        type: AREffectType.object3D,
        tracking: ['head_position'],
      ),
      AREffect(
        id: 'snow',
        name: 'Snow',
        icon: '❄️',
        type: AREffectType.object3D,
        tracking: ['scene'],
      ),
      AREffect(
        id: 'confetti',
        name: 'Confetti',
        icon: '🎊',
        type: AREffectType.object3D,
        tracking: ['scene'],
      ),
      AREffect(
        id: 'rainbow',
        name: 'Rainbow',
        icon: '🌈',
        type: AREffectType.object3D,
        tracking: ['head_position'],
      ),
    ],
    'Face Distortion': [
      AREffect(
        id: 'big_eyes',
        name: 'Big Eyes',
        icon: '👀',
        type: AREffectType.distortion,
        tracking: ['eyes'],
      ),
      AREffect(
        id: 'tiny_face',
        name: 'Tiny Face',
        icon: '🤏',
        type: AREffectType.distortion,
        tracking: ['face'],
      ),
      AREffect(
        id: 'big_mouth',
        name: 'Big Mouth',
        icon: '👄',
        type: AREffectType.distortion,
        tracking: ['mouth'],
      ),
      AREffect(
        id: 'symmetry',
        name: 'Perfect Symmetry',
        icon: '🪞',
        type: AREffectType.distortion,
        tracking: ['face'],
      ),
      AREffect(
        id: 'alien',
        name: 'Alien Face',
        icon: '👽',
        type: AREffectType.distortion,
        tracking: ['face', 'eyes'],
      ),
      AREffect(
        id: 'cartoon',
        name: 'Cartoon',
        icon: '🎭',
        type: AREffectType.distortion,
        tracking: ['face'],
      ),
    ],
    'Background': [
      AREffect(
        id: 'bokeh',
        name: 'Bokeh Blur',
        icon: '🔮',
        type: AREffectType.background,
        tracking: ['person_segmentation'],
      ),
      AREffect(
        id: 'portal',
        name: 'Portal',
        icon: '🌀',
        type: AREffectType.background,
        tracking: ['person_segmentation'],
      ),
      AREffect(
        id: 'galaxy',
        name: 'Galaxy',
        icon: '🌌',
        type: AREffectType.background,
        tracking: ['person_segmentation'],
      ),
      AREffect(
        id: 'neon',
        name: 'Neon Outline',
        icon: '💡',
        type: AREffectType.background,
        tracking: ['person_segmentation'],
      ),
      AREffect(
        id: 'pixelate_bg',
        name: 'Pixelate',
        icon: '🟦',
        type: AREffectType.background,
        tracking: ['person_segmentation'],
      ),
      AREffect(
        id: 'comic',
        name: 'Comic Book',
        icon: '💥',
        type: AREffectType.background,
        tracking: ['person_segmentation'],
      ),
    ],
  };
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: _effectCategories.length,
      vsync: this,
    );
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  void _selectEffect(AREffect effect) {
    setState(() {
      _selectedEffect = effect.id;
    });
    
    // Initialize AR processor if needed
    AREffectsProcessor().initialize().then((_) {
      // Apply AR effect to processor
      AREffectsProcessor().setCurrentEffect(effect);
      
      // Apply AR effect to creation state
      final creationState = context.read<CreationStateProvider>();
      creationState.addEffect(
        VideoEffect(
          type: 'ar_effect',
          parameters: {
            'effectId': effect.id,
            'effectType': effect.type.toString(),
            'tracking': effect.tracking,
            'intensity': 1.0,
          },
        ),
      );
      
      print('✅ AR Effect "${effect.name}" activated with real-time processing');
    }).catchError((error) {
      print('❌ Failed to initialize AR processor: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to activate AR effect: $error'),
          backgroundColor: Colors.red,
        ),
      );
    });
    
    HapticFeedback.lightImpact();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.5,
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
                  'AR Effects',
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
                        const SnackBar(
                          content: Text('AR effect applied'),
                          backgroundColor: Color(0xFF00CED1),
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
          
          // Category tabs
          TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: const Color(0xFF00CED1),
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: _effectCategories.keys.map((category) => 
              Tab(text: category)
            ).toList(),
          ),
          
          // Effects grid
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: _effectCategories.entries.map((entry) => 
                _buildEffectGrid(entry.value)
              ).toList(),
            ),
          ),
          
          // Info
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF00CED1).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF00CED1).withOpacity(0.3)),
            ),
            child: Row(
              children: const [
                Icon(
                  Icons.info_outline,
                  color: Color(0xFF00CED1),
                  size: 20,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'AR effects use face tracking to add interactive elements',
                    style: TextStyle(
                      color: Color(0xFF00CED1),
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
  
  Widget _buildEffectGrid(List<AREffect> effects) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.0,
      ),
      itemCount: effects.length,
      itemBuilder: (context, index) {
        final effect = effects[index];
        final isSelected = _selectedEffect == effect.id;
        
        return GestureDetector(
          onTap: () => _selectEffect(effect),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
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
                Text(
                  effect.icon,
                  style: const TextStyle(fontSize: 32),
                ),
                const SizedBox(height: 8),
                Text(
                  effect.name,
                  style: TextStyle(
                    color: isSelected 
                        ? const Color(0xFF00CED1)
                        : Colors.white70,
                    fontSize: 12,
                    fontWeight: isSelected 
                        ? FontWeight.bold 
                        : FontWeight.normal,
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
}

enum AREffectType {
  faceMask,
  accessory,
  makeup,
  object3D,
  distortion,
  background,
}

class AREffect {
  final String id;
  final String name;
  final String icon;
  final AREffectType type;
  final List<String> tracking;
  
  AREffect({
    required this.id,
    required this.name,
    required this.icon,
    required this.type,
    required this.tracking,
  });
}