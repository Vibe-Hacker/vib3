import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';

class CameraControls extends StatefulWidget {
  final bool isRecording;
  final bool isPaused;
  final FlashMode flashMode;
  final int selectedDuration;
  final double selectedSpeed;
  final bool showGrid;
  final bool beautyMode;
  final VoidCallback onRecord;
  final VoidCallback onStop;
  final VoidCallback onFlip;
  final VoidCallback onFlash;
  final Function(int) onDurationChanged;
  final Function(double) onSpeedChanged;
  final Function(int) onTimerSelected;
  final VoidCallback onGridToggle;
  final VoidCallback onBeautyToggle;
  final VoidCallback? onFiltersToggle;
  final VoidCallback onGallery;
  
  const CameraControls({
    super.key,
    required this.isRecording,
    required this.isPaused,
    required this.flashMode,
    required this.selectedDuration,
    required this.selectedSpeed,
    required this.showGrid,
    required this.beautyMode,
    required this.onRecord,
    required this.onStop,
    required this.onFlip,
    required this.onFlash,
    required this.onDurationChanged,
    required this.onSpeedChanged,
    required this.onTimerSelected,
    required this.onGridToggle,
    required this.onBeautyToggle,
    this.onFiltersToggle,
    required this.onGallery,
  });
  
  @override
  State<CameraControls> createState() => _CameraControlsState();
}

