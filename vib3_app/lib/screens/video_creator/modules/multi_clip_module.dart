import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class MultiClipModule extends StatefulWidget {
  const MultiClipModule({super.key});
  
  @override
  State<MultiClipModule> createState() => _MultiClipModuleState();
}

class _MultiClipModuleState extends State<MultiClipModule> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  
  final List<VideoClip> _clips = [];
  VideoClip? _selectedClip;
  int? _draggedClipIndex;
  
  // Transition presets
  final List<TransitionPreset> _transitions = [
    TransitionPreset(
      id: 'none',
      name: 'None',
      icon: Icons.block,
      duration: 0,
    ),
    TransitionPreset(
      id: 'fade',
      name: 'Fade',
      icon: Icons.gradient,
      duration: 500,
    ),
    TransitionPreset(
      id: 'slide_left',
      name: 'Slide Left',
      icon: Icons.arrow_back,
      duration: 300,
    ),
    TransitionPreset(
      id: 'slide_right',
      name: 'Slide Right',
      icon: Icons.arrow_forward,
      duration: 300,
    ),
    TransitionPreset(
      id: 'zoom_in',
      name: 'Zoom In',
      icon: Icons.zoom_in,
      duration: 400,
    ),
    TransitionPreset(
      id: 'zoom_out',
      name: 'Zoom Out',
      icon: Icons.zoom_out,
      duration: 400,
    ),
    TransitionPreset(
      id: 'spin',
      name: 'Spin',
      icon: Icons.rotate_right,
      duration: 500,
    ),
    TransitionPreset(
      id: 'dissolve',
      name: 'Dissolve',
      icon: Icons.blur_on,
      duration: 600,
    ),
    TransitionPreset(
      id: 'wipe',
      name: 'Wipe',
      icon: Icons.cleaning_services,
      duration: 400,
    ),
    TransitionPreset(
      id: 'glitch',
      name: 'Glitch',
      icon: Icons.broken_image,
      duration: 200,
    ),
  ];
  
  String _selectedTransitionId = 'fade';
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _loadExistingClips();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  void _loadExistingClips() {
    // Load clips from creation state
    final creationState = context.read<CreationStateProvider>();
    // Simulate loading clips
    setState(() {
      _clips.addAll([
        VideoClip(
          id: '1',
          path: 'clip1.mp4',
          duration: const Duration(seconds: 5),
          thumbnail: 'thumb1.jpg',
          startTime: 0,
          endTime: 5000,
          transition: 'fade',
        ),
        VideoClip(
          id: '2',
          path: 'clip2.mp4',
          duration: const Duration(seconds: 3),
          thumbnail: 'thumb2.jpg',
          startTime: 0,
          endTime: 3000,
          transition: 'slide_left',
        ),
      ]);
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
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
                  'Multi-Clip Editor',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      onPressed: _addNewClip,
                      icon: const Icon(
                        Icons.add_box,
                        color: Color(0xFF00CED1),
                      ),
                    ),
                    TextButton(
                      onPressed: _clips.isEmpty ? null : _applyChanges,
                      child: Text(
                        'Done',
                        style: TextStyle(
                          color: _clips.isEmpty 
                              ? Colors.white30 
                              : const Color(0xFF00CED1),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Timeline
          Container(
            height: 120,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: _clips.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.movie_creation_outlined,
                          color: Colors.white.withOpacity(0.3),
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Add clips to get started',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  )
                : ReorderableListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.all(8),
                    itemCount: _clips.length,
                    onReorder: _reorderClips,
                    itemBuilder: (context, index) {
                      final clip = _clips[index];
                      final isSelected = _selectedClip == clip;
                      
                      return GestureDetector(
                        key: ValueKey(clip.id),
                        onTap: () => _selectClip(clip),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 80,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
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
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(
                                        Icons.movie,
                                        color: Colors.white54,
                                        size: 24,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${clip.duration.inSeconds}s',
                                        style: const TextStyle(
                                          color: Colors.white54,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              
                              // Clip number
                              Positioned(
                                top: 4,
                                left: 4,
                                child: Container(
                                  width: 20,
                                  height: 20,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF00CED1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      '${index + 1}',
                                      style: const TextStyle(
                                        color: Colors.black,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              
                              // Delete button
                              if (isSelected)
                                Positioned(
                                  top: 4,
                                  right: 4,
                                  child: GestureDetector(
                                    onTap: () => _deleteClip(clip),
                                    child: Container(
                                      width: 20,
                                      height: 20,
                                      decoration: const BoxDecoration(
                                        color: Colors.red,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        color: Colors.white,
                                        size: 14,
                                      ),
                                    ),
                                  ),
                                ),
                              
                              // Transition indicator
                              if (index < _clips.length - 1 && clip.transition != 'none')
                                Positioned(
                                  bottom: 4,
                                  right: -4,
                                  child: Container(
                                    width: 16,
                                    height: 16,
                                    decoration: BoxDecoration(
                                      color: Colors.purple,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Icon(
                                      Icons.auto_awesome,
                                      color: Colors.white,
                                      size: 10,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          
          const SizedBox(height: 20),
          
          // Clip controls
          if (_selectedClip != null) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Clip Settings',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Trim controls
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Trim',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              '${_selectedClip!.startTime / 1000}s - ${_selectedClip!.endTime / 1000}s',
                              style: const TextStyle(
                                color: Color(0xFF00CED1),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Trim slider
                        RangeSlider(
                          values: RangeValues(
                            _selectedClip!.startTime.toDouble(),
                            _selectedClip!.endTime.toDouble(),
                          ),
                          min: 0,
                          max: _selectedClip!.duration.inMilliseconds.toDouble(),
                          onChanged: (values) {
                            setState(() {
                              _selectedClip!.startTime = values.start.toInt();
                              _selectedClip!.endTime = values.end.toInt();
                            });
                          },
                          activeColor: const Color(0xFF00CED1),
                          inactiveColor: Colors.white.withOpacity(0.2),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Speed control
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Speed',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        Row(
                          children: [
                            _buildSpeedButton('0.5x', 0.5),
                            _buildSpeedButton('1x', 1.0),
                            _buildSpeedButton('2x', 2.0),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
          ],
          
          // Transitions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Transitions',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
          
          // Transition grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.0,
              ),
              itemCount: _transitions.length,
              itemBuilder: (context, index) {
                final transition = _transitions[index];
                final isSelected = _selectedTransitionId == transition.id;
                
                return GestureDetector(
                  onTap: () => _selectTransition(transition),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
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
                          transition.icon,
                          color: isSelected 
                              ? const Color(0xFF00CED1)
                              : Colors.white54,
                          size: 24,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          transition.name,
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
              },
            ),
          ),
          
          // Preview button
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _clips.length >= 2 ? _previewVideo : null,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Preview'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00CED1),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  disabledBackgroundColor: Colors.grey[800],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSpeedButton(String label, double speed) {
    final isSelected = _selectedClip?.speed == speed;
    
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedClip?.speed = speed;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected 
                ? const Color(0xFF00CED1)
                : Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.black : Colors.white,
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
  
  void _selectClip(VideoClip clip) {
    setState(() {
      _selectedClip = clip;
    });
    HapticFeedback.lightImpact();
  }
  
  void _deleteClip(VideoClip clip) {
    setState(() {
      _clips.remove(clip);
      if (_selectedClip == clip) {
        _selectedClip = _clips.isNotEmpty ? _clips.first : null;
      }
    });
  }
  
  void _reorderClips(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) {
        newIndex -= 1;
      }
      final clip = _clips.removeAt(oldIndex);
      _clips.insert(newIndex, clip);
    });
  }
  
  void _addNewClip() {
    // Open media picker to add new clip
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Opening media picker...'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  void _selectTransition(TransitionPreset transition) {
    setState(() {
      _selectedTransitionId = transition.id;
      if (_selectedClip != null) {
        _selectedClip!.transition = transition.id;
      }
    });
    HapticFeedback.lightImpact();
  }
  
  void _previewVideo() {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Generating preview with transitions...'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  void _applyChanges() {
    final creationState = context.read<CreationStateProvider>();
    
    // Apply multi-clip configuration
    creationState.addEffect(
      VideoEffect(
        type: 'multi_clip',
        parameters: {
          'clips': _clips.map((clip) => {
            'id': clip.id,
            'path': clip.path,
            'startTime': clip.startTime,
            'endTime': clip.endTime,
            'transition': clip.transition,
            'speed': clip.speed,
          }).toList(),
        },
      ),
    );
    
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Applied ${_clips.length} clips with transitions'),
        backgroundColor: const Color(0xFF00CED1),
      ),
    );
  }
}

// Data models
class VideoClip {
  final String id;
  final String path;
  final Duration duration;
  final String thumbnail;
  int startTime; // milliseconds
  int endTime; // milliseconds
  String transition;
  double speed;
  
  VideoClip({
    required this.id,
    required this.path,
    required this.duration,
    required this.thumbnail,
    required this.startTime,
    required this.endTime,
    required this.transition,
    this.speed = 1.0,
  });
}

class TransitionPreset {
  final String id;
  final String name;
  final IconData icon;
  final int duration; // milliseconds
  
  TransitionPreset({
    required this.id,
    required this.name,
    required this.icon,
    required this.duration,
  });
}