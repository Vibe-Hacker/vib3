import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class CaptionsModule extends StatefulWidget {
  const CaptionsModule({super.key});
  
  @override
  State<CaptionsModule> createState() => _CaptionsModuleState();
}

class _CaptionsModuleState extends State<CaptionsModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Caption settings
  bool _autoCaptionsEnabled = false;
  String _selectedLanguage = 'English';
  CaptionStyle _selectedStyle = CaptionStyle.modern;
  
  // Auto-generated captions (simulated)
  final List<Caption> _generatedCaptions = [];
  Caption? _selectedCaption;
  
  // Text editor
  final TextEditingController _captionTextController = TextEditingController();
  
  // Languages
  final List<String> _languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Chinese',
    'Japanese',
    'Korean',
    'Hindi',
  ];
  
  // Caption styles
  final Map<CaptionStyle, CaptionStyleConfig> _captionStyles = {
    CaptionStyle.modern: CaptionStyleConfig(
      name: 'Modern',
      fontFamily: 'Arial',
      backgroundColor: Colors.black.withOpacity(0.7),
      textColor: Colors.white,
      borderColor: null,
      fontSize: 16,
    ),
    CaptionStyle.bold: CaptionStyleConfig(
      name: 'Bold',
      fontFamily: 'Arial Black',
      backgroundColor: Colors.yellow,
      textColor: Colors.black,
      borderColor: Colors.black,
      fontSize: 18,
    ),
    CaptionStyle.minimal: CaptionStyleConfig(
      name: 'Minimal',
      fontFamily: 'Helvetica',
      backgroundColor: Colors.transparent,
      textColor: Colors.white,
      borderColor: Colors.black,
      fontSize: 14,
    ),
    CaptionStyle.neon: CaptionStyleConfig(
      name: 'Neon',
      fontFamily: 'Arial',
      backgroundColor: Colors.transparent,
      textColor: const Color(0xFF00CED1),
      borderColor: const Color(0xFF00CED1),
      fontSize: 16,
      glowEffect: true,
    ),
    CaptionStyle.retro: CaptionStyleConfig(
      name: 'Retro',
      fontFamily: 'Courier',
      backgroundColor: Colors.black,
      textColor: Colors.green,
      borderColor: Colors.green,
      fontSize: 16,
    ),
    CaptionStyle.elegant: CaptionStyleConfig(
      name: 'Elegant',
      fontFamily: 'Georgia',
      backgroundColor: Colors.white.withOpacity(0.9),
      textColor: Colors.black,
      borderColor: null,
      fontSize: 15,
    ),
  };
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _captionTextController.dispose();
    super.dispose();
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
                  'Captions',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _generatedCaptions.isNotEmpty ? _applyCaptions : null,
                  child: Text(
                    'Apply',
                    style: TextStyle(
                      color: _generatedCaptions.isNotEmpty 
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
              Tab(text: 'Auto'),
              Tab(text: 'Manual'),
              Tab(text: 'Style'),
            ],
          ),
          
          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAutoTab(),
                _buildManualTab(),
                _buildStyleTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAutoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Auto-caption toggle
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(
                      Icons.auto_awesome,
                      color: Color(0xFF00CED1),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Auto-Generate Captions',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'AI-powered speech recognition',
                            style: TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _autoCaptionsEnabled,
                      onChanged: (value) {
                        setState(() {
                          _autoCaptionsEnabled = value;
                          if (value) {
                            _generateCaptions();
                          }
                        });
                      },
                      activeColor: const Color(0xFF00CED1),
                    ),
                  ],
                ),
                
                if (_autoCaptionsEnabled) ...[
                  const SizedBox(height: 16),
                  
                  // Language selection
                  DropdownButtonFormField<String>(
                    value: _selectedLanguage,
                    decoration: InputDecoration(
                      labelText: 'Language',
                      labelStyle: const TextStyle(color: Colors.white54),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.1),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    dropdownColor: const Color(0xFF2A2A2A),
                    style: const TextStyle(color: Colors.white),
                    items: _languages.map((lang) => 
                      DropdownMenuItem(
                        value: lang,
                        child: Text(lang),
                      ),
                    ).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedLanguage = value!;
                        _generateCaptions();
                      });
                    },
                  ),
                ],
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Generated captions
          if (_generatedCaptions.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Generated Captions',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${_generatedCaptions.length} segments',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Caption list
            ..._generatedCaptions.map((caption) => _buildCaptionItem(caption)),
            
            const SizedBox(height: 20),
            
            // Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _editAllCaptions,
                    icon: const Icon(Icons.edit),
                    label: const Text('Edit All'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white30),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _regenerateCaptions,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Regenerate'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00CED1),
                      foregroundColor: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
          ] else if (_autoCaptionsEnabled) ...[
            // Loading state
            Center(
              child: Column(
                children: [
                  const CircularProgressIndicator(
                    color: Color(0xFF00CED1),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Analyzing audio...',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // Accuracy notice
          if (_generatedCaptions.isNotEmpty) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                children: const [
                  Icon(
                    Icons.info_outline,
                    color: Colors.orange,
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Review and edit captions for accuracy',
                      style: TextStyle(
                        color: Colors.orange,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildManualTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Add caption button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _addManualCaption,
              icon: const Icon(Icons.add),
              label: const Text('Add Caption'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00CED1),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Manual captions list
          if (_generatedCaptions.isNotEmpty) ...[
            const Text(
              'Caption Timeline',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            // Timeline visualization
            Container(
              height: 80,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(8),
              ),
              child: CustomPaint(
                size: Size.infinite,
                painter: CaptionTimelinePainter(
                  captions: _generatedCaptions,
                  totalDuration: const Duration(seconds: 30), // Example duration
                  selectedCaption: _selectedCaption,
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Caption editor
            if (_selectedCaption != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Edit Caption',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () => _deleteCaption(_selectedCaption!),
                          icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    // Text input
                    TextField(
                      controller: _captionTextController,
                      maxLines: 2,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.1),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onChanged: (text) {
                        setState(() {
                          _selectedCaption!.text = text;
                        });
                      },
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Timing controls
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Start Time',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _formatTimestamp(_selectedCaption!.startTime),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'End Time',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  _formatTimestamp(_selectedCaption!.endTime),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
  
  Widget _buildStyleTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Style preview
          Container(
            height: 150,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Center(
              child: _buildCaptionPreview(),
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Style options
          const Text(
            'Caption Style',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
            ),
            itemCount: _captionStyles.length,
            itemBuilder: (context, index) {
              final style = CaptionStyle.values[index];
              final config = _captionStyles[style]!;
              final isSelected = _selectedStyle == style;
              
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedStyle = style;
                  });
                  HapticFeedback.lightImpact();
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected 
                        ? const Color(0xFF00CED1).withOpacity(0.2)
                        : Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected 
                          ? const Color(0xFF00CED1)
                          : Colors.transparent,
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: config.backgroundColor,
                            borderRadius: BorderRadius.circular(4),
                            border: config.borderColor != null
                                ? Border.all(color: config.borderColor!)
                                : null,
                          ),
                          child: Text(
                            'Aa',
                            style: TextStyle(
                              color: config.textColor,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          config.name,
                          style: TextStyle(
                            color: isSelected 
                                ? const Color(0xFF00CED1)
                                : Colors.white54,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          
          const SizedBox(height: 20),
          
          // Position settings
          const Text(
            'Position',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                // Vertical position
                Row(
                  children: [
                    const Icon(
                      Icons.vertical_align_bottom,
                      color: Colors.white54,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Vertical Position',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '80%',
                      style: TextStyle(
                        color: const Color(0xFF00CED1),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                Slider(
                  value: 0.8,
                  onChanged: (value) {},
                  activeColor: const Color(0xFF00CED1),
                  inactiveColor: Colors.white.withOpacity(0.2),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCaptionItem(Caption caption) {
    final isSelected = _selectedCaption == caption;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCaption = caption;
          _captionTextController.text = caption.text;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected 
              ? const Color(0xFF00CED1).withOpacity(0.2)
              : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected 
                ? const Color(0xFF00CED1)
                : Colors.transparent,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    caption.text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_formatTimestamp(caption.startTime)} - ${_formatTimestamp(caption.endTime)}',
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected) ...[
              IconButton(
                onPressed: () => _editCaption(caption),
                icon: const Icon(
                  Icons.edit,
                  color: Color(0xFF00CED1),
                  size: 20,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildCaptionPreview() {
    final config = _captionStyles[_selectedStyle]!;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: config.borderColor != null
            ? Border.all(color: config.borderColor!, width: 2)
            : null,
        boxShadow: config.glowEffect == true
            ? [
                BoxShadow(
                  color: config.textColor.withOpacity(0.5),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ]
            : null,
      ),
      child: Text(
        'Sample Caption Text',
        style: TextStyle(
          color: config.textColor,
          fontSize: config.fontSize,
          fontWeight: FontWeight.bold,
          fontFamily: config.fontFamily,
        ),
      ),
    );
  }
  
  void _generateCaptions() {
    // Simulate caption generation
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _generatedCaptions.clear();
        _generatedCaptions.addAll([
          Caption(
            id: '1',
            text: 'Welcome to this amazing video tutorial',
            startTime: const Duration(seconds: 0),
            endTime: const Duration(seconds: 3),
          ),
          Caption(
            id: '2',
            text: 'Today we\'re going to learn something new',
            startTime: const Duration(seconds: 3),
            endTime: const Duration(seconds: 6),
          ),
          Caption(
            id: '3',
            text: 'Let\'s get started with the basics',
            startTime: const Duration(seconds: 6),
            endTime: const Duration(seconds: 9),
          ),
        ]);
      });
    });
  }
  
  void _editAllCaptions() {
    // Open bulk editor
  }
  
  void _regenerateCaptions() {
    setState(() {
      _generatedCaptions.clear();
    });
    _generateCaptions();
  }
  
  void _addManualCaption() {
    final newCaption = Caption(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: 'New caption',
      startTime: Duration(seconds: _generatedCaptions.length * 3),
      endTime: Duration(seconds: (_generatedCaptions.length + 1) * 3),
    );
    
    setState(() {
      _generatedCaptions.add(newCaption);
      _selectedCaption = newCaption;
      _captionTextController.text = newCaption.text;
    });
  }
  
  void _editCaption(Caption caption) {
    setState(() {
      _selectedCaption = caption;
      _captionTextController.text = caption.text;
    });
    _tabController.animateTo(1); // Switch to manual tab
  }
  
  void _deleteCaption(Caption caption) {
    setState(() {
      _generatedCaptions.remove(caption);
      if (_selectedCaption == caption) {
        _selectedCaption = null;
        _captionTextController.clear();
      }
    });
  }
  
  String _formatTimestamp(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    final milliseconds = ((duration.inMilliseconds % 1000) / 10).round().toString().padLeft(2, '0');
    return '$minutes:$seconds.$milliseconds';
  }
  
  void _applyCaptions() {
    final creationState = context.read<CreationStateProvider>();
    
    creationState.addEffect(
      VideoEffect(
        type: 'captions',
        parameters: {
          'captions': _generatedCaptions.map((caption) => {
            'id': caption.id,
            'text': caption.text,
            'startTime': caption.startTime.inMilliseconds,
            'endTime': caption.endTime.inMilliseconds,
          }).toList(),
          'style': _selectedStyle.toString(),
          'language': _selectedLanguage,
        },
      ),
    );
    
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Captions applied'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
}

// Data models
class Caption {
  final String id;
  String text;
  Duration startTime;
  Duration endTime;
  
  Caption({
    required this.id,
    required this.text,
    required this.startTime,
    required this.endTime,
  });
}

enum CaptionStyle {
  modern,
  bold,
  minimal,
  neon,
  retro,
  elegant,
}

class CaptionStyleConfig {
  final String name;
  final String fontFamily;
  final Color backgroundColor;
  final Color textColor;
  final Color? borderColor;
  final double fontSize;
  final bool? glowEffect;
  
  CaptionStyleConfig({
    required this.name,
    required this.fontFamily,
    required this.backgroundColor,
    required this.textColor,
    this.borderColor,
    required this.fontSize,
    this.glowEffect,
  });
}

// Custom painter for timeline
class CaptionTimelinePainter extends CustomPainter {
  final List<Caption> captions;
  final Duration totalDuration;
  final Caption? selectedCaption;
  
  CaptionTimelinePainter({
    required this.captions,
    required this.totalDuration,
    this.selectedCaption,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    // Background
    final backgroundPaint = Paint()
      ..color = Colors.white.withOpacity(0.1);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(8),
      ),
      backgroundPaint,
    );
    
    // Draw caption blocks
    for (final caption in captions) {
      final startX = size.width * caption.startTime.inMilliseconds / totalDuration.inMilliseconds;
      final endX = size.width * caption.endTime.inMilliseconds / totalDuration.inMilliseconds;
      final isSelected = caption == selectedCaption;
      
      final paint = Paint()
        ..color = isSelected 
            ? const Color(0xFF00CED1)
            : Colors.white.withOpacity(0.3);
      
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTRB(startX, 20, endX, size.height - 20),
          const Radius.circular(4),
        ),
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}