class _CameraControlsState extends State<CameraControls> {
  bool _showDurationOptions = false;
  bool _showSpeedOptions = false;
  bool _showTimerOptions = false;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(bottom: 30),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.7),
          ],
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Top controls
          if (!widget.isRecording)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  // Duration selector
                  _buildControlButton(
                    label: '${widget.selectedDuration}s',
                    icon: Icons.timer,
                    isSelected: _showDurationOptions,
                    onTap: () {
                      setState(() {
                        _showDurationOptions = !_showDurationOptions;
                        _showSpeedOptions = false;
                        _showTimerOptions = false;
                      });
                    },
                  ),
                  
                  // Speed selector
                  _buildControlButton(
                    label: '${widget.selectedSpeed}x',
                    icon: Icons.speed,
                    isSelected: _showSpeedOptions,
                    onTap: () {
                      setState(() {
                        _showSpeedOptions = !_showSpeedOptions;
                        _showDurationOptions = false;
                        _showTimerOptions = false;
                      });
                    },
                  ),
                  
                  // Timer
                  _buildControlButton(
                    label: 'Timer',
                    icon: Icons.timer_outlined,
                    isSelected: _showTimerOptions,
                    onTap: () {
                      setState(() {
                        _showTimerOptions = !_showTimerOptions;
                        _showDurationOptions = false;
                        _showSpeedOptions = false;
                      });
                    },
                  ),
                  
                  // Beauty mode
                  _buildControlButton(
                    label: 'Beauty',
                    icon: Icons.face_retouching_natural,
                    isSelected: widget.beautyMode,
                    onTap: widget.onBeautyToggle,
                  ),
                  
                  // Filters
                  if (widget.onFiltersToggle != null)
                    _buildControlButton(
                      label: 'Filters',
                      icon: Icons.photo_filter,
                      isSelected: false,
                      onTap: widget.onFiltersToggle!,
                    ),
                  
                  // Grid
                  _buildControlButton(
                    label: 'Grid',
                    icon: Icons.grid_3x3,
                    isSelected: widget.showGrid,
                    onTap: widget.onGridToggle,
                  ),
                ],
              ),
            ),
          
          // Option panels
          if (_showDurationOptions)
            _buildDurationOptions(),
          if (_showSpeedOptions)
            _buildSpeedOptions(),
          if (_showTimerOptions)
            _buildTimerOptions(),
          
          // Main controls
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                // Gallery
                if (!widget.isRecording)
                  IconButton(
                    onPressed: widget.onGallery,
                    icon: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.white, width: 2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.photo_library,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                  )
                else
                  const SizedBox(width: 50),
                
                // Record button
                GestureDetector(
                  onTap: widget.isRecording ? widget.onRecord : widget.onRecord,
                  onLongPress: widget.isRecording ? widget.onStop : null,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: widget.isRecording ? Colors.red : Colors.white,
                        width: 5,
                      ),
                    ),
                    child: Container(
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: widget.isRecording 
                            ? (widget.isPaused ? Colors.orange : Colors.red)
                            : const Color(0xFFFF0080),
                        shape: widget.isRecording && !widget.isPaused
                            ? BoxShape.rectangle
                            : BoxShape.circle,
                        borderRadius: widget.isRecording && !widget.isPaused
                            ? BorderRadius.circular(8)
                            : null,
                      ),
                    ),
                  ),
                ),
                
                // Right side controls
                if (!widget.isRecording)
                  Column(
                    children: [
                      // Flip camera
                      IconButton(
                        onPressed: widget.onFlip,
                        icon: const Icon(
                          Icons.flip_camera_ios,
                          color: Colors.white,
                          size: 30,
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Flash
                      IconButton(
                        onPressed: widget.onFlash,
                        icon: Icon(
                          _getFlashIcon(),
                          color: Colors.white,
                          size: 30,
                        ),
                      ),
                    ],
                  )
                else
                  const SizedBox(width: 50),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildControlButton({
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected 
              ? const Color(0xFF00CED1).withOpacity(0.3)
              : Colors.white.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: isSelected
              ? Border.all(color: const Color(0xFF00CED1))
              : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? const Color(0xFF00CED1) : Colors.white,
              size: 18,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDurationOptions() {
    return Container(
      height: 50,
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [15, 60, 180, 600].map((duration) {
          final label = duration < 60 ? '${duration}s' : '${duration ~/ 60}m';
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: ChoiceChip(
              label: Text(label),
              selected: widget.selectedDuration == duration,
              onSelected: (selected) {
                if (selected) {
                  widget.onDurationChanged(duration);
                  setState(() {
                    _showDurationOptions = false;
                  });
                }
              },
              backgroundColor: Colors.white.withOpacity(0.1),
              selectedColor: const Color(0xFF00CED1),
              labelStyle: TextStyle(
                color: widget.selectedDuration == duration
                    ? Colors.black
                    : Colors.white,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
  
  Widget _buildSpeedOptions() {
    return Container(
      height: 50,
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [0.3, 0.5, 1.0, 2.0, 3.0].map((speed) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: ChoiceChip(
              label: Text('${speed}x'),
              selected: widget.selectedSpeed == speed,
              onSelected: (selected) {
                if (selected) {
                  widget.onSpeedChanged(speed);
                  setState(() {
                    _showSpeedOptions = false;
                  });
                }
              },
              backgroundColor: Colors.white.withOpacity(0.1),
              selectedColor: const Color(0xFF00CED1),
              labelStyle: TextStyle(
                color: widget.selectedSpeed == speed
                    ? Colors.black
                    : Colors.white,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
  
  Widget _buildTimerOptions() {
    return Container(
      height: 50,
      margin: const EdgeInsets.symmetric(vertical: 10),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: [3, 10].map((seconds) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: ActionChip(
              label: Text('${seconds}s'),
              onPressed: () {
                widget.onTimerSelected(seconds);
                setState(() {
                  _showTimerOptions = false;
                });
              },
              backgroundColor: Colors.white.withOpacity(0.1),
              labelStyle: const TextStyle(color: Colors.white),
            ),
          );
        }).toList(),
      ),
    );
  }
  
  IconData _getFlashIcon() {
    switch (widget.flashMode) {
      case FlashMode.off:
        return Icons.flash_off;
      case FlashMode.auto:
        return Icons.flash_auto;
      case FlashMode.always:
        return Icons.flash_on;
      case FlashMode.torch:
        return Icons.highlight;
    }
  }
}