import 'package:flutter/material.dart';
import '../video_creator_screen.dart';

/// Simple test widget to verify navigation functionality
class TestNavigation extends StatelessWidget {
  final CreatorMode currentMode;
  final Function(CreatorMode) onModeChange;
  
  const TestNavigation({
    super.key,
    required this.currentMode,
    required this.onModeChange,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Current Mode: ${currentMode.name}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 40),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                _buildTestButton('Camera', CreatorMode.camera),
                _buildTestButton('Edit', CreatorMode.edit),
                _buildTestButton('Effects', CreatorMode.effects),
                _buildTestButton('Music', CreatorMode.music),
                _buildTestButton('Text', CreatorMode.text),
                _buildTestButton('Filters', CreatorMode.filters),
                _buildTestButton('Tools', CreatorMode.tools),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTestButton(String label, CreatorMode mode) {
    final isSelected = currentMode == mode;
    
    return ElevatedButton(
      onPressed: () {
        print('TestNavigation: Switching to $mode');
        onModeChange(mode);
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: isSelected ? const Color(0xFF00CED1) : Colors.grey[800],
        foregroundColor: Colors.white,
      ),
      child: Text(label),
    );
  }
}