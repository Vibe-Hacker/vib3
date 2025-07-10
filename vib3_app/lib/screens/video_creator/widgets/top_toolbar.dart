import 'package:flutter/material.dart';
import '../video_creator_screen.dart';

class TopToolbar extends StatelessWidget {
  final CreatorMode currentMode;
  final VoidCallback onBack;
  
  const TopToolbar({
    super.key,
    required this.currentMode,
    required this.onBack,
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
          
          // Empty space to balance the layout
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