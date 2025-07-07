import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math' as math;
import '../providers/creation_state_provider.dart';
import '../widgets/trim_preview_widget.dart';

// Data model for trim segments
class TrimSegment {
  final Duration start;
  final Duration end;
  
  TrimSegment({required this.start, required this.end});
}

class ToolsModule extends StatefulWidget {
  const ToolsModule({super.key});
  
  @override
  State<ToolsModule> createState() => _ToolsModuleState();
}

class _ToolsModuleState extends State<ToolsModule> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Trim state
  double _trimStart = 0.0;
  double _trimEnd = 100.0;
  final List<TrimSegment> _trimSegments = [];
  
  // Crop state
  double _cropTop = 0.0;
  double _cropBottom = 0.0;
  double _cropLeft = 0.0;
  double _cropRight = 0.0;
  double _rotation = 0.0;
  
  // Speed state
  double _clipSpeed = 1.0;
  bool _isReversed = false;
  
  // Volume state
  double _clipVolume = 1.0;
  bool _isMuted = false;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
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
            isScrollable: true,
            indicatorColor: const Color(0xFF00CED1),
            labelColor: const Color(0xFF00CED1),
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(icon: Icon(Icons.content_cut), text: 'Trim'),
              Tab(icon: Icon(Icons.crop), text: 'Crop'),
              Tab(icon: Icon(Icons.speed), text: 'Speed'),
              Tab(icon: Icon(Icons.volume_up), text: 'Volume'),
              Tab(icon: Icon(Icons.replay), text: 'Reverse'),
            ],
          ),
        ),
        
        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildTrimTab(creationState),
              _buildCropTab(creationState),
              _buildSpeedTab(creationState),
              _buildVolumeTab(creationState),
              _buildReverseTab(creationState),
            ],
          ),
        ),
      ],
    );
  }
  
  Widget _buildTrimTab(CreationStateProvider creationState) {
    final screenHeight = MediaQuery.of(context).size.height;
    final availableHeight = screenHeight - 200; // Minus tab bar and controls
    
    return Column(
      children: [
        // Video preview - now takes up most of the available space
        Expanded(
          flex: 3,
          child: Container(
            margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Stack(
              children: [
                // Video preview with aspect ratio preservation
                Center(
                  child: AspectRatio(
                    aspectRatio: 9 / 16, // TikTok video aspect ratio
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: TrimPreviewWidget(
                        videoPath: creationState.videoClips.isNotEmpty 
                            ? creationState.videoClips[creationState.currentClipIndex].path 
                            : null,
                        trimStart: _trimStart,
                        trimEnd: _trimEnd,
                      ),
                    ),
                  ),
                ),
                // Preview time indicator
                Positioned(
                  bottom: 16,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${_formatDuration(_trimStart)} - ${_formatDuration(_trimEnd)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        
        // Visual timeline with thumbnails
        Container(
          height: 100,
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: Stack(
            children: [
              // Timeline background with frame thumbnails
              ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Row(
                  children: List.generate(10, (index) => 
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.blue.withOpacity(0.2),
                              Colors.purple.withOpacity(0.2),
                            ],
                          ),
                          border: Border(
                            right: BorderSide(
                              color: Colors.white.withOpacity(0.1),
                              width: 1,
                            ),
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.3),
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              
              // Selected area overlay
              Positioned(
                left: (_trimStart / 100) * (MediaQuery.of(context).size.width - 32),
                right: ((100 - _trimEnd) / 100) * (MediaQuery.of(context).size.width - 32),
                top: 0,
                bottom: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF00CED1).withOpacity(0.2),
                    border: Border(
                      left: BorderSide(color: const Color(0xFF00CED1), width: 3),
                      right: BorderSide(color: const Color(0xFF00CED1), width: 3),
                    ),
                  ),
                ),
              ),
              
              // Start handle
              Positioned(
                left: (_trimStart / 100) * (MediaQuery.of(context).size.width - 32) - 12,
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) {
                    final RenderBox box = context.findRenderObject() as RenderBox;
                    final localPosition = box.globalToLocal(details.globalPosition);
                    final percentage = ((localPosition.dx - 16) / (box.size.width - 32) * 100)
                        .clamp(0.0, _trimEnd - 1);
                    setState(() {
                      _trimStart = percentage;
                    });
                  },
                  child: Container(
                    width: 24,
                    child: Center(
                      child: Container(
                        width: 24,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFF00CED1),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.drag_indicator,
                          color: Colors.black,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              
              // End handle
              Positioned(
                left: (_trimEnd / 100) * (MediaQuery.of(context).size.width - 32) - 12,
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) {
                    final RenderBox box = context.findRenderObject() as RenderBox;
                    final localPosition = box.globalToLocal(details.globalPosition);
                    final percentage = ((localPosition.dx - 16) / (box.size.width - 32) * 100)
                        .clamp(_trimStart + 1, 100.0);
                    setState(() {
                      _trimEnd = percentage;
                    });
                  },
                  child: Container(
                    width: 24,
                    child: Center(
                      child: Container(
                        width: 24,
                        height: 60,
                        decoration: BoxDecoration(
                          color: const Color(0xFF00CED1),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.drag_indicator,
                          color: Colors.black,
                          size: 16,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              
              // Segments
              ..._trimSegments.map((segment) => 
                Positioned(
                  left: (segment.start.inMilliseconds / 100) * (MediaQuery.of(context).size.width - 32),
                  right: ((100 - segment.end.inMilliseconds) / 100) * (MediaQuery.of(context).size.width - 32),
                  top: 0,
                  bottom: 0,
                  child: Container(
                    color: const Color(0xFF00CED1).withOpacity(0.3),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Trim controls - more compact
        Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Duration and controls row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Selected Duration',
                        style: TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                      Text(
                        _formatDuration(_trimEnd - _trimStart),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      // Split clip button
                      IconButton(
                        onPressed: () {
                          // Split at current position
                        },
                        icon: const Icon(Icons.content_cut),
                        color: const Color(0xFF00CED1),
                        tooltip: 'Split clip',
                      ),
                      const SizedBox(width: 8),
                      // Add segment button
                      ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _trimSegments.add(TrimSegment(
                              start: Duration(milliseconds: (_trimStart * 10).toInt()),
                              end: Duration(milliseconds: (_trimEnd * 10).toInt()),
                            ));
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Segment added'),
                              duration: Duration(seconds: 1),
                            ),
                          );
                        },
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Add'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00CED1),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Compact sliders
              Row(
                children: [
                  SizedBox(
                    width: 50,
                    child: Text(
                      _formatDuration(_trimStart),
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        trackHeight: 4,
                        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 8),
                        overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
                      ),
                      child: RangeSlider(
                        values: RangeValues(_trimStart, _trimEnd),
                        max: 100,
                        divisions: 100,
                        labels: RangeLabels(
                          _formatDuration(_trimStart),
                          _formatDuration(_trimEnd),
                        ),
                        activeColor: const Color(0xFF00CED1),
                        inactiveColor: Colors.white.withOpacity(0.2),
                        onChanged: (values) {
                          setState(() {
                            _trimStart = values.start;
                            _trimEnd = values.end;
                          });
                        },
                      ),
                    ),
                  ),
                  SizedBox(
                    width: 50,
                    child: Text(
                      _formatDuration(_trimEnd),
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        
        // Segments list - compact horizontal scroll
        if (_trimSegments.isNotEmpty)
          Container(
            height: 60,
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _trimSegments.length,
              itemBuilder: (context, index) {
                final segment = _trimSegments[index];
                return Container(
                  width: 120,
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00CED1).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF00CED1).withOpacity(0.5)),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Clip ${index + 1}',
                        style: const TextStyle(
                          color: Color(0xFF00CED1),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${segment.start.inSeconds}s - ${segment.end.inSeconds}s',
                        style: const TextStyle(color: Colors.white70, fontSize: 10),
                      ),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _trimSegments.removeAt(index);
                          });
                        },
                        child: const Icon(Icons.close, color: Colors.red, size: 16),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
  
  Widget _buildCropTab(CreationStateProvider creationState) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Crop preview
          Container(
            height: 300,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Stack(
              children: [
                // Video preview placeholder
                Center(
                  child: Transform.rotate(
                    angle: _rotation * (math.pi / 180),
                    child: Container(
                      width: 200,
                      height: 300,
                      margin: EdgeInsets.only(
                        top: _cropTop,
                        bottom: _cropBottom,
                        left: _cropLeft,
                        right: _cropRight,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        border: Border.all(color: const Color(0xFF00CED1), width: 2),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.videocam,
                          color: Colors.white54,
                          size: 50,
                        ),
                      ),
                    ),
                  ),
                ),
                
                // Crop guides
                Positioned.fill(
                  child: CustomPaint(
                    painter: CropGuidesPainter(),
                  ),
                ),
              ],
            ),
          ),
          
          // Rotation control
          _buildSliderControl(
            label: 'Rotation',
            icon: Icons.rotate_right,
            value: _rotation,
            min: -180,
            max: 180,
            onChanged: (value) {
              setState(() {
                _rotation = value;
              });
            },
          ),
          
          // Preset aspect ratios
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _buildAspectRatioChip('Original', null),
              _buildAspectRatioChip('1:1', 1.0),
              _buildAspectRatioChip('4:3', 4/3),
              _buildAspectRatioChip('16:9', 16/9),
              _buildAspectRatioChip('9:16', 9/16),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Manual crop controls
          _buildSliderControl(
            label: 'Top',
            icon: Icons.vertical_align_top,
            value: _cropTop,
            max: 100,
            onChanged: (value) {
              setState(() {
                _cropTop = value;
              });
            },
          ),
          
          _buildSliderControl(
            label: 'Bottom',
            icon: Icons.vertical_align_bottom,
            value: _cropBottom,
            max: 100,
            onChanged: (value) {
              setState(() {
                _cropBottom = value;
              });
            },
          ),
          
          _buildSliderControl(
            label: 'Left',
            icon: Icons.align_horizontal_left,
            value: _cropLeft,
            max: 100,
            onChanged: (value) {
              setState(() {
                _cropLeft = value;
              });
            },
          ),
          
          _buildSliderControl(
            label: 'Right',
            icon: Icons.align_horizontal_right,
            value: _cropRight,
            max: 100,
            onChanged: (value) {
              setState(() {
                _cropRight = value;
              });
            },
          ),
        ],
      ),
    );
  }
  
  Widget _buildSpeedTab(CreationStateProvider creationState) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Speed visualization
          Container(
            height: 150,
            margin: const EdgeInsets.only(bottom: 30),
            child: CustomPaint(
              painter: SpeedCurvePainter(speed: _clipSpeed),
              child: Container(),
            ),
          ),
          
          // Speed slider
          Column(
            children: [
              Text(
                '${_clipSpeed}x',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 48,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Slider(
                value: _clipSpeed,
                min: 0.1,
                max: 3.0,
                divisions: 29,
                activeColor: const Color(0xFF00CED1),
                inactiveColor: Colors.white.withOpacity(0.2),
                onChanged: (value) {
                  setState(() {
                    _clipSpeed = value;
                  });
                  
                  // Update clip speed
                  if (creationState.videoClips.isNotEmpty) {
                    creationState.videoClips[creationState.currentClipIndex].speed = value;
                    creationState.notifyListeners();
                  }
                },
              ),
            ],
          ),
          
          const SizedBox(height: 30),
          
          // Speed presets
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [0.1, 0.3, 0.5, 1.0, 1.5, 2.0, 3.0].map((speed) => 
              ChoiceChip(
                label: Text('${speed}x'),
                selected: _clipSpeed == speed,
                onSelected: (selected) {
                  if (selected) {
                    setState(() {
                      _clipSpeed = speed;
                    });
                    
                    if (creationState.videoClips.isNotEmpty) {
                      creationState.videoClips[creationState.currentClipIndex].speed = speed;
                      creationState.notifyListeners();
                    }
                  }
                },
                backgroundColor: Colors.white.withOpacity(0.1),
                selectedColor: const Color(0xFF00CED1),
                labelStyle: TextStyle(
                  color: _clipSpeed == speed ? Colors.black : Colors.white,
                ),
              ),
            ).toList(),
          ),
          
          const SizedBox(height: 30),
          
          // Speed ramping option
          CheckboxListTile(
            title: const Text(
              'Smooth Speed Transitions',
              style: TextStyle(color: Colors.white),
            ),
            subtitle: const Text(
              'Gradually change speed between segments',
              style: TextStyle(color: Colors.white54, fontSize: 12),
            ),
            value: false,
            onChanged: (value) {
              // Enable speed ramping
            },
            activeColor: const Color(0xFF00CED1),
            checkColor: Colors.black,
          ),
        ],
      ),
    );
  }
  
  Widget _buildVolumeTab(CreationStateProvider creationState) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Volume visualization
          Container(
            height: 100,
            margin: const EdgeInsets.only(bottom: 30),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Icon(
                _isMuted ? Icons.volume_off : Icons.volume_up,
                color: _isMuted ? Colors.red : const Color(0xFF00CED1),
                size: 50,
              ),
            ),
          ),
          
          // Volume control
          Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Clip Volume',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                  Text(
                    '${(_clipVolume * 100).toInt()}%',
                    style: const TextStyle(color: Colors.white54),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Slider(
                value: _clipVolume,
                activeColor: const Color(0xFF00CED1),
                inactiveColor: Colors.white.withOpacity(0.2),
                onChanged: _isMuted ? null : (value) {
                  setState(() {
                    _clipVolume = value;
                  });
                },
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Mute toggle
          SwitchListTile(
            title: const Text(
              'Mute Clip',
              style: TextStyle(color: Colors.white),
            ),
            subtitle: const Text(
              'Remove all audio from this clip',
              style: TextStyle(color: Colors.white54, fontSize: 12),
            ),
            value: _isMuted,
            onChanged: (value) {
              setState(() {
                _isMuted = value;
              });
            },
            activeColor: const Color(0xFF00CED1),
          ),
          
          const SizedBox(height: 30),
          
          // Audio effects
          const Text(
            'Audio Effects',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _buildEffectChip('Fade In', false),
              _buildEffectChip('Fade Out', false),
              _buildEffectChip('Echo', false),
              _buildEffectChip('Bass Boost', false),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildReverseTab(CreationStateProvider creationState) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Reverse icon animation
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: _isReversed ? 1 : 0),
              duration: const Duration(milliseconds: 500),
              builder: (context, value, child) {
                return Transform.rotate(
                  angle: value * math.pi,
                  child: Icon(
                    Icons.replay,
                    color: _isReversed ? const Color(0xFF00CED1) : Colors.white,
                    size: 100,
                  ),
                );
              },
            ),
            
            const SizedBox(height: 30),
            
            Text(
              _isReversed ? 'Video is Reversed' : 'Normal Playback',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 10),
            
            Text(
              _isReversed 
                  ? 'Video will play backwards'
                  : 'Video will play normally',
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 16,
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Reverse toggle button
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _isReversed = !_isReversed;
                });
                
                // Update clip
                if (creationState.videoClips.isNotEmpty) {
                  creationState.videoClips[creationState.currentClipIndex].isReversed = _isReversed;
                  creationState.notifyListeners();
                }
              },
              icon: Icon(
                _isReversed ? Icons.undo : Icons.redo,
                color: Colors.black,
              ),
              label: Text(
                _isReversed ? 'Restore Normal' : 'Reverse Video',
                style: const TextStyle(color: Colors.black),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00CED1),
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              ),
            ),
            
            const SizedBox(height: 40),
            
            // Tips
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                children: const [
                  Row(
                    children: [
                      Icon(Icons.lightbulb, color: Color(0xFF00CED1), size: 20),
                      SizedBox(width: 10),
                      Text(
                        'Pro Tips',
                        style: TextStyle(
                          color: Color(0xFF00CED1),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 10),
                  Text(
                    '• Reverse works great with speed changes\n'
                    '• Try reversing only specific segments\n'
                    '• Combine with transitions for cool effects',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSliderControl({
    required String label,
    required IconData icon,
    required double value,
    double min = 0.0,
    double max = 100.0,
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
                value.toStringAsFixed(0),
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Slider(
            value: value,
            min: min,
            max: max,
            activeColor: const Color(0xFF00CED1),
            inactiveColor: Colors.white.withOpacity(0.2),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
  
  Widget _buildAspectRatioChip(String label, double? ratio) {
    return ChoiceChip(
      label: Text(label),
      selected: false,
      onSelected: (selected) {
        // Apply aspect ratio
      },
      backgroundColor: Colors.white.withOpacity(0.1),
      labelStyle: const TextStyle(color: Colors.white),
    );
  }
  
  Widget _buildEffectChip(String label, bool isSelected) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        // Toggle effect
      },
      backgroundColor: Colors.white.withOpacity(0.1),
      selectedColor: const Color(0xFF00CED1),
      labelStyle: TextStyle(
        color: isSelected ? Colors.black : Colors.white,
      ),
    );
  }
  
  String _formatDuration(double value) {
    final seconds = (value / 100 * 60).round(); // Assuming 60 second video
    return '${seconds}s';
  }
}

// Custom painters
class CropGuidesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.3)
      ..strokeWidth = 1;
    
    // Draw thirds
    final thirdWidth = size.width / 3;
    final thirdHeight = size.height / 3;
    
    for (int i = 1; i < 3; i++) {
      canvas.drawLine(
        Offset(thirdWidth * i, 0),
        Offset(thirdWidth * i, size.height),
        paint,
      );
      canvas.drawLine(
        Offset(0, thirdHeight * i),
        Offset(size.width, thirdHeight * i),
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class SpeedCurvePainter extends CustomPainter {
  final double speed;
  
  SpeedCurvePainter({required this.speed});
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF00CED1)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    
    final path = Path();
    
    // Draw speed curve
    for (double x = 0; x <= size.width; x += 5) {
      final normalizedX = x / size.width;
      final y = size.height * (1 - (normalizedX * speed).clamp(0, 1));
      
      if (x == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(covariant SpeedCurvePainter oldDelegate) => 
      oldDelegate.speed != speed;
}