import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class PhotoSlideshowModule extends StatefulWidget {
  const PhotoSlideshowModule({super.key});
  
  @override
  State<PhotoSlideshowModule> createState() => _PhotoSlideshowModuleState();
}

class _PhotoSlideshowModuleState extends State<PhotoSlideshowModule> {
  final List<PhotoSlide> _selectedPhotos = [];
  SlideshowStyle _selectedStyle = SlideshowStyle.classic;
  double _slideDuration = 2.0; // seconds per photo
  bool _autoKenBurns = true;
  
  final Map<SlideshowStyle, SlideshowConfig> _styles = {
    SlideshowStyle.classic: SlideshowConfig(
      name: 'Classic',
      transition: 'fade',
      duration: 500,
    ),
    SlideshowStyle.dynamic: SlideshowConfig(
      name: 'Dynamic',
      transition: 'zoom',
      duration: 300,
    ),
    SlideshowStyle.memories: SlideshowConfig(
      name: 'Memories',
      transition: 'polaroid',
      duration: 600,
    ),
    SlideshowStyle.modern: SlideshowConfig(
      name: 'Modern',
      transition: 'slide',
      duration: 400,
    ),
  };
  
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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Photo Slideshow',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _selectedPhotos.isNotEmpty ? _createSlideshow : null,
                  child: Text(
                    'Create',
                    style: TextStyle(
                      color: _selectedPhotos.isNotEmpty 
                          ? const Color(0xFF00CED1)
                          : Colors.white30,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Photo selection
          Container(
            height: 120,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                // Add photo button
                GestureDetector(
                  onTap: _selectPhotos,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFF00CED1),
                        style: BorderStyle.solid,
                        width: 2,
                      ),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.add_photo_alternate,
                          color: Color(0xFF00CED1),
                          size: 32,
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Add Photos',
                          style: TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(width: 12),
                
                // Selected photos
                Expanded(
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: _selectedPhotos.length,
                    itemBuilder: (context, index) {
                      return _buildPhotoThumbnail(_selectedPhotos[index], index);
                    },
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Style selection
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Slideshow Style',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 2.5,
                  ),
                  itemCount: _styles.length,
                  itemBuilder: (context, index) {
                    final style = SlideshowStyle.values[index];
                    final config = _styles[style]!;
                    final isSelected = _selectedStyle == style;
                    
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedStyle = style;
                        });
                      },
                      child: Container(
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
                        child: Center(
                          child: Text(
                            config.name,
                            style: TextStyle(
                              color: isSelected 
                                  ? const Color(0xFF00CED1)
                                  : Colors.white,
                              fontWeight: isSelected 
                                  ? FontWeight.bold 
                                  : FontWeight.normal,
                            ),
                          ),
                        ),
                      ),
                    );
                  },
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
                  // Slide duration
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Slide Duration',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              '${_slideDuration.toStringAsFixed(1)}s',
                              style: const TextStyle(
                                color: Color(0xFF00CED1),
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        Slider(
                          value: _slideDuration,
                          min: 0.5,
                          max: 5.0,
                          divisions: 9,
                          onChanged: (value) {
                            setState(() {
                              _slideDuration = value;
                            });
                          },
                          activeColor: const Color(0xFF00CED1),
                          inactiveColor: Colors.white.withOpacity(0.2),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Ken Burns effect
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.pan_tool,
                          color: Colors.white54,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ken Burns Effect',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                'Subtle zoom and pan movement',
                                style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: _autoKenBurns,
                          onChanged: (value) {
                            setState(() {
                              _autoKenBurns = value;
                            });
                          },
                          activeColor: const Color(0xFF00CED1),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Preview info
                  if (_selectedPhotos.isNotEmpty)
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
                        children: [
                          const Icon(
                            Icons.info_outline,
                            color: Color(0xFF00CED1),
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Total duration: ${(_selectedPhotos.length * _slideDuration).toStringAsFixed(1)} seconds',
                              style: const TextStyle(
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
  
  Widget _buildPhotoThumbnail(PhotoSlide photo, int index) {
    return Container(
      width: 100,
      height: 100,
      margin: const EdgeInsets.only(right: 8),
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[800],
              borderRadius: BorderRadius.circular(8),
              image: photo.path != null
                  ? DecorationImage(
                      image: AssetImage(photo.path!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: photo.path == null
                ? const Center(
                    child: Icon(
                      Icons.image,
                      color: Colors.white54,
                      size: 32,
                    ),
                  )
                : null,
          ),
          
          // Order number
          Positioned(
            top: 4,
            left: 4,
            child: Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(
                color: Color(0xFF00CED1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '${index + 1}',
                  style: const TextStyle(
                    color: Colors.black,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
          
          // Remove button
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedPhotos.removeAt(index);
                });
              },
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
        ],
      ),
    );
  }
  
  void _selectPhotos() {
    // Simulate photo selection
    setState(() {
      _selectedPhotos.add(
        PhotoSlide(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          path: null, // Would be actual photo path
        ),
      );
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Opening photo gallery...'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
  
  void _createSlideshow() {
    final creationState = context.read<CreationStateProvider>();
    
    creationState.addEffect(
      VideoEffect(
        type: 'photo_slideshow',
        parameters: {
          'photos': _selectedPhotos.map((photo) => {
            'id': photo.id,
            'path': photo.path,
          }).toList(),
          'style': _selectedStyle.toString(),
          'slideDuration': _slideDuration * 1000, // Convert to milliseconds
          'kenBurns': _autoKenBurns,
          'transition': _styles[_selectedStyle]!.transition,
          'transitionDuration': _styles[_selectedStyle]!.duration,
        },
      ),
    );
    
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Photo slideshow created'),
        backgroundColor: Color(0xFF00CED1),
      ),
    );
  }
}

// Data models
class PhotoSlide {
  final String id;
  final String? path;
  
  PhotoSlide({
    required this.id,
    this.path,
  });
}

enum SlideshowStyle {
  classic,
  dynamic,
  memories,
  modern,
}

class SlideshowConfig {
  final String name;
  final String transition;
  final int duration;
  
  SlideshowConfig({
    required this.name,
    required this.transition,
    required this.duration,
  });
}