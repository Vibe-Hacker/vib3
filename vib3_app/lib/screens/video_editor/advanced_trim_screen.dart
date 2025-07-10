import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

class AdvancedTrimScreen extends StatefulWidget {
  final String videoPath;
  final Duration videoDuration;
  
  const AdvancedTrimScreen({
    super.key,
    required this.videoPath,
    required this.videoDuration,
  });
  
  @override
  State<AdvancedTrimScreen> createState() => _AdvancedTrimScreenState();
}

class _AdvancedTrimScreenState extends State<AdvancedTrimScreen> {
  late VideoPlayerController _videoController;
  
  // Trim points
  Duration _startTrim = Duration.zero;
  Duration _endTrim = Duration.zero;
  Duration _currentPosition = Duration.zero;
  
  // Frame navigation
  final int _fps = 30; // Frames per second
  int _currentFrame = 0;
  int _totalFrames = 0;
  
  // Playback
  bool _isPlaying = false;
  double _playbackSpeed = 1.0;
  
  // UI state
  bool _isLoading = true;
  bool _showFrameTimeline = true;
  bool _isDraggingStart = false;
  bool _isDraggingEnd = false;
  bool _isDraggingPlayhead = false;
  
  // Waveform data (simulated)
  final List<double> _waveformData = List.generate(100, (i) => 0.3 + (i % 10) * 0.07);
  
  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }
  
  Future<void> _initializeVideo() async {
    _videoController = VideoPlayerController.network(widget.videoPath);
    await _videoController.initialize();
    
    setState(() {
      _endTrim = widget.videoDuration;
      _totalFrames = (widget.videoDuration.inMilliseconds * _fps / 1000).round();
      _isLoading = false;
    });
    
    _videoController.addListener(_videoListener);
  }
  
  void _videoListener() {
    if (_videoController.value.isInitialized) {
      setState(() {
        _currentPosition = _videoController.value.position;
        _currentFrame = (_currentPosition.inMilliseconds * _fps / 1000).round();
      });
      
      // Loop within trim range
      if (_isPlaying && _currentPosition >= _endTrim) {
        _videoController.seekTo(_startTrim);
      }
    }
  }
  
  @override
  void dispose() {
    _videoController.removeListener(_videoListener);
    _videoController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Advanced Trim',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          TextButton(
            onPressed: _saveTrim,
            child: const Text(
              'Save',
              style: TextStyle(
                color: Color(0xFF00CED1),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            )
          : Column(
              children: [
                // Video preview
                AspectRatio(
                  aspectRatio: _videoController.value.aspectRatio,
                  child: Stack(
                    children: [
                      VideoPlayer(_videoController),
                      
                      // Overlay controls
                      Positioned(
                        bottom: 8,
                        left: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _formatDuration(_currentPosition),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                              Text(
                                'Frame ${_currentFrame}/$_totalFrames',
                                style: const TextStyle(
                                  color: Color(0xFF00CED1),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                _formatDuration(widget.videoDuration),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Frame controls
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Previous frame
                      IconButton(
                        onPressed: _previousFrame,
                        icon: const Icon(Icons.skip_previous),
                        color: Colors.white,
                      ),
                      
                      // Play/Pause
                      IconButton(
                        onPressed: _togglePlayback,
                        icon: Icon(
                          _isPlaying ? Icons.pause : Icons.play_arrow,
                          size: 32,
                        ),
                        color: const Color(0xFF00CED1),
                      ),
                      
                      // Next frame
                      IconButton(
                        onPressed: _nextFrame,
                        icon: const Icon(Icons.skip_next),
                        color: Colors.white,
                      ),
                      
                      const SizedBox(width: 16),
                      
                      // Speed control
                      PopupMenuButton<double>(
                        initialValue: _playbackSpeed,
                        onSelected: (speed) {
                          setState(() {
                            _playbackSpeed = speed;
                          });
                          _videoController.setPlaybackSpeed(speed);
                        },
                        itemBuilder: (context) => [
                          const PopupMenuItem(value: 0.25, child: Text('0.25x')),
                          const PopupMenuItem(value: 0.5, child: Text('0.5x')),
                          const PopupMenuItem(value: 1.0, child: Text('1x')),
                          const PopupMenuItem(value: 2.0, child: Text('2x')),
                        ],
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.white30),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.speed,
                                color: Colors.white54,
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${_playbackSpeed}x',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Timeline
                Expanded(
                  child: Container(
                    color: const Color(0xFF1A1A1A),
                    child: Column(
                      children: [
                        // Timeline controls
                        Container(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              // Timeline view toggle
                              IconButton(
                                onPressed: () {
                                  setState(() {
                                    _showFrameTimeline = !_showFrameTimeline;
                                  });
                                },
                                icon: Icon(
                                  _showFrameTimeline 
                                      ? Icons.view_timeline 
                                      : Icons.graphic_eq,
                                ),
                                color: const Color(0xFF00CED1),
                              ),
                              
                              const Spacer(),
                              
                              // Trim info
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'Trim: ${_formatDuration(_endTrim - _startTrim)}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        // Timeline view
                        Expanded(
                          child: _showFrameTimeline 
                              ? _buildFrameTimeline()
                              : _buildWaveformTimeline(),
                        ),
                        
                        // Trim controls
                        Container(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              // Trim range slider
                              _buildTrimSlider(),
                              
                              const SizedBox(height: 16),
                              
                              // Trim point inputs
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildTrimInput(
                                      label: 'Start',
                                      value: _startTrim,
                                      onChanged: (duration) {
                                        setState(() {
                                          _startTrim = duration;
                                        });
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: _buildTrimInput(
                                      label: 'End',
                                      value: _endTrim,
                                      onChanged: (duration) {
                                        setState(() {
                                          _endTrim = duration;
                                        });
                                      },
                                    ),
                                  ),
                                ],
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
  
  Widget _buildFrameTimeline() {
    return GestureDetector(
      onHorizontalDragStart: (details) {
        final position = details.localPosition.dx / context.size!.width;
        final duration = Duration(
          milliseconds: (widget.videoDuration.inMilliseconds * position).round(),
        );
        
        // Determine what's being dragged
        final startPos = _startTrim.inMilliseconds / widget.videoDuration.inMilliseconds;
        final endPos = _endTrim.inMilliseconds / widget.videoDuration.inMilliseconds;
        final currentPos = _currentPosition.inMilliseconds / widget.videoDuration.inMilliseconds;
        
        if ((position - startPos).abs() < 0.02) {
          _isDraggingStart = true;
        } else if ((position - endPos).abs() < 0.02) {
          _isDraggingEnd = true;
        } else if ((position - currentPos).abs() < 0.02) {
          _isDraggingPlayhead = true;
        }
      },
      onHorizontalDragUpdate: (details) {
        final position = details.localPosition.dx / context.size!.width;
        final duration = Duration(
          milliseconds: (widget.videoDuration.inMilliseconds * position).round(),
        );
        
        setState(() {
          if (_isDraggingStart) {
            _startTrim = duration.clamp(Duration.zero, _endTrim - const Duration(seconds: 1));
          } else if (_isDraggingEnd) {
            _endTrim = duration.clamp(_startTrim + const Duration(seconds: 1), widget.videoDuration);
          } else if (_isDraggingPlayhead) {
            _videoController.seekTo(duration);
          }
        });
      },
      onHorizontalDragEnd: (_) {
        _isDraggingStart = false;
        _isDraggingEnd = false;
        _isDraggingPlayhead = false;
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        child: CustomPaint(
          size: Size.infinite,
          painter: FrameTimelinePainter(
            videoDuration: widget.videoDuration,
            startTrim: _startTrim,
            endTrim: _endTrim,
            currentPosition: _currentPosition,
            fps: _fps,
          ),
        ),
      ),
    );
  }
  
  Widget _buildWaveformTimeline() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: CustomPaint(
        size: Size.infinite,
        painter: WaveformPainter(
          waveformData: _waveformData,
          startTrim: _startTrim,
          endTrim: _endTrim,
          currentPosition: _currentPosition,
          totalDuration: widget.videoDuration,
        ),
      ),
    );
  }
  
  Widget _buildTrimSlider() {
    return Column(
      children: [
        Stack(
          children: [
            // Background track
            Container(
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            
            // Selected range
            Positioned.fill(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth;
                  final startPos = _startTrim.inMilliseconds / widget.videoDuration.inMilliseconds;
                  final endPos = _endTrim.inMilliseconds / widget.videoDuration.inMilliseconds;
                  
                  return Stack(
                    children: [
                      Positioned(
                        left: width * startPos,
                        width: width * (endPos - startPos),
                        top: 0,
                        bottom: 0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF00CED1).withOpacity(0.3),
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
            
            // Range slider
            RangeSlider(
              values: RangeValues(
                _startTrim.inMilliseconds.toDouble(),
                _endTrim.inMilliseconds.toDouble(),
              ),
              min: 0,
              max: widget.videoDuration.inMilliseconds.toDouble(),
              onChanged: (values) {
                setState(() {
                  _startTrim = Duration(milliseconds: values.start.round());
                  _endTrim = Duration(milliseconds: values.end.round());
                });
              },
              activeColor: const Color(0xFF00CED1),
              inactiveColor: Colors.transparent,
            ),
          ],
        ),
      ],
    );
  }
  
  Widget _buildTrimInput({
    required String label,
    required Duration value,
    required Function(Duration) onChanged,
  }) {
    final controller = TextEditingController(
      text: _formatDurationPrecise(value),
    );
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white.withOpacity(0.1),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
            suffixIcon: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                InkWell(
                  onTap: () {
                    final newValue = value + const Duration(milliseconds: 33); // 1 frame at 30fps
                    onChanged(newValue.clamp(Duration.zero, widget.videoDuration));
                  },
                  child: const Icon(Icons.arrow_drop_up, size: 16, color: Colors.white54),
                ),
                InkWell(
                  onTap: () {
                    final newValue = value - const Duration(milliseconds: 33); // 1 frame at 30fps
                    onChanged(newValue.clamp(Duration.zero, widget.videoDuration));
                  },
                  child: const Icon(Icons.arrow_drop_down, size: 16, color: Colors.white54),
                ),
              ],
            ),
          ),
          onSubmitted: (text) {
            // Parse and update duration
            final parts = text.split(':');
            if (parts.length == 3) {
              final minutes = int.tryParse(parts[0]) ?? 0;
              final seconds = int.tryParse(parts[1]) ?? 0;
              final frames = int.tryParse(parts[2]) ?? 0;
              
              final duration = Duration(
                minutes: minutes,
                seconds: seconds,
                milliseconds: (frames * 1000 / _fps).round(),
              );
              
              onChanged(duration.clamp(Duration.zero, widget.videoDuration));
            }
          },
        ),
      ],
    );
  }
  
  void _togglePlayback() {
    setState(() {
      _isPlaying = !_isPlaying;
    });
    
    if (_isPlaying) {
      // Ensure we start within trim range
      if (_currentPosition < _startTrim || _currentPosition >= _endTrim) {
        _videoController.seekTo(_startTrim);
      }
      _videoController.play();
    } else {
      _videoController.pause();
    }
  }
  
  void _previousFrame() {
    final newPosition = _currentPosition - Duration(milliseconds: (1000 / _fps).round());
    _videoController.seekTo(newPosition.clamp(_startTrim, _endTrim));
  }
  
  void _nextFrame() {
    final newPosition = _currentPosition + Duration(milliseconds: (1000 / _fps).round());
    _videoController.seekTo(newPosition.clamp(_startTrim, _endTrim));
  }
  
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
  
  String _formatDurationPrecise(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = (duration.inSeconds % 60).toString().padLeft(2, '0');
    final frames = ((duration.inMilliseconds % 1000) * _fps / 1000).round().toString().padLeft(2, '0');
    return '$minutes:$seconds:$frames';
  }
  
  void _saveTrim() {
    Navigator.pop(context, {
      'startTrim': _startTrim,
      'endTrim': _endTrim,
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Trim saved'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
}

// Custom painters
class FrameTimelinePainter extends CustomPainter {
  final Duration videoDuration;
  final Duration startTrim;
  final Duration endTrim;
  final Duration currentPosition;
  final int fps;
  
  FrameTimelinePainter({
    required this.videoDuration,
    required this.startTrim,
    required this.endTrim,
    required this.currentPosition,
    required this.fps,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    // Background
    final backgroundPaint = Paint()
      ..color = Colors.white.withOpacity(0.05);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(8),
      ),
      backgroundPaint,
    );
    
    // Frame markers
    final totalFrames = (videoDuration.inMilliseconds * fps / 1000).round();
    final frameWidth = size.width / totalFrames;
    final framePaint = Paint()
      ..color = Colors.white.withOpacity(0.2)
      ..strokeWidth = 1;
    
    // Draw every 10th frame
    for (int i = 0; i < totalFrames; i += 10) {
      final x = i * frameWidth;
      canvas.drawLine(
        Offset(x, size.height * 0.7),
        Offset(x, size.height),
        framePaint,
      );
    }
    
    // Selected range
    final startX = size.width * startTrim.inMilliseconds / videoDuration.inMilliseconds;
    final endX = size.width * endTrim.inMilliseconds / videoDuration.inMilliseconds;
    
    final selectedPaint = Paint()
      ..color = const Color(0xFF00CED1).withOpacity(0.3);
    canvas.drawRect(
      Rect.fromLTRB(startX, 0, endX, size.height),
      selectedPaint,
    );
    
    // Trim handles
    final handlePaint = Paint()
      ..color = const Color(0xFF00CED1)
      ..strokeWidth = 3;
    
    canvas.drawLine(
      Offset(startX, 0),
      Offset(startX, size.height),
      handlePaint,
    );
    canvas.drawLine(
      Offset(endX, 0),
      Offset(endX, size.height),
      handlePaint,
    );
    
    // Playhead
    final playheadX = size.width * currentPosition.inMilliseconds / videoDuration.inMilliseconds;
    final playheadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2;
    
    canvas.drawLine(
      Offset(playheadX, 0),
      Offset(playheadX, size.height),
      playheadPaint,
    );
    
    // Playhead triangle
    final trianglePath = Path()
      ..moveTo(playheadX - 6, 0)
      ..lineTo(playheadX + 6, 0)
      ..lineTo(playheadX, 10)
      ..close();
    
    canvas.drawPath(trianglePath, Paint()..color = Colors.white);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class WaveformPainter extends CustomPainter {
  final List<double> waveformData;
  final Duration startTrim;
  final Duration endTrim;
  final Duration currentPosition;
  final Duration totalDuration;
  
  WaveformPainter({
    required this.waveformData,
    required this.startTrim,
    required this.endTrim,
    required this.currentPosition,
    required this.totalDuration,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    // Background
    final backgroundPaint = Paint()
      ..color = Colors.white.withOpacity(0.05);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(8),
      ),
      backgroundPaint,
    );
    
    // Waveform
    final barWidth = size.width / waveformData.length;
    final waveformPaint = Paint()
      ..color = Colors.white.withOpacity(0.3);
    
    for (int i = 0; i < waveformData.length; i++) {
      final x = i * barWidth;
      final barHeight = waveformData[i] * size.height;
      final y = (size.height - barHeight) / 2;
      
      canvas.drawRect(
        Rect.fromLTWH(x + 1, y, barWidth - 2, barHeight),
        waveformPaint,
      );
    }
    
    // Selected range overlay
    final startX = size.width * startTrim.inMilliseconds / totalDuration.inMilliseconds;
    final endX = size.width * endTrim.inMilliseconds / totalDuration.inMilliseconds;
    
    final selectedPaint = Paint()
      ..color = const Color(0xFF00CED1).withOpacity(0.3);
    canvas.drawRect(
      Rect.fromLTRB(startX, 0, endX, size.height),
      selectedPaint,
    );
    
    // Trim handles
    final handlePaint = Paint()
      ..color = const Color(0xFF00CED1)
      ..strokeWidth = 3;
    
    canvas.drawLine(
      Offset(startX, 0),
      Offset(startX, size.height),
      handlePaint,
    );
    canvas.drawLine(
      Offset(endX, 0),
      Offset(endX, size.height),
      handlePaint,
    );
    
    // Playhead
    final playheadX = size.width * currentPosition.inMilliseconds / totalDuration.inMilliseconds;
    final playheadPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2;
    
    canvas.drawLine(
      Offset(playheadX, 0),
      Offset(playheadX, size.height),
      playheadPaint,
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}