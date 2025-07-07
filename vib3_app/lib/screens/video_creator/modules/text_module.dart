import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class TextModule extends StatefulWidget {
  const TextModule({super.key});
  
  @override
  State<TextModule> createState() => _TextModuleState();
}

class _TextModuleState extends State<TextModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _textController = TextEditingController();
  
  // Text styling
  String _selectedFont = 'System';
  double _fontSize = 24;
  Color _textColor = Colors.white;
  TextAnimation _selectedAnimation = TextAnimation.none;
  bool _hasOutline = false;
  bool _hasShadow = true;
  Color _backgroundColor = Colors.transparent;
  
  // Editing state
  TextOverlay? _editingOverlay;
  int? _editingIndex;
  
  // Fonts
  final List<String> _fonts = [
    'System',
    'Bold',
    'Serif',
    'Script',
    'Bubble',
    'Neon',
    'Retro',
    'Minimal',
  ];
  
  // Sticker categories
  final Map<String, List<StickerItem>> _stickerCategories = {
    'Emoji': [
      StickerItem(id: '1', path: 'assets/stickers/emoji_happy.png'),
      StickerItem(id: '2', path: 'assets/stickers/emoji_love.png'),
      StickerItem(id: '3', path: 'assets/stickers/emoji_laugh.png'),
      StickerItem(id: '4', path: 'assets/stickers/emoji_cool.png'),
    ],
    'GIFs': [
      StickerItem(id: '5', path: 'assets/stickers/gif_dance.gif'),
      StickerItem(id: '6', path: 'assets/stickers/gif_celebrate.gif'),
      StickerItem(id: '7', path: 'assets/stickers/gif_wow.gif'),
      StickerItem(id: '8', path: 'assets/stickers/gif_heart.gif'),
    ],
    'Text': [
      StickerItem(id: '9', path: 'assets/stickers/text_omg.png'),
      StickerItem(id: '10', path: 'assets/stickers/text_lol.png'),
      StickerItem(id: '11', path: 'assets/stickers/text_wow.png'),
      StickerItem(id: '12', path: 'assets/stickers/text_cool.png'),
    ],
    'Effects': [
      StickerItem(id: '13', path: 'assets/stickers/fx_sparkle.png'),
      StickerItem(id: '14', path: 'assets/stickers/fx_fire.png'),
      StickerItem(id: '15', path: 'assets/stickers/fx_stars.png'),
      StickerItem(id: '16', path: 'assets/stickers/fx_hearts.png'),
    ],
  };
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _textController.dispose();
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
              Tab(text: 'Text'),
              Tab(text: 'Stickers'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTextTab(creationState),
              _buildStickersTab(creationState),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildTextTab(CreationStateProvider creationState) {
    return Column(
      children: [
        // Text input
        Container(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _textController,
            style: TextStyle(
              color: _textColor,
              fontSize: _fontSize,
              fontFamily: _getActualFont(_selectedFont),
            ),
            decoration: InputDecoration(
              hintText: 'Enter text...',
              hintStyle: const TextStyle(color: Colors.white54),
              filled: true,
              fillColor: Colors.white.withOpacity(0.1),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              suffixIcon: IconButton(
                onPressed: _addOrUpdateText,
                icon: Icon(
                  _editingOverlay != null ? Icons.check : Icons.add,
                  color: const Color(0xFF00CED1),
                ),
              ),
            ),
            maxLines: 3,
            minLines: 1,
            textAlign: TextAlign.center,
          ),
        ),
        
        // Font selector
        Container(
          height: 50,
          margin: const EdgeInsets.only(bottom: 10),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _fonts.length,
            itemBuilder: (context, index) {
              final font = _fonts[index];
              final isSelected = _selectedFont == font;
              
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedFont = font;
                  });
                },
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 5),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? const Color(0xFF00CED1)
                        : Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: Center(
                    child: Text(
                      'Aa',
                      style: TextStyle(
                        color: isSelected ? Colors.black : Colors.white,
                        fontSize: 18,
                        fontFamily: _getActualFont(font),
                        fontWeight: font == 'Bold' ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        
        // Text styling controls
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                // Size slider
                _buildSliderControl(
                  label: 'Size',
                  value: _fontSize,
                  min: 12,
                  max: 72,
                  onChanged: (value) {
                    setState(() {
                      _fontSize = value;
                    });
                  },
                ),
                
                // Color picker
                _buildColorPicker(),
                
                // Text effects
                _buildTextEffects(),
                
                // Animations
                _buildAnimationSelector(),
                
                // Existing text overlays
                if (creationState.textOverlays.isNotEmpty)
                  _buildExistingTexts(creationState),
              ],
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildStickersTab(CreationStateProvider creationState) {
    return DefaultTabController(
      length: _stickerCategories.length,
      child: Column(
        children: [
          // Category tabs
          Container(
            height: 40,
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: TabBar(
              isScrollable: true,
              indicatorColor: const Color(0xFF00CED1),
              labelColor: const Color(0xFF00CED1),
              unselectedLabelColor: Colors.white54,
              tabs: _stickerCategories.keys.map((category) => 
                Tab(text: category)
              ).toList(),
            ),
          ),
          
          // Sticker grid
          Expanded(
            child: TabBarView(
              children: _stickerCategories.entries.map((entry) => 
                _buildStickerGrid(entry.value, creationState)
              ).toList(),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSliderControl({
    required String label,
    required double value,
    required double min,
    required double max,
    required Function(double) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            Text(
              value.toInt().toString(),
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ],
        ),
        Slider(
          value: value,
          min: min,
          max: max,
          activeColor: const Color(0xFF00CED1),
          inactiveColor: Colors.white.withOpacity(0.2),
          onChanged: onChanged,
        ),
      ],
    );
  }
  
  Widget _buildColorPicker() {
    final colors = [
      Colors.white,
      Colors.black,
      Colors.red,
      Colors.pink,
      Colors.purple,
      Colors.blue,
      Colors.cyan,
      Colors.green,
      Colors.yellow,
      Colors.orange,
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Color',
          style: TextStyle(color: Colors.white, fontSize: 14),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: colors.map((color) => 
            GestureDetector(
              onTap: () {
                setState(() {
                  _textColor = color;
                });
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _textColor == color 
                        ? const Color(0xFF00CED1)
                        : Colors.white30,
                    width: _textColor == color ? 3 : 1,
                  ),
                ),
                child: color == Colors.white
                    ? const Icon(Icons.circle, color: Colors.black, size: 20)
                    : null,
              ),
            ),
          ).toList(),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
  
  Widget _buildTextEffects() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Effects',
          style: TextStyle(color: Colors.white, fontSize: 14),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            _buildEffectChip(
              label: 'Outline',
              isSelected: _hasOutline,
              onTap: () {
                setState(() {
                  _hasOutline = !_hasOutline;
                });
              },
            ),
            const SizedBox(width: 10),
            _buildEffectChip(
              label: 'Shadow',
              isSelected: _hasShadow,
              onTap: () {
                setState(() {
                  _hasShadow = !_hasShadow;
                });
              },
            ),
            const SizedBox(width: 10),
            _buildEffectChip(
              label: 'Background',
              isSelected: _backgroundColor != Colors.transparent,
              onTap: () {
                setState(() {
                  _backgroundColor = _backgroundColor == Colors.transparent
                      ? Colors.black.withOpacity(0.5)
                      : Colors.transparent;
                });
              },
            ),
          ],
        ),
        const SizedBox(height: 20),
      ],
    );
  }
  
  Widget _buildEffectChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected 
              ? const Color(0xFF00CED1)
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.black : Colors.white,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
  
  Widget _buildAnimationSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Animation',
          style: TextStyle(color: Colors.white, fontSize: 14),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: TextAnimation.values.map((animation) => 
            ChoiceChip(
              label: Text(_getAnimationName(animation)),
              selected: _selectedAnimation == animation,
              onSelected: (selected) {
                setState(() {
                  _selectedAnimation = animation;
                });
              },
              backgroundColor: Colors.white.withOpacity(0.1),
              selectedColor: const Color(0xFF00CED1),
              labelStyle: TextStyle(
                color: _selectedAnimation == animation 
                    ? Colors.black 
                    : Colors.white,
                fontSize: 12,
              ),
            ),
          ).toList(),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
  
  Widget _buildExistingTexts(CreationStateProvider creationState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Added Texts',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),
        ...creationState.textOverlays.asMap().entries.map((entry) {
          final index = entry.key;
          final overlay = entry.value;
          
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    overlay.text,
                    style: TextStyle(
                      color: Color(overlay.color),
                      fontSize: 16,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                IconButton(
                  onPressed: () {
                    _editText(index, overlay);
                  },
                  icon: const Icon(Icons.edit, color: Colors.white54),
                ),
                IconButton(
                  onPressed: () {
                    creationState.removeTextOverlay(index);
                  },
                  icon: const Icon(Icons.delete, color: Colors.red),
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }
  
  Widget _buildStickerGrid(List<StickerItem> stickers, CreationStateProvider creationState) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: stickers.length,
      itemBuilder: (context, index) {
        final sticker = stickers[index];
        
        return GestureDetector(
          onTap: () {
            creationState.addSticker(
              StickerOverlay(
                path: sticker.path,
                position: const Offset(100, 200), // Center of screen
              ),
            );
            
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Sticker added! Drag to position.'),
                duration: Duration(seconds: 1),
              ),
            );
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Icon(
                Icons.emoji_emotions,
                color: Colors.white54,
                size: 30,
              ),
            ),
          ),
        );
      },
    );
  }
  
  void _addOrUpdateText() {
    if (_textController.text.isEmpty) return;
    
    final creationState = context.read<CreationStateProvider>();
    
    final overlay = TextOverlay(
      text: _textController.text,
      position: const Offset(100, 200), // Default position
      fontSize: _fontSize,
      fontFamily: _getActualFont(_selectedFont),
      color: _textColor.value,
      animation: _selectedAnimation,
    );
    
    if (_editingIndex != null) {
      creationState.updateTextOverlay(_editingIndex!, overlay);
      _editingIndex = null;
      _editingOverlay = null;
    } else {
      creationState.addTextOverlay(overlay);
    }
    
    _textController.clear();
    FocusScope.of(context).unfocus();
  }
  
  void _editText(int index, TextOverlay overlay) {
    setState(() {
      _editingIndex = index;
      _editingOverlay = overlay;
      _textController.text = overlay.text;
      _fontSize = overlay.fontSize;
      _textColor = Color(overlay.color);
      _selectedAnimation = overlay.animation;
    });
  }
  
  String _getActualFont(String fontName) {
    switch (fontName) {
      case 'Bold':
        return 'Roboto';
      case 'Serif':
        return 'Georgia';
      case 'Script':
        return 'Dancing Script';
      case 'Bubble':
        return 'Bubble';
      case 'Neon':
        return 'Neon';
      case 'Retro':
        return 'Retro';
      case 'Minimal':
        return 'Helvetica';
      default:
        return 'System';
    }
  }
  
  String _getAnimationName(TextAnimation animation) {
    switch (animation) {
      case TextAnimation.none:
        return 'None';
      case TextAnimation.typewriter:
        return 'Typewriter';
      case TextAnimation.fade:
        return 'Fade';
      case TextAnimation.bounce:
        return 'Bounce';
      case TextAnimation.slide:
        return 'Slide';
      case TextAnimation.zoom:
        return 'Zoom';
    }
  }
}

// Data model
class StickerItem {
  final String id;
  final String path;
  
  StickerItem({
    required this.id,
    required this.path,
  });
}