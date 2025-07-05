import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;
import 'dart:io';
import 'dart:async';
import 'dart:typed_data';
import 'dart:math' as math;
import 'package:video_thumbnail/video_thumbnail.dart' as vt;
import 'upload_screen.dart';

// TikTok-style trim segment
class TrimSegment {
  final Duration start;
  final Duration end;
  final String id;
  
  TrimSegment({required this.start, required this.end, String? id}) 
    : id = id ?? DateTime.now().millisecondsSinceEpoch.toString();
  
  Duration get duration => end - start;
}

// Text overlay model
class TextOverlay {
  String text;
  Offset position;
  double fontSize;
  Color color;
  String fontFamily;
  TextAlign alignment;
  bool hasShadow;
  double rotation;
  String animation;
  
  TextOverlay({
    required this.text,
    required this.position,
    this.fontSize = 24,
    this.color = Colors.white,
    this.fontFamily = 'System',
    this.alignment = TextAlign.center,
    this.hasShadow = true,
    this.rotation = 0,
    this.animation = 'none',
  });
}

// Music track model
class MusicTrack {
  final String name;
  final String artist;
  final String url;
  final Duration duration;
  
  const MusicTrack({
    required this.name,
    required this.artist,
    required this.url,
    required this.duration,
  });
}

class VideoEditingScreen extends StatefulWidget {
  final String videoPath;

  const VideoEditingScreen({super.key, required this.videoPath});

  @override
  State<VideoEditingScreen> createState() => _VideoEditingScreenState();
}

