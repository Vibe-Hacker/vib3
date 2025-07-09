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
import 'widgets/working_video_preview.dart';
import 'widgets/fixed_bottom_toolbar.dart';
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
    with TickerProviderStateMixin, WidgetsBindingObserver {
  // Animation controllers
  late AnimationController _toolPanelController;
  late AnimationController _transitionController;
  
  // Current mode - start with camera if no initial video
  late CreatorMode _currentMode;
  bool _isDraggingButtons = false;
  
  // Creation state provider - create once and reuse
  late final CreationStateProvider _creationStateProvider;
  
  @override
  void initState() {
    super.initState();
    
    // Add observer for lifecycle management
    WidgetsBinding.instance.addObserver(this);
    
    // Initialize creation state provider
    _creationStateProvider = CreationStateProvider();
    
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
      // Load the existing video
      _creationStateProvider.loadExistingVideo(widget.videoPath!);
    } else {
      // Start with camera when no video
      _currentMode = CreatorMode.camera;
    }
    
    if (widget.audioPath != null) {
      _creationStateProvider.setBackgroundMusic(widget.audioPath!);
    }
    
    // Lock to portrait
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _toolPanelController.dispose();
    _transitionController.dispose();
    _creationStateProvider.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Prevent excessive focus handling
    if (state == AppLifecycleState.resumed) {
      // Request focus only once when resuming
      FocusScope.of(context).requestFocus(FocusNode());
    }
  }
  
  Widget _buildCurrentMode() {
    switch (_currentMode) {
      case CreatorMode.camera:
        return CameraModule(
          onVideoRecorded: (path) {
            // The CameraModule already adds the clip to creation state
            // We just need to switch to edit mode
            print('\n=== VideoCreatorScreen: onVideoRecorded ===' );
            print('Path received: $path');
            print('Provider instance: ${_creationStateProvider.hashCode}');
            print('Clips in provider: ${_creationStateProvider.videoClips.length}');
            
            setState(() {
              _currentMode = CreatorMode.edit;
            });
            
            print('Mode changed to: $_currentMode\n');
          },
        );
      case CreatorMode.edit:
        return WorkingVideoPreview(
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
    return ChangeNotifierProvider.value(
      value: _creationStateProvider,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Consumer<CreationStateProvider>(
          builder: (context, creationState, child) {
                return Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Main content area with padding for toolbars
                    Positioned(
                      top: _currentMode != CreatorMode.camera ? 60 : 0, // Space for top toolbar
                      bottom: _currentMode != CreatorMode.camera ? 90 : 0, // Space for bottom toolbar when not in camera
                      left: 0,
                      right: 0,
                      child: IgnorePointer(
                        ignoring: _currentMode == CreatorMode.edit && _isDraggingButtons,
                        child: ClipRect(
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 300),
                            child: _buildCurrentMode(),
                          ),
                        ),
                      ),
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
                    } else if (_currentMode == CreatorMode.edit) {
                      // From edit mode, go back to previous screen
                      Navigator.pop(context);
                    } else {
                      // From other modes, return to edit mode
                      setState(() {
                        _currentMode = CreatorMode.edit;
                      });
                    }
                  },
                  onNext: () {
                    print('TopToolbar Next pressed - Current mode: $_currentMode');
                    if (_currentMode == CreatorMode.edit) {
                      // Only navigate to upload from edit mode
                      print('Navigating to upload from edit mode');
                      _navigateToUpload();
                    } else {
                      // From other modes, return to edit mode
                      print('Returning to edit mode from $_currentMode');
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
            
            // Bottom toolbar (main navigation) - show in edit mode and feature modes
            // Using Align instead of Positioned to ensure it's always on top
            if (_currentMode != CreatorMode.camera)
              Align(
                alignment: Alignment.bottomCenter,
                child: IgnorePointer(
                  ignoring: false, // Always allow touches
                  child: FixedBottomToolbar(
                    key: const ValueKey('fixed_bottom_toolbar'),
                    currentMode: _currentMode,
                    onModeSelected: (mode) {
                      print('VideoCreatorScreen: Mode selected - $mode');
                      if (mounted) {
                        setState(() {
                          _currentMode = mode;
                        });
                        _toolPanelController.forward();
                      }
                    },
                  ),
                ),
              ),
                  ],
                );
          },
        ),
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
  
  void _navigateToUpload() async {
    print('_navigateToUpload called');
    final creationState = context.read<CreationStateProvider>();
    
    // Check if there are video clips to export
    if (creationState.videoClips.isEmpty) {
      print('No video clips to export');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No video to export'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    print('Video clips found: ${creationState.videoClips.length}');
    
    double exportProgress = 0.0;
    bool exportComplete = false;
    
    // Show export progress dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            // Start export if not already started
            if (!exportComplete && exportProgress == 0.0) {
              Future.delayed(Duration.zero, () async {
                try {
                  final exportedPath = await creationState.exportFinalVideo(
                    onProgress: (progress) {
                      if (mounted) {
                        setDialogState(() {
                          exportProgress = progress;
                        });
                      }
                    },
                  );
                  
                  exportComplete = true;
                  
                  if (mounted) {
                    print('Export complete, navigating to upload with path: $exportedPath');
                    Navigator.pop(dialogContext); // Close loading dialog
                    
                    // Navigate to upload screen
                    Navigator.pushNamed(
                      context,
                      '/upload',
                      arguments: {'videoPath': exportedPath},
                    ).then((_) {
                      print('Navigation to upload completed');
                    }).catchError((error) {
                      print('Navigation error: $error');
                    });
                  }
                } catch (error) {
                  if (mounted) {
                    Navigator.pop(dialogContext); // Close loading dialog
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Export failed: $error'),
                        backgroundColor: Colors.red,
                      ),
                    );
                  }
                }
              });
            }
            
            return Center(
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
                            value: exportProgress > 0 ? exportProgress : null,
                            strokeWidth: 6,
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00CED1)),
                            backgroundColor: Colors.white.withOpacity(0.1),
                          ),
                        ),
                        if (exportProgress > 0)
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
            );
          },
        );
      },
    );
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