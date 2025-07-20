import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/video_player_manager.dart';
import '../features/video_capture/recording_screen.dart';
import 'gallery_picker_screen.dart';
import 'video_creator/video_creator_screen.dart';
import 'video_upload_no_preview.dart';
import 'publish_screen.dart';

class UploadFlowScreen extends StatelessWidget {
  const UploadFlowScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [
                    Color(0xFF00CED1), // Cyan
                    Color(0xFF1E90FF), // Blue
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ).createShader(bounds),
                child: const Icon(
                  Icons.video_collection_outlined,
                  size: 80,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Create a video',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 48),
              
              // Record button
              _CreateButton(
                icon: Icons.videocam,
                label: 'Record',
                onTap: () async {
                  await VideoPlayerManager.instance.pauseAllVideos();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const RecordingScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              
              // Gallery button
              _CreateButton(
                icon: Icons.photo_library,
                label: 'Upload from gallery',
                onTap: () async {
                  await VideoPlayerManager.instance.pauseAllVideos();
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const GalleryPickerScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              
              // Quick upload button
              _CreateButton(
                icon: Icons.upload_file,
                label: 'Quick upload',
                onTap: () async {
                  await VideoPlayerManager.nuclearCleanup();
                  final picker = ImagePicker();
                  final video = await picker.pickVideo(
                    source: ImageSource.gallery,
                    maxDuration: const Duration(minutes: 10),
                  );
                  
                  if (video != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PublishScreen(videoPath: video.path),
                      ),
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CreateButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _CreateButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(30),
        child: Container(
          width: 280,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFF00CED1).withOpacity(0.5),
              width: 1,
            ),
            borderRadius: BorderRadius.circular(30),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                color: const Color(0xFF00CED1),
                size: 28,
              ),
              const SizedBox(width: 16),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}