class _VideoEditingScreenState extends State<VideoEditingScreen>
    with TickerProviderStateMixin {
  // Controllers
  VideoPlayerController? _controller;
  late AnimationController _playPauseAnimController;
  Timer? _progressTimer;
  
  // State
  bool _isInitialized = false;
  bool _isPlaying = false;
  bool _isDraggingTimeline = false;
  bool _isExporting = false;
  double _exportProgress = 0.0;
  
  // Video properties
  Duration _videoDuration = Duration.zero;
  Duration _currentPosition = Duration.zero;
  List<Uint8List> _timelineFrames = [];
  
  // Trimming
  Duration _trimStart = Duration.zero;
  Duration _trimEnd = Duration.zero;
  List<TrimSegment> _segments = [];
  TrimSegment? _currentSegment;
  
  // Effects
  String _selectedFilter = 'none';
  double _videoSpeed = 1.0;
  double _originalVolume = 1.0;
  double _musicVolume = 0.7;
  MusicTrack? _selectedMusic;
  List<TextOverlay> _textOverlays = [];
  TextOverlay? _currentTextOverlay;
  
  // UI
  int _selectedTab = 0;
  final List<_EditorTab> _tabs = [
    _EditorTab(icon: Icons.content_cut, label: 'Trim'),
    _EditorTab(icon: Icons.text_fields, label: 'Text'),
    _EditorTab(icon: Icons.music_note, label: 'Music'),
    _EditorTab(icon: Icons.filter_vintage, label: 'Filters'),
    _EditorTab(icon: Icons.speed, label: 'Speed'),
    _EditorTab(icon: Icons.volume_up, label: 'Volume'),
    _EditorTab(icon: Icons.auto_awesome, label: 'Effects'),
  ];
  
  // Sample music library
  final List<MusicTrack> _musicLibrary = [
    MusicTrack(name: 'Upbeat Pop', artist: 'VIB3 Music', url: '', duration: Duration(seconds: 30)),
    MusicTrack(name: 'Chill Vibes', artist: 'VIB3 Music', url: '', duration: Duration(seconds: 45)),
    MusicTrack(name: 'Epic Cinematic', artist: 'VIB3 Music', url: '', duration: Duration(seconds: 60)),
    MusicTrack(name: 'Dance Beat', artist: 'VIB3 Music', url: '', duration: Duration(seconds: 30)),
    MusicTrack(name: 'Acoustic Guitar', artist: 'VIB3 Music', url: '', duration: Duration(seconds: 40)),
  ];
  
  // Filters
  final List<_VideoFilter> _filters = [
    _VideoFilter(name: 'None', color: null),
    _VideoFilter(name: 'Vintage', color: Color(0x40F4A460)),
    _VideoFilter(name: 'Black & White', color: Color(0xFF000000)),
    _VideoFilter(name: 'Warm', color: Color(0x20FF8C00)),
    _VideoFilter(name: 'Cool', color: Color(0x20008CFF)),
    _VideoFilter(name: 'Dramatic', color: Color(0x40800080)),
    _VideoFilter(name: 'Vivid', color: Color(0x20FF0080)),
  ];

  @override
  void initState() {
    super.initState();
    _playPauseAnimController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 200),
    );
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    try {
      final file = File(widget.videoPath);
      if (!await file.exists()) {
        _showError('Video file not found');
        return;
      }

      _controller = VideoPlayerController.file(file);
      await _controller!.initialize();
      
      _videoDuration = _controller!.value.duration;
      _trimEnd = _videoDuration;
      
      // Generate timeline frames
      await _generateTimelineFrames();
      
      setState(() {
        _isInitialized = true;
      });
      
      // Start progress timer
      _startProgressTimer();
      
    } catch (e) {
      _showError('Failed to load video: $e');
    }
  }

  Future<void> _generateTimelineFrames() async {
    try {
      const frameCount = 10;
      _timelineFrames.clear();
      
      for (int i = 0; i < frameCount; i++) {
        final position = i * (_videoDuration.inMilliseconds ~/ frameCount);
        final frame = await vt.VideoThumbnail.thumbnailData(
          video: widget.videoPath,
          imageFormat: vt.ImageFormat.JPEG,
          maxHeight: 60,
          quality: 50,
          timeMs: position,
        );
        
        if (frame != null) {
          _timelineFrames.add(frame);
        }
      }
    } catch (e) {
      print('Error generating timeline frames: $e');
    }
  }

  void _startProgressTimer() {
    _progressTimer?.cancel();
    _progressTimer = Timer.periodic(Duration(milliseconds: 50), (timer) {
      if (_controller != null && _controller!.value.isPlaying && !_isDraggingTimeline) {
        setState(() {
          _currentPosition = _controller!.value.position;
          
          // Loop within trim range
          if (_currentPosition >= _trimEnd) {
            _controller!.seekTo(_trimStart);
            _currentPosition = _trimStart;
          }
        });
      }
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _togglePlayPause() {
    if (_controller == null) return;
    
    setState(() {
      if (_isPlaying) {
        _controller!.pause();
        _playPauseAnimController.reverse();
      } else {
        // Start from trim start if at the end
        if (_currentPosition >= _trimEnd) {
          _controller!.seekTo(_trimStart);
        }
        _controller!.play();
        _playPauseAnimController.forward();
      }
      _isPlaying = !_isPlaying;
    });
  }

  void _seekToPosition(double percentage) {
    if (_controller == null || !_isInitialized) return;
    
    final position = Duration(
      milliseconds: (_videoDuration.inMilliseconds * percentage).toInt()
    );
    
    setState(() {
      _currentPosition = position;
    });
    
    _controller!.seekTo(position);
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _exportVideo() async {
    setState(() {
      _isExporting = true;
      _exportProgress = 0.0;
    });

    // Simulate export with progress
    for (int i = 0; i <= 100; i += 5) {
      await Future.delayed(Duration(milliseconds: 100));
      setState(() {
        _exportProgress = i / 100;
      });
    }

    setState(() {
      _isExporting = false;
    });

    // Navigate to upload screen
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => const UploadScreen(),
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    _playPauseAnimController.dispose();
    _progressTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),
            
            // Video preview
            Expanded(
              child: Stack(
                children: [
                  // Video player
                  _buildVideoPreview(),
                  
                  // Text overlays
                  ..._textOverlays.map((overlay) => _buildTextOverlay(overlay)),
                  
                  // Filter overlay
                  if (_selectedFilter != 'none')
                    Positioned.fill(
                      child: Container(
                        color: _filters.firstWhere((f) => f.name == _selectedFilter).color,
                      ),
                    ),
                  
                  // Play/pause button
                  Center(
                    child: GestureDetector(
                      onTap: _togglePlayPause,
                      child: AnimatedOpacity(
                        opacity: _isPlaying ? 0.0 : 1.0,
                        duration: Duration(milliseconds: 200),
                        child: Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.black.withOpacity(0.5),
                          ),
                          child: Icon(
                            Icons.play_arrow,
                            color: Colors.white,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Timeline
            _buildTimeline(),
            
            // Tools
            _buildTools(),
            
            // Export progress
            if (_isExporting) _buildExportProgress(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      height: 56,
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          IconButton(
            icon: Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          Spacer(),
          if (_selectedMusic != null)
            Container(
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Icon(Icons.music_note, color: Colors.white, size: 16),
                  SizedBox(width: 4),
                  Text(
                    _selectedMusic!.name,
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
          SizedBox(width: 16),
          TextButton(
            onPressed: _isExporting ? null : _exportVideo,
            child: Text(
              'Next',
              style: TextStyle(
                color: Color(0xFF00CED1),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPreview() {
    if (!_isInitialized || _controller == null) {
      return Center(
        child: CircularProgressIndicator(
          color: Color(0xFF00CED1),
        ),
      );
    }

    return Center(
      child: AspectRatio(
        aspectRatio: _controller!.value.aspectRatio,
        child: VideoPlayer(_controller!),
      ),
    );
  }

  Widget _buildTextOverlay(TextOverlay overlay) {
    return Positioned(
      left: overlay.position.dx,
      top: overlay.position.dy,
      child: GestureDetector(
        onTap: () {
          setState(() {
            _currentTextOverlay = overlay;
            _selectedTab = 1; // Switch to text tab
          });
        },
        child: Transform.rotate(
          angle: overlay.rotation * (math.pi / 180),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.5),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              overlay.text,
              style: TextStyle(
                color: overlay.color,
                fontSize: overlay.fontSize,
                fontFamily: overlay.fontFamily,
                shadows: overlay.hasShadow
                    ? [Shadow(blurRadius: 3, color: Colors.black)]
                    : null,
              ),
              textAlign: overlay.alignment,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimeline() {
    return Container(
      height: 100,
      color: Colors.grey[900],
      child: Column(
        children: [
          // Time display
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatDuration(_currentPosition),
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
                Text(
                  _formatDuration(_videoDuration),
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          
          // Timeline scrubber
          Expanded(
            child: GestureDetector(
              onHorizontalDragStart: (_) {
                setState(() {
                  _isDraggingTimeline = true;
                });
              },
              onHorizontalDragEnd: (_) {
                setState(() {
                  _isDraggingTimeline = false;
                });
              },
              onHorizontalDragUpdate: (details) {
                final box = context.findRenderObject() as RenderBox;
                final localPosition = box.globalToLocal(details.globalPosition);
                final percentage = (localPosition.dx / box.size.width).clamp(0.0, 1.0);
                _seekToPosition(percentage);
              },
              onTapDown: (details) {
                final box = context.findRenderObject() as RenderBox;
                final localPosition = box.globalToLocal(details.globalPosition);
                final percentage = (localPosition.dx / box.size.width).clamp(0.0, 1.0);
                _seekToPosition(percentage);
              },
              child: Container(
                margin: EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(4),
                  color: Colors.grey[800],
                ),
                child: Stack(
                  children: [
                    // Frame thumbnails
                    if (_timelineFrames.isNotEmpty)
                      Row(
                        children: _timelineFrames
                            .map((frame) => Expanded(
                                  child: Image.memory(
                                    frame,
                                    fit: BoxFit.cover,
                                    gaplessPlayback: true,
                                  ),
                                ))
                            .toList(),
                      ),
                    
                    // Trim overlay
                    CustomPaint(
                      size: Size(double.infinity, double.infinity),
                      painter: _TrimPainter(
                        trimStart: _trimStart,
                        trimEnd: _trimEnd,
                        duration: _videoDuration,
                        segments: _segments,
                      ),
                    ),
                    
                    // Current position indicator
                    if (_videoDuration.inMilliseconds > 0)
                      Positioned(
                        left: (MediaQuery.of(context).size.width - 32) *
                            (_currentPosition.inMilliseconds / _videoDuration.inMilliseconds),
                        top: 0,
                        bottom: 0,
                        child: Container(
                          width: 2,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTools() {
    return Container(
      height: 200,
      color: Colors.grey[900],
      child: Column(
        children: [
          // Tab bar
          Container(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _tabs.length,
              itemBuilder: (context, index) {
                final tab = _tabs[index];
                final isSelected = _selectedTab == index;
                
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedTab = index;
                    });
                  },
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: 20),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          tab.icon,
                          color: isSelected ? Color(0xFF00CED1) : Colors.white54,
                          size: 20,
                        ),
                        SizedBox(height: 4),
                        Text(
                          tab.label,
                          style: TextStyle(
                            color: isSelected ? Color(0xFF00CED1) : Colors.white54,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Tab content
          Expanded(
            child: _buildTabContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_selectedTab) {
      case 0: // Trim
        return _buildTrimTools();
      case 1: // Text
        return _buildTextTools();
      case 2: // Music
        return _buildMusicTools();
      case 3: // Filters
        return _buildFilterTools();
      case 4: // Speed
        return _buildSpeedTools();
      case 5: // Volume
        return _buildVolumeTools();
      case 6: // Effects
        return _buildEffectsTools();
      default:
        return Container();
    }
  }

  Widget _buildTrimTools() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Trim: ${_formatDuration(_trimEnd - _trimStart)}',
                style: TextStyle(color: Colors.white),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    _segments.add(TrimSegment(start: _trimStart, end: _trimEnd));
                    _trimStart = _trimEnd;
                    _trimEnd = _videoDuration;
                  });
                },
                child: Text(
                  'Add Segment',
                  style: TextStyle(color: Color(0xFF00CED1)),
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          Row(
            children: [
              Text('Start:', style: TextStyle(color: Colors.white70)),
              Expanded(
                child: Slider(
                  value: _trimStart.inMilliseconds.toDouble(),
                  min: 0,
                  max: _videoDuration.inMilliseconds.toDouble(),
                  activeColor: Color(0xFF00CED1),
                  onChanged: (value) {
                    setState(() {
                      _trimStart = Duration(milliseconds: value.toInt());
                      if (_trimStart >= _trimEnd) {
                        _trimStart = _trimEnd - Duration(seconds: 1);
                      }
                    });
                  },
                ),
              ),
              Text(
                _formatDuration(_trimStart),
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          Row(
            children: [
              Text('End:', style: TextStyle(color: Colors.white70)),
              Expanded(
                child: Slider(
                  value: _trimEnd.inMilliseconds.toDouble(),
                  min: 0,
                  max: _videoDuration.inMilliseconds.toDouble(),
                  activeColor: Color(0xFF00CED1),
                  onChanged: (value) {
                    setState(() {
                      _trimEnd = Duration(milliseconds: value.toInt());
                      if (_trimEnd <= _trimStart) {
                        _trimEnd = _trimStart + Duration(seconds: 1);
                      }
                    });
                  },
                ),
              ),
              Text(
                _formatDuration(_trimEnd),
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextTools() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          ElevatedButton.icon(
            onPressed: () {
              final overlay = TextOverlay(
                text: 'Tap to edit',
                position: Offset(100, 200),
              );
              setState(() {
                _textOverlays.add(overlay);
                _currentTextOverlay = overlay;
              });
            },
            icon: Icon(Icons.add),
            label: Text('Add Text'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF00CED1),
            ),
          ),
          if (_currentTextOverlay != null) ...[
            SizedBox(height: 16),
            TextField(
              controller: TextEditingController(text: _currentTextOverlay!.text),
              style: TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Enter text',
                hintStyle: TextStyle(color: Colors.white54),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white54),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _currentTextOverlay!.text = value;
                });
              },
            ),
            SizedBox(height: 16),
            // Font size slider
            Row(
              children: [
                Icon(Icons.format_size, color: Colors.white54, size: 20),
                Expanded(
                  child: Slider(
                    value: _currentTextOverlay!.fontSize,
                    min: 12,
                    max: 48,
                    activeColor: Color(0xFF00CED1),
                    onChanged: (value) {
                      setState(() {
                        _currentTextOverlay!.fontSize = value;
                      });
                    },
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMusicTools() {
    return Container(
      child: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: _musicLibrary.length,
        itemBuilder: (context, index) {
          final track = _musicLibrary[index];
          final isSelected = _selectedMusic == track;
          
          return Container(
            margin: EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: isSelected ? Color(0xFF00CED1).withOpacity(0.2) : Colors.grey[800],
              borderRadius: BorderRadius.circular(8),
              border: isSelected ? Border.all(color: Color(0xFF00CED1)) : null,
            ),
            child: ListTile(
              leading: Icon(
                Icons.music_note,
                color: isSelected ? Color(0xFF00CED1) : Colors.white54,
              ),
              title: Text(
                track.name,
                style: TextStyle(color: Colors.white),
              ),
              subtitle: Text(
                '${track.artist} • ${_formatDuration(track.duration)}',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
              trailing: isSelected
                  ? Icon(Icons.check_circle, color: Color(0xFF00CED1))
                  : null,
              onTap: () {
                setState(() {
                  _selectedMusic = isSelected ? null : track;
                });
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildFilterTools() {
    return Container(
      child: GridView.builder(
        padding: EdgeInsets.all(16),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
        ),
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final isSelected = _selectedFilter == filter.name;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedFilter = filter.name;
              });
            },
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isSelected ? Color(0xFF00CED1) : Colors.grey[700]!,
                  width: 2,
                ),
              ),
              child: Stack(
                children: [
                  // Preview
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[800],
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  if (filter.color != null)
                    Container(
                      decoration: BoxDecoration(
                        color: filter.color,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  // Label
                  Center(
                    child: Text(
                      filter.name,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSpeedTools() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            'Speed: ${_videoSpeed.toStringAsFixed(1)}x',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
          SizedBox(height: 16),
          Slider(
            value: _videoSpeed,
            min: 0.3,
            max: 3.0,
            divisions: 27,
            activeColor: Color(0xFF00CED1),
            label: '${_videoSpeed.toStringAsFixed(1)}x',
            onChanged: (value) {
              setState(() {
                _videoSpeed = value;
                _controller?.setPlaybackSpeed(value);
              });
            },
          ),
          SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: [0.3, 0.5, 1.0, 1.5, 2.0, 3.0].map((speed) {
              return ElevatedButton(
                onPressed: () {
                  setState(() {
                    _videoSpeed = speed;
                    _controller?.setPlaybackSpeed(speed);
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _videoSpeed == speed ? Color(0xFF00CED1) : Colors.grey[800],
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
                child: Text('${speed}x'),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildVolumeTools() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          // Original sound volume
          Row(
            children: [
              Icon(Icons.videocam, color: Colors.white54),
              SizedBox(width: 8),
              Text('Original', style: TextStyle(color: Colors.white)),
              Expanded(
                child: Slider(
                  value: _originalVolume,
                  min: 0,
                  max: 1,
                  activeColor: Color(0xFF00CED1),
                  onChanged: (value) {
                    setState(() {
                      _originalVolume = value;
                      _controller?.setVolume(value);
                    });
                  },
                ),
              ),
              Text(
                '${(_originalVolume * 100).toInt()}%',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          SizedBox(height: 16),
          // Music volume
          Row(
            children: [
              Icon(Icons.music_note, color: Colors.white54),
              SizedBox(width: 8),
              Text('Music', style: TextStyle(color: Colors.white)),
              Expanded(
                child: Slider(
                  value: _musicVolume,
                  min: 0,
                  max: 1,
                  activeColor: Color(0xFF00CED1),
                  onChanged: _selectedMusic == null
                      ? null
                      : (value) {
                          setState(() {
                            _musicVolume = value;
                          });
                        },
                ),
              ),
              Text(
                '${(_musicVolume * 100).toInt()}%',
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEffectsTools() {
    return Container(
      padding: EdgeInsets.all(16),
      child: GridView.count(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        children: [
          _buildEffectButton('Fade In', Icons.gradient),
          _buildEffectButton('Fade Out', Icons.gradient),
          _buildEffectButton('Zoom', Icons.zoom_in),
          _buildEffectButton('Rotate', Icons.rotate_right),
          _buildEffectButton('Mirror', Icons.flip),
          _buildEffectButton('Shake', Icons.vibration),
        ],
      ),
    );
  }

  Widget _buildEffectButton(String label, IconData icon) {
    return GestureDetector(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('$label effect applied'),
            backgroundColor: Color(0xFF00CED1),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[800],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white54),
            SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(color: Colors.white54, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExportProgress() {
    return Container(
      color: Colors.black.withOpacity(0.8),
      child: Center(
        child: Container(
          padding: EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Exporting Video',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              SizedBox(
                width: 200,
                child: LinearProgressIndicator(
                  value: _exportProgress,
                  backgroundColor: Colors.grey[700],
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF00CED1)),
                ),
              ),
              SizedBox(height: 8),
              Text(
                '${(_exportProgress * 100).toInt()}%',
                style: TextStyle(color: Colors.white70),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Supporting classes
class _EditorTab {
  final IconData icon;
  final String label;
  
  const _EditorTab({required this.icon, required this.label});
}

class _VideoFilter {
  final String name;
  final Color? color;
  
  const _VideoFilter({required this.name, this.color});
}

class _TrimPainter extends CustomPainter {
  final Duration trimStart;
  final Duration trimEnd;
  final Duration duration;
  final List<TrimSegment> segments;
  
  _TrimPainter({
    required this.trimStart,
    required this.trimEnd,
    required this.duration,
    required this.segments,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    if (duration.inMilliseconds == 0) return;
    
    final paint = Paint();
    
    // Draw trim overlay
    paint.color = Colors.black.withOpacity(0.6);
    
    // Left trimmed area
    final startX = (trimStart.inMilliseconds / duration.inMilliseconds) * size.width;
    canvas.drawRect(
      Rect.fromLTWH(0, 0, startX, size.height),
      paint,
    );
    
    // Right trimmed area
    final endX = (trimEnd.inMilliseconds / duration.inMilliseconds) * size.width;
    canvas.drawRect(
      Rect.fromLTWH(endX, 0, size.width - endX, size.height),
      paint,
    );
    
    // Draw trim handles
    paint.color = Color(0xFF00CED1);
    paint.strokeWidth = 3;
    
    // Start handle
    canvas.drawLine(
      Offset(startX, 0),
      Offset(startX, size.height),
      paint,
    );
    
    // End handle
    canvas.drawLine(
      Offset(endX, 0),
      Offset(endX, size.height),
      paint,
    );
    
    // Draw segments
    paint.color = Color(0xFF00CED1).withOpacity(0.3);
    for (final segment in segments) {
      final segStartX = (segment.start.inMilliseconds / duration.inMilliseconds) * size.width;
      final segEndX = (segment.end.inMilliseconds / duration.inMilliseconds) * size.width;
      canvas.drawRect(
        Rect.fromLTWH(segStartX, 0, segEndX - segStartX, size.height),
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant _TrimPainter oldDelegate) {
    return trimStart != oldDelegate.trimStart ||
        trimEnd != oldDelegate.trimEnd ||
        duration != oldDelegate.duration ||
        segments != oldDelegate.segments;
  }
}