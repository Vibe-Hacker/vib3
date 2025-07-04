import 'package:flutter/material.dart';

class TextOverlayWidget extends StatefulWidget {
  final String videoPath;

  const TextOverlayWidget({super.key, required this.videoPath});

  @override
  State<TextOverlayWidget> createState() => _TextOverlayWidgetState();
}

class _TextOverlayWidgetState extends State<TextOverlayWidget> {
  final TextEditingController _textController = TextEditingController();
  final List<TextOverlay> _textOverlays = [];
  int _selectedFontIndex = 0;
  int _selectedColorIndex = 0;
  double _fontSize = 24.0;
  bool _isBold = false;
  bool _isItalic = false;
  double _textOpacity = 1.0;
  int _selectedStickerIndex = -1;

  final List<String> _fonts = [
    'Roboto',
    'Arial',
    'Times New Roman',
    'Helvetica',
    'Comic Sans MS',
    'Impact',
    'Lobster',
    'Dancing Script',
  ];

  final List<Color> _colors = [
    Colors.white,
    Colors.black,
    const Color(0xFF00CED1),
    const Color(0xFF1E90FF),
    Colors.red,
    Colors.yellow,
    Colors.green,
    Colors.purple,
    Colors.orange,
    Colors.pink,
  ];

  final List<String> _stickers = [
    '😀', '😂', '😍', '😎', '🤔', '😭', '🔥', '💯',
    '❤️', '💕', '👍', '👎', '✨', '⭐', '🎉', '🎊',
    '🚀', '🌟', '💫', '☀️', '🌙', '🌈', '⚡', '💥',
  ];

  void _addTextOverlay() {
    if (_textController.text.trim().isEmpty) return;

    final overlay = TextOverlay(
      text: _textController.text.trim(),
      position: const Offset(0.5, 0.5), // Center position
      fontSize: _fontSize,
      color: _colors[_selectedColorIndex],
      fontFamily: _fonts[_selectedFontIndex],
      isBold: _isBold,
      isItalic: _isItalic,
      opacity: _textOpacity,
      duration: const Duration(seconds: 30), // Default duration
      startTime: Duration.zero,
    );

    setState(() {
      _textOverlays.add(overlay);
      _textController.clear();
    });
  }

  void _addStickerOverlay(String sticker) {
    final overlay = TextOverlay(
      text: sticker,
      position: const Offset(0.3, 0.3), // Offset position
      fontSize: 48.0,
      color: Colors.white,
      fontFamily: 'emoji',
      isBold: false,
      isItalic: false,
      opacity: 1.0,
      duration: const Duration(seconds: 30), // Default duration
      startTime: Duration.zero,
    );

    setState(() {
      _textOverlays.add(overlay);
    });
  }

  void _removeTextOverlay(int index) {
    setState(() {
      _textOverlays.removeAt(index);
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Text & Stickers',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Text input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Enter text...',
                    hintStyle: TextStyle(color: Colors.grey[500]),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[700]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey[700]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: Color(0xFF00CED1)),
                    ),
                    filled: true,
                    fillColor: Colors.grey[900],
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _addTextOverlay,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00CED1),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Add', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Text formatting options
          Row(
            children: [
              // Font selection
              Expanded(
                child: DropdownButton<int>(
                  value: _selectedFontIndex,
                  isExpanded: true,
                  dropdownColor: Colors.grey[900],
                  style: const TextStyle(color: Colors.white),
                  items: List.generate(_fonts.length, (index) {
                    return DropdownMenuItem(
                      value: index,
                      child: Text(_fonts[index]),
                    );
                  }),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedFontIndex = value;
                      });
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              
              // Bold toggle
              IconButton(
                onPressed: () => setState(() => _isBold = !_isBold),
                icon: Icon(
                  Icons.format_bold,
                  color: _isBold ? const Color(0xFF00CED1) : Colors.grey[400],
                ),
              ),
              
              // Italic toggle
              IconButton(
                onPressed: () => setState(() => _isItalic = !_isItalic),
                icon: Icon(
                  Icons.format_italic,
                  color: _isItalic ? const Color(0xFF00CED1) : Colors.grey[400],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          // Color selection
          SizedBox(
            height: 30,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _colors.length,
              itemBuilder: (context, index) {
                final isSelected = index == _selectedColorIndex;
                return GestureDetector(
                  onTap: () => setState(() => _selectedColorIndex = index),
                  child: Container(
                    width: 30,
                    height: 30,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: _colors[index],
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? const Color(0xFF00CED1) : Colors.grey[600]!,
                        width: isSelected ? 3 : 1,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Font size slider
          Row(
            children: [
              const Text('Size:', style: TextStyle(color: Colors.white70, fontSize: 12)),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: const Color(0xFF00CED1),
                    inactiveTrackColor: Colors.grey[700],
                    thumbColor: const Color(0xFF00CED1),
                    trackHeight: 2,
                  ),
                  child: Slider(
                    value: _fontSize,
                    min: 12,
                    max: 48,
                    onChanged: (value) => setState(() => _fontSize = value),
                  ),
                ),
              ),
              Text('${_fontSize.toInt()}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ],
          ),
          
          // Stickers section
          const SizedBox(height: 8),
          const Text(
            'Stickers',
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 4),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _stickers.length,
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: () => _addStickerOverlay(_stickers[index]),
                  child: Container(
                    width: 40,
                    height: 40,
                    margin: const EdgeInsets.only(right: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey[800],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        _stickers[index],
                        style: const TextStyle(fontSize: 20),
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
}

class TextOverlay {
  final String text;
  final Offset position;
  final double fontSize;
  final Color color;
  final String fontFamily;
  final bool isBold;
  final bool isItalic;
  final double opacity;
  final Duration duration;
  final Duration startTime;

  const TextOverlay({
    required this.text,
    required this.position,
    required this.fontSize,
    required this.color,
    required this.fontFamily,
    required this.isBold,
    required this.isItalic,
    required this.opacity,
    required this.duration,
    required this.startTime,
  });
}