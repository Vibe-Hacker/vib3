import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class ReactionModule extends StatefulWidget {
  final String? originalVideoId;
  final String? originalVideoUrl;
  
  const ReactionModule({
    super.key,
    this.originalVideoId,
    this.originalVideoUrl,
  });
  
  @override
  State<ReactionModule> createState() => _ReactionModuleState();
}

class _ReactionModuleState extends State<ReactionModule> {
  ReactionLayout _selectedLayout = ReactionLayout.sideBySide;
  double _originalVideoVolume = 0.5;
  double _originalVideoOpacity = 1.0;
  bool _syncPlayback = true;
  VideoPosition _originalPosition = VideoPosition.left;
  double _originalVideoSize = 0.5; // 0.3 to 0.7
  
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
              children: [
                const Icon(
                  Icons.replay,
                  color: Color(0xFF00CED1),
                  size: 24,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Create Reaction Video',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'React or respond to this video',
                        style: TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _applyReactionSettings,
                  child: const Text(
                    'Apply',
                    style: TextStyle(
                      color: Color(0xFF00CED1),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Preview area
          Container(
            height: 200,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Stack(
              children: [
                // Layout preview
                _buildLayoutPreview(),
                
                // Layout label
                Positioned(
                  bottom: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _getLayoutName(_selectedLayout),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Layout options
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Layout Style',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 80,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: ReactionLayout.values.map((layout) {
                      return _buildLayoutOption(layout);
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Settings
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Original video settings
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
                          'Original Video Settings',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Volume
                        Row(
                          children: [
                            const Icon(
                              Icons.volume_up,
                              color: Colors.white54,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Volume',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                            const Spacer(),
                            Text(
                              '${(_originalVideoVolume * 100).toInt()}%',
                              style: const TextStyle(
                                color: Color(0xFF00CED1),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        Slider(
                          value: _originalVideoVolume,
                          onChanged: (value) {
                            setState(() {
                              _originalVideoVolume = value;
                            });
                          },
                          activeColor: const Color(0xFF00CED1),
                          inactiveColor: Colors.white.withOpacity(0.2),
                        ),
                        
                        // Opacity (for overlay layouts)
                        if (_selectedLayout == ReactionLayout.overlay) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.opacity,
                                color: Colors.white54,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Opacity',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${(_originalVideoOpacity * 100).toInt()}%',
                                style: const TextStyle(
                                  color: Color(0xFF00CED1),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          Slider(
                            value: _originalVideoOpacity,
                            onChanged: (value) {
                              setState(() {
                                _originalVideoOpacity = value;
                              });
                            },
                            activeColor: const Color(0xFF00CED1),
                            inactiveColor: Colors.white.withOpacity(0.2),
                          ),
                        ],
                        
                        // Size (for PiP layout)
                        if (_selectedLayout == ReactionLayout.pictureInPicture) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(
                                Icons.photo_size_select_large,
                                color: Colors.white54,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Size',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${(_originalVideoSize * 100).toInt()}%',
                                style: const TextStyle(
                                  color: Color(0xFF00CED1),
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          Slider(
                            value: _originalVideoSize,
                            min: 0.3,
                            max: 0.7,
                            onChanged: (value) {
                              setState(() {
                                _originalVideoSize = value;
                              });
                            },
                            activeColor: const Color(0xFF00CED1),
                            inactiveColor: Colors.white.withOpacity(0.2),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Position options for PiP
                  if (_selectedLayout == ReactionLayout.pictureInPicture) ...[
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
                            'Original Video Position',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          GridView.count(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            crossAxisCount: 2,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                            childAspectRatio: 2.5,
                            children: VideoPosition.values.map((position) {
                              return _buildPositionOption(position);
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  // Sync settings
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.sync,
                          color: Colors.white54,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Sync Playback',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                'Start both videos simultaneously',
                                style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: _syncPlayback,
                          onChanged: (value) {
                            setState(() {
                              _syncPlayback = value;
                            });
                          },
                          activeColor: const Color(0xFF00CED1),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Tips
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00CED1).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFF00CED1).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: const [
                        Icon(
                          Icons.lightbulb_outline,
                          color: Color(0xFF00CED1),
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Tip: Use side-by-side for commentary, PiP for reactions',
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
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildLayoutPreview() {
    switch (_selectedLayout) {
      case ReactionLayout.sideBySide:
        return Row(
          children: [
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.video_library, color: Colors.white54),
                      SizedBox(height: 4),
                      Text(
                        'Original',
                        style: TextStyle(color: Colors.white54, fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF00CED1).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF00CED1)),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.person, color: Color(0xFF00CED1)),
                      SizedBox(height: 4),
                      Text(
                        'You',
                        style: TextStyle(color: Color(0xFF00CED1), fontSize: 10),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
        
      case ReactionLayout.topBottom:
        return Column(
          children: [
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.video_library, color: Colors.white54, size: 16),
                      SizedBox(width: 4),
                      Text('Original', style: TextStyle(color: Colors.white54, fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF00CED1).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF00CED1)),
                ),
                child: const Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.person, color: Color(0xFF00CED1), size: 16),
                      SizedBox(width: 4),
                      Text('You', style: TextStyle(color: Color(0xFF00CED1), fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
        
      case ReactionLayout.pictureInPicture:
        return Stack(
          children: [
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF00CED1).withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF00CED1)),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.person, color: Color(0xFF00CED1), size: 32),
                    SizedBox(height: 4),
                    Text('You', style: TextStyle(color: Color(0xFF00CED1), fontSize: 12)),
                  ],
                ),
              ),
            ),
            Positioned(
              top: _originalPosition == VideoPosition.topLeft || _originalPosition == VideoPosition.topRight ? 16 : null,
              bottom: _originalPosition == VideoPosition.bottomLeft || _originalPosition == VideoPosition.bottomRight ? 16 : null,
              left: _originalPosition == VideoPosition.topLeft || _originalPosition == VideoPosition.bottomLeft ? 16 : null,
              right: _originalPosition == VideoPosition.topRight || _originalPosition == VideoPosition.bottomRight ? 16 : null,
              child: Container(
                width: 60 * _originalVideoSize,
                height: 80 * _originalVideoSize,
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.white, width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.video_library, color: Colors.white54, size: 16),
                ),
              ),
            ),
          ],
        );
        
      case ReactionLayout.overlay:
        return Stack(
          children: [
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[800]!.withOpacity(_originalVideoOpacity),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.video_library, color: Colors.white54, size: 32),
                    SizedBox(height: 4),
                    Text('Original', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ],
                ),
              ),
            ),
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF00CED1).withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF00CED1)),
              ),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.person, color: Color(0xFF00CED1), size: 32),
                    SizedBox(height: 4),
                    Text('You', style: TextStyle(color: Color(0xFF00CED1), fontSize: 12)),
                  ],
                ),
              ),
            ),
          ],
        );
        
      case ReactionLayout.splitScreen:
        return Row(
          children: [
            Expanded(
              flex: 2,
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF00CED1).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF00CED1)),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.person, color: Color(0xFF00CED1), size: 24),
                      SizedBox(height: 4),
                      Text('You', style: TextStyle(color: Color(0xFF00CED1), fontSize: 10)),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(
              flex: 1,
              child: Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Center(
                  child: Icon(Icons.video_library, color: Colors.white54, size: 20),
                ),
              ),
            ),
          ],
        );
    }
  }
  
  Widget _buildLayoutOption(ReactionLayout layout) {
    final isSelected = _selectedLayout == layout;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedLayout = layout;
        });
        HapticFeedback.lightImpact();
      },
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 8),
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
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getLayoutIcon(layout),
              color: isSelected 
                  ? const Color(0xFF00CED1)
                  : Colors.white54,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              _getLayoutName(layout),
              style: TextStyle(
                color: isSelected 
                    ? const Color(0xFF00CED1)
                    : Colors.white54,
                fontSize: 10,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPositionOption(VideoPosition position) {
    final isSelected = _originalPosition == position;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _originalPosition = position;
        });
      },
      child: Container(
        decoration: BoxDecoration(
          color: isSelected 
              ? const Color(0xFF00CED1).withOpacity(0.2)
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected 
                ? const Color(0xFF00CED1)
                : Colors.transparent,
          ),
        ),
        child: Center(
          child: Text(
            _getPositionName(position),
            style: TextStyle(
              color: isSelected 
                  ? const Color(0xFF00CED1)
                  : Colors.white,
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
  
  IconData _getLayoutIcon(ReactionLayout layout) {
    switch (layout) {
      case ReactionLayout.sideBySide:
        return Icons.view_column;
      case ReactionLayout.topBottom:
        return Icons.view_stream;
      case ReactionLayout.pictureInPicture:
        return Icons.picture_in_picture;
      case ReactionLayout.overlay:
        return Icons.layers;
      case ReactionLayout.splitScreen:
        return Icons.vertical_split;
    }
  }
  
  String _getLayoutName(ReactionLayout layout) {
    switch (layout) {
      case ReactionLayout.sideBySide:
        return 'Side by Side';
      case ReactionLayout.topBottom:
        return 'Top/Bottom';
      case ReactionLayout.pictureInPicture:
        return 'Picture in Picture';
      case ReactionLayout.overlay:
        return 'Overlay';
      case ReactionLayout.splitScreen:
        return 'Split Screen';
    }
  }
  
  String _getPositionName(VideoPosition position) {
    switch (position) {
      case VideoPosition.topLeft:
        return 'Top Left';
      case VideoPosition.topRight:
        return 'Top Right';
      case VideoPosition.bottomLeft:
        return 'Bottom Left';
      case VideoPosition.bottomRight:
        return 'Bottom Right';
    }
  }
  
  void _applyReactionSettings() {
    final creationState = context.read<CreationStateProvider>();
    
    creationState.addEffect(
      VideoEffect(
        type: 'reaction',
        parameters: {
          'originalVideoId': widget.originalVideoId,
          'originalVideoUrl': widget.originalVideoUrl,
          'layout': _selectedLayout.toString(),
          'originalVolume': _originalVideoVolume,
          'originalOpacity': _originalVideoOpacity,
          'syncPlayback': _syncPlayback,
          'originalPosition': _originalPosition.toString(),
          'originalSize': _originalVideoSize,
        },
      ),
    );
    
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Reaction settings applied'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
}

enum ReactionLayout {
  sideBySide,
  topBottom,
  pictureInPicture,
  overlay,
  splitScreen,
}

enum VideoPosition {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  left,
  right,
}