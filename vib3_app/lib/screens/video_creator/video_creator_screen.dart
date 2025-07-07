import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import 'dart:async';

// Import all feature modules
import 'modules/camera_module.dart';
import 'modules/effects_module.dart';
import 'modules/music_module.dart';
import 'modules/text_module.dart';
import 'modules/filters_module.dart';
import 'modules/tools_module.dart';
import 'providers/creation_state_provider.dart';
import 'widgets/video_preview_widget.dart';
import 'widgets/bottom_toolbar.dart';
import 'widgets/top_toolbar.dart';

/// Main Video Creator Screen - TikTok-style simplicity with all features
class VideoCreatorScreen extends StatefulWidget {
  final String? videoPath; // Optional - for editing existing video
  final String? audioPath; // Optional - for using existing audio
  
  const VideoCreatorScreen({
    super.key,
    this.videoPath,
    this.audioPath,
  });

  @override
  State<VideoCreatorScreen> createState() => _VideoCreatorScreenState();
}

class _VideoCreatorScreenState extends State<VideoCreatorScreen> 
    with TickerProviderStateMixin {
  // Animation controllers
  late AnimationController _toolPanelController;
  late AnimationController _transitionController;
  
  // Current mode - start with camera if no initial video
  late CreatorMode _currentMode;
  
  @override
  void initState() {
    super.initState();
    
    // Initialize animation controllers
    _toolPanelController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _transitionController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    // Initialize mode based on whether we have a video
    if (widget.videoPath != null) {
      // Start in edit mode when we have a video
      _currentMode = CreatorMode.edit;
    } else {
      // Start with camera when no video
      _currentMode = CreatorMode.camera;
    }
    
    // Lock to portrait
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
  }
  
  @override
  void dispose() {
    _toolPanelController.dispose();
    _transitionController.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }
  
  Widget _buildCurrentMode() {
    switch (_currentMode) {
      case CreatorMode.camera:
        return CameraModule(
          onVideoRecorded: (path) {
            // The CameraModule already adds the clip to creation state
            // We just need to switch to edit mode
            print('VideoCreatorScreen: Switching to edit mode after recording');
            setState(() {
              _currentMode = CreatorMode.edit;
            });
          },
        );
      case CreatorMode.edit:
        return VideoPreviewWidget(
          onModeChange: (mode) {
            setState(() {
              _currentMode = mode;
            });
          },
        );
      case CreatorMode.effects:
        return EffectsModule();
      case CreatorMode.music:
        return MusicModule();
      case CreatorMode.text:
        return TextModule();
      case CreatorMode.filters:
        return FiltersModule();
      case CreatorMode.tools:
        return ToolsModule();
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CreationStateProvider(),
      child: Builder(
        builder: (providerContext) {
          // Initialize creation state with video path immediately
          WidgetsBinding.instance.addPostFrameCallback((_) {
            final creationState = providerContext.read<CreationStateProvider>();
            if (widget.videoPath != null && creationState.videoClips.isEmpty) {
              print('VideoCreatorScreen: Loading video from ${widget.videoPath}');
              creationState.loadExistingVideo(widget.videoPath!);
            }
            if (widget.audioPath != null) {
              creationState.setBackgroundMusic(widget.audioPath!);
            }
          });
          
          return Scaffold(
            backgroundColor: Colors.black,
            body: Consumer<CreationStateProvider>(
              builder: (context, creationState, child) {
                return Stack(
                  children: [
                    // Main content area
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: _buildCurrentMode(),
                    ),
            
            // Top toolbar (context-sensitive)
            if (_currentMode != CreatorMode.camera)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: TopToolbar(
                  currentMode: _currentMode,
                  onBack: () {
                    if (_currentMode == CreatorMode.camera) {
                      Navigator.pop(context);
                    } else {
                      setState(() {
                        _currentMode = CreatorMode.edit;
                      });
                    }
                  },
                  onNext: () {
                    if (_currentMode == CreatorMode.edit) {
                      // Only navigate to upload from edit mode
                      _navigateToUpload();
                    } else {
                      // From other modes, return to edit mode
                      setState(() {
                        _currentMode = CreatorMode.edit;
                      });
                      
                      // Show confirmation
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(_getConfirmationMessage()),
                          duration: const Duration(seconds: 1),
                          backgroundColor: const Color(0xFF00CED1),
                        ),
                      );
                    }
                  },
                ),
              ),
            
            // Bottom toolbar (main navigation) - show in edit and when returning from other modes
            if (_currentMode == CreatorMode.edit || 
                (_currentMode != CreatorMode.camera && _currentMode != CreatorMode.edit))
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: AnimatedOpacity(
                  opacity: _currentMode == CreatorMode.edit ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: IgnorePointer(
                    ignoring: _currentMode != CreatorMode.edit,
                    child: BottomToolbar(
                      onModeSelected: (mode) {
                        setState(() {
                          _currentMode = mode;
                        });
                        _toolPanelController.forward();
                      },
                    ),
                  ),
                ),
              ),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }
  
  String _getConfirmationMessage() {
    switch (_currentMode) {
      case CreatorMode.music:
        return 'Music added to video';
      case CreatorMode.effects:
        return 'Effects applied';
      case CreatorMode.text:
        return 'Text & stickers added';
      case CreatorMode.filters:
        return 'Filter applied';
      case CreatorMode.tools:
        return 'Adjustments saved';
      default:
        return 'Changes applied';
    }
  }
  
  void _navigateToUpload() {
    final creationState = context.read<CreationStateProvider>();
    double exportProgress = 0.0;
    
    // Show export progress dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Center(
          child: Container(
            padding: const EdgeInsets.all(24),
            margin: const EdgeInsets.symmetric(horizontal: 40),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.9),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF00CED1).withOpacity(0.3)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Exporting Video',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    SizedBox(
                      width: 80,
                      height: 80,
                      child: CircularProgressIndicator(
                        value: exportProgress,
                        strokeWidth: 6,
                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00CED1)),
                        backgroundColor: Colors.white.withOpacity(0.1),
                      ),
                    ),
                    Text(
                      '${(exportProgress * 100).toInt()}%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Processing your masterpiece...',
                  style: TextStyle(
                    color: Colors.white54,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    
    // Export with progress callback
    creationState.exportFinalVideo(
      onProgress: (progress) {
        if (mounted) {
          setState(() {
            exportProgress = progress;
          });
        }
      },
    ).then((exportedPath) {
      Navigator.pop(context); // Close loading
      
      // Navigate to upload screen
      Navigator.pushNamed(
        context,
        '/upload',
        arguments: {'videoPath': exportedPath},
      );
    }).catchError((error) {
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Export failed: $error'),
          backgroundColor: Colors.red,
        ),
      );
    });
  }
}

/// Modes for the video creator
enum CreatorMode {
  camera,
  edit,
  effects,
  music,
  text,
  filters,
  tools,
}