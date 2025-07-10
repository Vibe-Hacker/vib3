import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';
import '../video_creator_screen.dart';
import 'enhanced_video_preview.dart';

class WorkingVideoPreview extends StatefulWidget {
  final Function(CreatorMode) onModeChange;
  
  const WorkingVideoPreview({
    super.key,
    required this.onModeChange,
  });
  
  @override
  State<WorkingVideoPreview> createState() => _WorkingVideoPreviewState();
}

class _WorkingVideoPreviewState extends State<WorkingVideoPreview> {
  String? _videoPath;
  bool _isLoading = true;
  int _retryCount = 0;
  static const int _maxRetries = 10;
  
  @override
  void initState() {
    super.initState();
    // Start loading video path after frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Clear any focus to prevent window focus loops
      FocusManager.instance.primaryFocus?.unfocus();
      _loadVideoPath();
    });
  }
  
  void _loadVideoPath() {
    final provider = context.read<CreationStateProvider>();
    
    print('\n=== WorkingVideoPreview: Loading video path ===');
    print('Provider clips count: ${provider.videoClips.length}');
    print('Retry count: $_retryCount');
    
    if (provider.videoClips.isNotEmpty) {
      final path = provider.videoClips.first.path;
      print('Video path found: $path');
      
      setState(() {
        _videoPath = path;
        _isLoading = false;
      });
    } else if (_retryCount < _maxRetries) {
      // Retry after delay
      _retryCount++;
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          _loadVideoPath();
        }
      });
    } else {
      // Max retries reached
      print('Max retries reached, no video found');
      setState(() {
        _isLoading = false;
      });
    }
  }
  
  void _handleVideoError() {
    print('Video playback error, showing error state');
    // Could navigate back to camera or show error UI
  }
  
  @override
  Widget build(BuildContext context) {
    final creationState = context.watch<CreationStateProvider>();
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Video player or loading state
          if (_isLoading)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    color: Color(0xFF00CED1),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'Loading video...',
                    style: TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            )
          else if (_videoPath != null)
            EnhancedVideoPreview(
              videoPath: _videoPath!,
              onError: _handleVideoError,
            )
          else
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.videocam_off,
                    color: Colors.white30,
                    size: 80,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No video available',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      widget.onModeChange(CreatorMode.camera);
                    },
                    icon: const Icon(Icons.videocam),
                    label: const Text('Record Video'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00CED1),
                    ),
                  ),
                ],
              ),
            ),
          
          // Remove bottom controls - FixedBottomToolbar in VideoCreatorScreen handles these
          // This prevents duplicate buttons and confusion
        ],
      ),
    );
  }
  
  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isPrimary = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isPrimary 
                  ? const Color(0xFF00CED1)
                  : Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 28,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              color: isPrimary ? const Color(0xFF00CED1) : Colors.white70,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}