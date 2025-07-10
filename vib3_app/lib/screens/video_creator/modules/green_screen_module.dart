import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../providers/creation_state_provider.dart';
import '../widgets/camera_controls.dart';

class GreenScreenModule extends StatefulWidget {
  const GreenScreenModule({super.key});
  
  @override
  State<GreenScreenModule> createState() => _GreenScreenModuleState();
}

class _GreenScreenModuleState extends State<GreenScreenModule> {
  // Camera
  CameraController? _cameraController;
  List<CameraDescription> _cameras = [];
  int _selectedCameraIndex = 0;
  bool _isInitialized = false;
  
  // Green screen settings
  String? _backgroundImagePath;
  String? _backgroundVideoPath;
  GreenScreenMode _mode = GreenScreenMode.color;
  Color _chromaKeyColor = Colors.green;
  double _threshold = 0.4;
  double _smoothing = 0.1;
  
  // Preset backgrounds
  final List<BackgroundPreset> _presets = [
    BackgroundPreset(
      name: 'Beach',
      thumbnail: 'assets/backgrounds/beach_thumb.jpg',
      path: 'assets/backgrounds/beach.jpg',
      type: BackgroundType.image,
    ),
    BackgroundPreset(
      name: 'City',
      thumbnail: 'assets/backgrounds/city_thumb.jpg',
      path: 'assets/backgrounds/city.jpg',
      type: BackgroundType.image,
    ),
    BackgroundPreset(
      name: 'Space',
      thumbnail: 'assets/backgrounds/space_thumb.jpg',
      path: 'assets/backgrounds/space.jpg',
      type: BackgroundType.image,
    ),
    BackgroundPreset(
      name: 'Forest',
      thumbnail: 'assets/backgrounds/forest_thumb.jpg',
      path: 'assets/backgrounds/forest.mp4',
      type: BackgroundType.video,
    ),
    BackgroundPreset(
      name: 'Abstract',
      thumbnail: 'assets/backgrounds/abstract_thumb.jpg',
      path: 'assets/backgrounds/abstract.mp4',
      type: BackgroundType.video,
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }
  
  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }
  
  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras.isEmpty) return;
      
      // Prefer front camera for green screen
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
      enableAudio: false, // No audio needed for preview
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
  
  Future<void> _pickBackgroundImage() async {
    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image != null) {
      setState(() {
        _backgroundImagePath = image.path;
        _backgroundVideoPath = null;
      });
    }
  }
  
  Future<void> _pickBackgroundVideo() async {
    final picker = ImagePicker();
    final XFile? video = await picker.pickVideo(source: ImageSource.gallery);
    
    if (video != null) {
      setState(() {
        _backgroundVideoPath = video.path;
        _backgroundImagePath = null;
      });
    }
  }
  
  void _selectPreset(BackgroundPreset preset) {
    setState(() {
      if (preset.type == BackgroundType.image) {
        _backgroundImagePath = preset.path;
        _backgroundVideoPath = null;
      } else {
        _backgroundVideoPath = preset.path;
        _backgroundImagePath = null;
      }
    });
  }
  
  void _applyGreenScreen() {
    final creationState = context.read<CreationStateProvider>();
    
    // Add green screen effect
    creationState.addEffect(
      VideoEffect(
        type: 'green_screen',
        parameters: {
          'mode': _mode.toString(),
          'chromaKeyColor': _chromaKeyColor.value,
          'threshold': _threshold,
          'smoothing': _smoothing,
          'backgroundImage': _backgroundImagePath,
          'backgroundVideo': _backgroundVideoPath,
        },
      ),
    );
    
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Green screen effect applied'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  Widget _buildColorPicker() {
    final colors = [
      Colors.green,
      Colors.blue,
      Colors.red,
      Colors.yellow,
      Colors.purple,
      Colors.pink,
      Colors.orange,
      Colors.cyan,
    ];
    
    return Container(
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: colors.length,
        itemBuilder: (context, index) {
          final color = colors[index];
          final isSelected = _chromaKeyColor.value == color.value;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                _chromaKeyColor = color;
              });
            },
            child: Container(
              width: 50,
              height: 50,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? Colors.white : Colors.transparent,
                  width: 3,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: color.withOpacity(0.5),
                          blurRadius: 10,
                          spreadRadius: 2,
                        ),
                      ]
                    : null,
              ),
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildBackgroundSelector() {
    return Container(
      height: 120,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          // Upload custom background
          _buildBackgroundOption(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.add_photo_alternate, color: Colors.white, size: 30),
                SizedBox(height: 4),
                Text(
                  'Image',
                  style: TextStyle(color: Colors.white, fontSize: 10),
                ),
              ],
            ),
            onTap: _pickBackgroundImage,
          ),
          
          _buildBackgroundOption(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.video_library, color: Colors.white, size: 30),
                SizedBox(height: 4),
                Text(
                  'Video',
                  style: TextStyle(color: Colors.white, fontSize: 10),
                ),
              ],
            ),
            onTap: _pickBackgroundVideo,
          ),
          
          // Preset backgrounds
          ..._presets.map((preset) => _buildBackgroundOption(
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Thumbnail would be loaded here
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.primaries[_presets.indexOf(preset) % Colors.primaries.length],
                        Colors.primaries[(_presets.indexOf(preset) + 1) % Colors.primaries.length],
                      ],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 4,
                  left: 0,
                  right: 0,
                  child: Container(
                    color: Colors.black54,
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text(
                      preset.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
            onTap: () => _selectPreset(preset),
            isSelected: (_backgroundImagePath == preset.path || 
                         _backgroundVideoPath == preset.path),
          )),
        ],
      ),
    );
  }
  
  Widget _buildBackgroundOption({
    required Widget child,
    required VoidCallback onTap,
    bool isSelected = false,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 80,
        height: 100,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? const Color(0xFF00CED1) : Colors.white30,
            width: isSelected ? 3 : 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: child,
        ),
      ),
    );
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
                  'Green Screen',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      onPressed: _toggleCamera,
                      icon: const Icon(Icons.flip_camera_ios),
                      color: Colors.white,
                    ),
                    TextButton(
                      onPressed: _applyGreenScreen,
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
              ],
            ),
          ),
          
          // Camera preview with green screen
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white30),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Stack(
                  children: [
                    // Background preview
                    if (_backgroundImagePath != null)
                      Positioned.fill(
                        child: Image.file(
                          File(_backgroundImagePath!),
                          fit: BoxFit.cover,
                        ),
                      ),
                    
                    // Camera preview (would have green screen applied)
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
                    
                    // Info overlay
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Preview',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Chroma key color selector
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Select Color to Remove',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                _buildColorPicker(),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Threshold and smoothing controls
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                // Threshold
                Row(
                  children: [
                    const SizedBox(
                      width: 80,
                      child: Text(
                        'Threshold',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                    Expanded(
                      child: SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: const Color(0xFF00CED1),
                          inactiveTrackColor: Colors.grey[800],
                          thumbColor: const Color(0xFF00CED1),
                        ),
                        child: Slider(
                          value: _threshold,
                          min: 0.1,
                          max: 0.9,
                          onChanged: (value) {
                            setState(() {
                              _threshold = value;
                            });
                          },
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 40,
                      child: Text(
                        '${(_threshold * 100).toInt()}%',
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
                
                // Smoothing
                Row(
                  children: [
                    const SizedBox(
                      width: 80,
                      child: Text(
                        'Smoothing',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                    Expanded(
                      child: SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor: const Color(0xFFFF0080),
                          inactiveTrackColor: Colors.grey[800],
                          thumbColor: const Color(0xFFFF0080),
                        ),
                        child: Slider(
                          value: _smoothing,
                          min: 0.0,
                          max: 0.5,
                          onChanged: (value) {
                            setState(() {
                              _smoothing = value;
                            });
                          },
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 40,
                      child: Text(
                        '${(_smoothing * 100).toInt()}%',
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                        textAlign: TextAlign.right,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Background selector
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choose Background',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                _buildBackgroundSelector(),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

enum GreenScreenMode {
  color,
  auto,
}

enum BackgroundType {
  image,
  video,
}

class BackgroundPreset {
  final String name;
  final String thumbnail;
  final String path;
  final BackgroundType type;
  
  BackgroundPreset({
    required this.name,
    required this.thumbnail,
    required this.path,
    required this.type,
  });
}