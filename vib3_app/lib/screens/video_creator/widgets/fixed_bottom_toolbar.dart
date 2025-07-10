import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../video_creator_screen.dart';

/// Fixed bottom toolbar that won't be affected by draggable elements
class FixedBottomToolbar extends StatelessWidget {
  final Function(CreatorMode) onModeSelected;
  final CreatorMode? currentMode;
  final VoidCallback? onNext;
  
  const FixedBottomToolbar({
    super.key,
    required this.onModeSelected,
    this.currentMode,
    this.onNext,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 90,
      decoration: BoxDecoration(
        color: Colors.black,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.8),
            offset: const Offset(0, -2),
            blurRadius: 15,
            spreadRadius: 5,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildButton(
                icon: Icons.music_note,
                label: 'Sounds',
                mode: CreatorMode.music,
              ),
              _buildButton(
                icon: Icons.text_fields,
                label: 'Text',
                mode: CreatorMode.text,
              ),
              _buildButton(
                icon: Icons.auto_awesome,
                label: 'Effects',
                mode: CreatorMode.effects,
              ),
              _buildButton(
                icon: Icons.color_lens,
                label: 'Filters',
                mode: CreatorMode.filters,
              ),
              _buildButton(
                icon: Icons.content_cut,
                label: 'Tools',
                mode: CreatorMode.tools,
              ),
              // Add Next button when in edit mode
              if (currentMode == CreatorMode.edit)
                _buildNextButton(context),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildButton({
    required IconData icon,
    required String label,
    required CreatorMode mode,
  }) {
    final isSelected = currentMode == mode;
    
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) {
          HapticFeedback.lightImpact();
        },
        onTap: () {
          print('\n=== FixedBottomToolbar: Button Tap ===');
          print('Button: $label');
          print('Mode to select: $mode');
          print('Current mode: $currentMode');
          print('====================================\n');
          
          HapticFeedback.selectionClick();
          
          try {
            onModeSelected(mode);
            print('Mode selection callback completed');
          } catch (e) {
            print('ERROR in mode selection: $e');
          }
        },
        child: Container(
          color: Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected 
                      ? const Color(0xFF00CED1).withOpacity(0.2)
                      : Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected 
                        ? const Color(0xFF00CED1)
                        : Colors.white.withOpacity(0.3),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Icon(
                  icon,
                  color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildNextButton(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.selectionClick();
          print('\\n=== FixedBottomToolbar: Next Button Tap ===');
          print('Attempting to navigate to upload screen');
          print('==========================================\\n');
          
          if (onNext != null) {
            onNext!();
          } else {
            print('ERROR: onNext callback not provided');
          }
        },
        child: Container(
          color: Colors.transparent,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF00CED1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.arrow_forward,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Next',
                style: TextStyle(
                  color: Color(0xFF00CED1),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}