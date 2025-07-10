import 'package:flutter/material.dart';
import '../video_creator_screen.dart';

class BottomToolbar extends StatelessWidget {
  final Function(CreatorMode) onModeSelected;
  
  const BottomToolbar({
    super.key,
    required this.onModeSelected,
  });
  
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {}, // Catch taps that fall through
      child: Container(
        height: 100,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.9),
          border: Border(
            top: BorderSide(
              color: Colors.white.withOpacity(0.2),
              width: 2,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              offset: const Offset(0, -2),
              blurRadius: 10,
            ),
          ],
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              _buildToolButton(
                icon: Icons.music_note,
                label: 'Sounds',
                onTap: () => onModeSelected(CreatorMode.music),
              ),
              _buildToolButton(
                icon: Icons.text_fields,
                label: 'Text',
                onTap: () => onModeSelected(CreatorMode.text),
              ),
              _buildToolButton(
                icon: Icons.emoji_emotions,
                label: 'Stickers',
                onTap: () => onModeSelected(CreatorMode.text), // Stickers are in text module
              ),
              _buildToolButton(
                icon: Icons.auto_awesome,
                label: 'Effects',
                onTap: () => onModeSelected(CreatorMode.effects),
              ),
              _buildToolButton(
                icon: Icons.color_lens,
                label: 'Filters',
                onTap: () => onModeSelected(CreatorMode.filters),
              ),
              _buildToolButton(
                icon: Icons.tune,
                label: 'Adjust',
                onTap: () => onModeSelected(CreatorMode.tools),
              ),
              _buildToolButton(
                icon: Icons.mic,
                label: 'Voiceover',
                onTap: () => onModeSelected(CreatorMode.music), // Voiceover is in music module
              ),
              _buildToolButton(
                icon: Icons.content_cut,
                label: 'Trim',
                onTap: () => onModeSelected(CreatorMode.tools), // Trim is in tools module
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildToolButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          print('BottomToolbar: $label button tapped');
          onTap();
        },
        borderRadius: BorderRadius.circular(30),
        splashColor: Colors.white.withOpacity(0.3),
        highlightColor: Colors.white.withOpacity(0.1),
        child: Container(
          padding: const EdgeInsets.all(10),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withOpacity(0.2),
                      Colors.white.withOpacity(0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                    width: 1.5,
                  ),
                ),
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}