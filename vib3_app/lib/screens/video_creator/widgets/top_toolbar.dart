import 'package:flutter/material.dart';
import '../video_creator_screen.dart';

class TopToolbar extends StatelessWidget {
  final CreatorMode currentMode;
  final VoidCallback onBack;
  final VoidCallback? onNext;
  
  const TopToolbar({
    super.key,
    required this.currentMode,
    required this.onBack,
    this.onNext,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 10,
        left: 20,
        right: 20,
        bottom: 10,
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Back button
          IconButton(
            onPressed: onBack,
            icon: const Icon(
              Icons.arrow_back,
              color: Colors.white,
              size: 28,
            ),
          ),
          
          // Mode title
          Text(
            _getModeTitle(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          // Next button (only in edit mode)
          if (currentMode == CreatorMode.edit && onNext != null)
            TextButton(
              onPressed: onNext,
              style: TextButton.styleFrom(
                backgroundColor: const Color(0xFF00CED1),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: const Text(
                'Next',
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            )
          else
            const SizedBox(width: 48),
        ],
      ),
    );
  }
  
  String _getModeTitle() {
    switch (currentMode) {
      case CreatorMode.camera:
        return 'Record';
      case CreatorMode.edit:
        return 'Edit Video';
      case CreatorMode.effects:
        return 'Effects';
      case CreatorMode.music:
        return 'Sounds';
      case CreatorMode.text:
        return 'Text & Stickers';
      case CreatorMode.filters:
        return 'Filters';
      case CreatorMode.tools:
        return 'Adjust';
    }
  }
}