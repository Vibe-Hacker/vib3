import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/creation_state_provider.dart';

class GestureControlsModule extends StatefulWidget {
  const GestureControlsModule({super.key});
  
  @override
  State<GestureControlsModule> createState() => _GestureControlsModuleState();
}

class _GestureControlsModuleState extends State<GestureControlsModule> {
  bool _gesturesEnabled = false;
  
  // Gesture settings
  final Map<GestureType, GestureConfig> _gestures = {
    GestureType.peace: GestureConfig(
      name: 'Peace Sign',
      icon: '✌️',
      action: GestureAction.startRecording,
      enabled: true,
      sensitivity: 0.8,
    ),
    GestureType.thumbsUp: GestureConfig(
      name: 'Thumbs Up',
      icon: '👍',
      action: GestureAction.pauseRecording,
      enabled: true,
      sensitivity: 0.8,
    ),
    GestureType.openPalm: GestureConfig(
      name: 'Open Palm',
      icon: '✋',
      action: GestureAction.stopRecording,
      enabled: true,
      sensitivity: 0.8,
    ),
    GestureType.fist: GestureConfig(
      name: 'Fist',
      icon: '✊',
      action: GestureAction.switchCamera,
      enabled: false,
      sensitivity: 0.8,
    ),
    GestureType.wave: GestureConfig(
      name: 'Wave',
      icon: '👋',
      action: GestureAction.addEffect,
      enabled: false,
      sensitivity: 0.7,
    ),
    GestureType.fingerSnap: GestureConfig(
      name: 'Finger Snap',
      icon: '🫰',
      action: GestureAction.takePhoto,
      enabled: false,
      sensitivity: 0.9,
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
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Gesture Controls',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Switch(
                      value: _gesturesEnabled,
                      onChanged: (value) {
                        setState(() {
                          _gesturesEnabled = value;
                        });
                        HapticFeedback.lightImpact();
                      },
                      activeColor: const Color(0xFF00CED1),
                    ),
                  ],
                ),
                if (_gesturesEnabled) ...[
                  const SizedBox(height: 8),
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
                      children: const [
                        Icon(
                          Icons.camera_alt,
                          color: Color(0xFF00CED1),
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Front camera will track hand gestures',
                            style: TextStyle(
                              color: Color(0xFF00CED1),
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          
          // Gesture list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _gestures.length,
              itemBuilder: (context, index) {
                final gestureType = GestureType.values[index];
                final config = _gestures[gestureType]!;
                
                return _buildGestureItem(gestureType, config);
              },
            ),
          ),
          
          // Instructions
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'How to use gestures',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: Color(0xFF00CED1),
                      size: 16,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Hold gesture for 1 second to trigger',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: Color(0xFF00CED1),
                      size: 16,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Keep hand clearly visible in frame',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      color: Color(0xFF00CED1),
                      size: 16,
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Good lighting improves recognition',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildGestureItem(GestureType type, GestureConfig config) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: config.enabled && _gesturesEnabled
            ? const Color(0xFF00CED1).withOpacity(0.1)
            : Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: config.enabled && _gesturesEnabled
              ? const Color(0xFF00CED1).withOpacity(0.3)
              : Colors.transparent,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Gesture icon
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Center(
                  child: Text(
                    config.icon,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Gesture info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      config.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getActionDescription(config.action),
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Enable toggle
              Switch(
                value: config.enabled,
                onChanged: _gesturesEnabled
                    ? (value) {
                        setState(() {
                          config.enabled = value;
                        });
                      }
                    : null,
                activeColor: const Color(0xFF00CED1),
              ),
            ],
          ),
          
          // Sensitivity slider (only for enabled gestures)
          if (config.enabled && _gesturesEnabled) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Text(
                  'Sensitivity',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Slider(
                    value: config.sensitivity,
                    onChanged: (value) {
                      setState(() {
                        config.sensitivity = value;
                      });
                    },
                    activeColor: const Color(0xFF00CED1),
                    inactiveColor: Colors.white.withOpacity(0.2),
                  ),
                ),
                Text(
                  '${(config.sensitivity * 100).toInt()}%',
                  style: const TextStyle(
                    color: Color(0xFF00CED1),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
  
  String _getActionDescription(GestureAction action) {
    switch (action) {
      case GestureAction.startRecording:
        return 'Start recording video';
      case GestureAction.pauseRecording:
        return 'Pause/resume recording';
      case GestureAction.stopRecording:
        return 'Stop recording';
      case GestureAction.switchCamera:
        return 'Switch front/back camera';
      case GestureAction.addEffect:
        return 'Apply random effect';
      case GestureAction.takePhoto:
        return 'Capture photo';
    }
  }
}

// Data models
enum GestureType {
  peace,
  thumbsUp,
  openPalm,
  fist,
  wave,
  fingerSnap,
}

enum GestureAction {
  startRecording,
  pauseRecording,
  stopRecording,
  switchCamera,
  addEffect,
  takePhoto,
}

class GestureConfig {
  final String name;
  final String icon;
  final GestureAction action;
  bool enabled;
  double sensitivity;
  
  GestureConfig({
    required this.name,
    required this.icon,
    required this.action,
    required this.enabled,
    required this.sensitivity,
  });
}