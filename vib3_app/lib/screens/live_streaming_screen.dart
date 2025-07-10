import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/auth_provider.dart';

class LiveStreamingScreen extends StatefulWidget {
  const LiveStreamingScreen({super.key});
  
  @override
  State<LiveStreamingScreen> createState() => _LiveStreamingScreenState();
}

class _LiveStreamingScreenState extends State<LiveStreamingScreen> 
    with WidgetsBindingObserver {
  // Camera
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  bool _isInitialized = false;
  
  // Streaming state
  bool _isLive = false;
  bool _isPreparing = false;
  final TextEditingController _titleController = TextEditingController();
  String _selectedCategory = 'Just Chatting';
  
  // Stream stats
  int _viewerCount = 0;
  int _likeCount = 0;
  Duration _streamDuration = Duration.zero;
  Timer? _durationTimer;
  
  // Comments
  final List<LiveComment> _comments = [];
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _commentScrollController = ScrollController();
  
  // Stream settings
  StreamQuality _quality = StreamQuality.hd;
  bool _allowComments = true;
  bool _allowGifts = true;
  bool _notifyFollowers = true;
  
  // Categories
  final List<String> _categories = [
    'Just Chatting',
    'Gaming',
    'Music',
    'Dance',
    'Cooking',
    'Education',
    'Q&A',
    'Behind the Scenes',
    'Sports',
    'Fashion',
  ];
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
    
    // Simulate receiving comments and viewers
    if (_isLive) {
      _startSimulation();
    }
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _durationTimer?.cancel();
    _titleController.dispose();
    _commentController.dispose();
    _commentScrollController.dispose();
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted || _cameraController == null) return;
    
    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }
  
  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) return;
      
      // Prefer front camera for live streaming
      _selectedCameraIndex = _cameras.length > 1 ? 1 : 0;
      await _setupCameraController(_selectedCameraIndex);
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }
  
  Future<void> _setupCameraController(int cameraIndex) async {
    if (_cameras.isEmpty) return;
    
    final camera = _cameras[cameraIndex];
    _cameraController = CameraController(
      camera,
      ResolutionPreset.high,
      enableAudio: true,
    );
    
    try {
      await _cameraController!.initialize();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      print('Error setting up camera: $e');
    }
  }
  
  Future<void> _toggleCamera() async {
    if (_cameras.length < 2) return;
    
    setState(() {
      _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras.length;
    });
    
    await _setupCameraController(_selectedCameraIndex);
  }
  
  void _showPreStreamSetup() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
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
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Go Live',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title input
                    const Text(
                      'Title',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _titleController,
                      style: const TextStyle(color: Colors.white),
                      maxLength: 100,
                      decoration: InputDecoration(
                        hintText: 'What are you streaming about?',
                        hintStyle: const TextStyle(color: Colors.white54),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.1),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        counterStyle: const TextStyle(color: Colors.white54),
                      ),
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Category
                    const Text(
                      'Category',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: DropdownButton<String>(
                        value: _selectedCategory,
                        isExpanded: true,
                        dropdownColor: const Color(0xFF2A2A2A),
                        style: const TextStyle(color: Colors.white),
                        underline: const SizedBox(),
                        onChanged: (value) {
                          setState(() {
                            _selectedCategory = value!;
                          });
                        },
                        items: _categories.map((category) {
                          return DropdownMenuItem(
                            value: category,
                            child: Text(category),
                          );
                        }).toList(),
                      ),
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Stream quality
                    const Text(
                      'Stream Quality',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildQualityOption(StreamQuality.sd, 'SD'),
                        const SizedBox(width: 12),
                        _buildQualityOption(StreamQuality.hd, 'HD'),
                        const SizedBox(width: 12),
                        _buildQualityOption(StreamQuality.fullHd, 'Full HD'),
                      ],
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Settings
                    const Text(
                      'Settings',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    _buildSettingSwitch(
                      'Allow Comments',
                      _allowComments,
                      (value) => setState(() => _allowComments = value),
                    ),
                    _buildSettingSwitch(
                      'Allow Gifts',
                      _allowGifts,
                      (value) => setState(() => _allowGifts = value),
                    ),
                    _buildSettingSwitch(
                      'Notify Followers',
                      _notifyFollowers,
                      (value) => setState(() => _notifyFollowers = value),
                    ),
                    
                    const SizedBox(height: 30),
                    
                    // Start button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _titleController.text.isNotEmpty
                            ? () {
                                Navigator.pop(context);
                                _startLiveStream();
                              }
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00CED1),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                          disabledBackgroundColor: Colors.grey[800],
                        ),
                        child: const Text(
                          'Start Live Stream',
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
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildQualityOption(StreamQuality quality, String label) {
    final isSelected = _quality == quality;
    
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _quality = quality),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
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
              label,
              style: TextStyle(
                color: isSelected 
                    ? const Color(0xFF00CED1)
                    : Colors.white70,
                fontWeight: isSelected 
                    ? FontWeight.bold 
                    : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildSettingSwitch(
    String title,
    bool value,
    Function(bool) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: const Color(0xFF00CED1),
          ),
        ],
      ),
    );
  }
  
  void _startLiveStream() {
    setState(() {
      _isPreparing = true;
    });
    
    // Simulate preparing stream
    Future.delayed(const Duration(seconds: 2), () {
      setState(() {
        _isPreparing = false;
        _isLive = true;
        _streamDuration = Duration.zero;
      });
      
      // Start duration timer
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _streamDuration = _streamDuration + const Duration(seconds: 1);
        });
      });
      
      // Start simulation
      _startSimulation();
      
      // Show live notification
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('You are now LIVE! 🔴'),
          backgroundColor: Colors.red,
        ),
      );
    });
  }
  
  void _endLiveStream() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'End Live Stream?',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'You streamed for ${_formatDuration(_streamDuration)} to $_viewerCount viewers',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Continue',
              style: TextStyle(color: Colors.white54),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _stopLiveStream();
            },
            child: const Text(
              'End Stream',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }
  
  void _stopLiveStream() {
    setState(() {
      _isLive = false;
    });
    
    _durationTimer?.cancel();
    
    // Show summary
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Stream Summary',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildSummaryItem(
                  Icons.timer,
                  _formatDuration(_streamDuration),
                  'Duration',
                ),
                _buildSummaryItem(
                  Icons.visibility,
                  _viewerCount.toString(),
                  'Peak Viewers',
                ),
                _buildSummaryItem(
                  Icons.favorite,
                  _likeCount.toString(),
                  'Likes',
                ),
              ],
            ),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00CED1),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  'Done',
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
  
  Widget _buildSummaryItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF00CED1), size: 30),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white54,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
  
  void _startSimulation() {
    // Simulate viewers joining
    Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!_isLive) {
        timer.cancel();
        return;
      }
      
      setState(() {
        _viewerCount += DateTime.now().millisecond % 5 + 1;
      });
    });
    
    // Simulate comments
    Timer.periodic(const Duration(seconds: 2), (timer) {
      if (!_isLive) {
        timer.cancel();
        return;
      }
      
      final comments = [
        'Hello!',
        'Great stream!',
        '🔥🔥🔥',
        'First time here',
        'Love your content',
        '❤️❤️❤️',
        'Can you shout me out?',
        'What camera do you use?',
        'Following!',
        '👏👏👏',
      ];
      
      setState(() {
        _comments.add(
          LiveComment(
            username: 'user${DateTime.now().millisecond}',
            message: comments[DateTime.now().millisecond % comments.length],
            timestamp: DateTime.now(),
          ),
        );
        
        // Auto scroll to bottom
        if (_commentScrollController.hasClients) {
          _commentScrollController.animateTo(
            _commentScrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    });
    
    // Simulate likes
    Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isLive) {
        timer.cancel();
        return;
      }
      
      if (DateTime.now().millisecond % 3 == 0) {
        setState(() {
          _likeCount += DateTime.now().millisecond % 10 + 1;
        });
      }
    });
  }
  
  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    
    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera preview
          if (_isInitialized && _cameraController != null)
            Positioned.fill(
              child: CameraPreview(_cameraController!),
            )
          else
            const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00CED1),
              ),
            ),
          
          // Preparing overlay
          if (_isPreparing)
            Positioned.fill(
              child: Container(
                color: Colors.black54,
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        color: Color(0xFF00CED1),
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Preparing your stream...',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          
          // Top bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top,
                left: 16,
                right: 16,
                bottom: 16,
              ),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.7),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Row(
                children: [
                  // Close button
                  IconButton(
                    onPressed: () {
                      if (_isLive) {
                        _endLiveStream();
                      } else {
                        Navigator.pop(context);
                      }
                    },
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                  
                  if (_isLive) ...[
                    // Live badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'LIVE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(width: 12),
                    
                    // Viewer count
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.visibility,
                            color: Colors.white,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _viewerCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const Spacer(),
                    
                    // Duration
                    Text(
                      _formatDuration(_streamDuration),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ] else ...[
                    const Spacer(),
                    // Title when not live
                    Text(
                      _titleController.text.isEmpty 
                          ? 'Live Stream' 
                          : _titleController.text,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                  ],
                  
                  // Settings/flip camera
                  IconButton(
                    onPressed: _toggleCamera,
                    icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
          
          // Comments overlay
          if (_isLive && _allowComments)
            Positioned(
              bottom: 80,
              left: 16,
              right: 100,
              height: 200,
              child: ListView.builder(
                controller: _commentScrollController,
                itemCount: _comments.length,
                itemBuilder: (context, index) {
                  final comment = _comments[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 4),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '@${comment.username}',
                          style: const TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            comment.message,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          
          // Bottom controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.7),
                    Colors.transparent,
                  ],
                ),
              ),
              child: _isLive
                  ? Row(
                      children: [
                        // Comment input
                        if (_allowComments)
                          Expanded(
                            child: Container(
                              height: 40,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.chat_bubble_outline,
                                    color: Colors.white54,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Say something...',
                                    style: TextStyle(
                                      color: Colors.white54,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        
                        const SizedBox(width: 12),
                        
                        // Like button
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _likeCount++;
                            });
                            HapticFeedback.lightImpact();
                          },
                          child: Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.favorite,
                              color: Colors.red,
                              size: 28,
                            ),
                          ),
                        ),
                      ],
                    )
                  : Center(
                      child: GestureDetector(
                        onTap: _showPreStreamSetup,
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              colors: [
                                Color(0xFFFF0080),
                                Color(0xFF00CED1),
                              ],
                            ),
                          ),
                          child: const Icon(
                            Icons.videocam,
                            color: Colors.white,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

enum StreamQuality { sd, hd, fullHd }

class LiveComment {
  final String username;
  final String message;
  final DateTime timestamp;
  
  LiveComment({
    required this.username,
    required this.message,
    required this.timestamp,
  });
}