import 'package:flutter/material.dart';
import '../../../services/speech_to_text_service.dart';

/// Widget to display auto-captions during recording and preview
class AutoCaptionsWidget extends StatefulWidget {
  final bool isRecording;
  final Function(List<Caption>)? onCaptionsGenerated;
  
  const AutoCaptionsWidget({
    super.key,
    required this.isRecording,
    this.onCaptionsGenerated,
  });
  
  @override
  State<AutoCaptionsWidget> createState() => _AutoCaptionsWidgetState();
}

class _AutoCaptionsWidgetState extends State<AutoCaptionsWidget> {
  final SpeechToTextService _speechService = SpeechToTextService();
  
  bool _captionsEnabled = false;
  bool _isInitializing = false;
  String _currentCaption = '';
  String _selectedLanguage = 'en_US';
  List<LocaleName> _availableLanguages = [];
  
  @override
  void initState() {
    super.initState();
    _loadAvailableLanguages();
  }
  
  @override
  void dispose() {
    if (_captionsEnabled) {
      _stopCaptions();
    }
    super.dispose();
  }
  
  @override
  void didUpdateWidget(AutoCaptionsWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Handle recording state changes
    if (oldWidget.isRecording != widget.isRecording) {
      if (widget.isRecording && _captionsEnabled) {
        _startCaptions();
      } else if (!widget.isRecording && _captionsEnabled) {
        _stopCaptions();
      }
    }
  }
  
  Future<void> _loadAvailableLanguages() async {
    final languages = await _speechService.getAvailableLanguages();
    if (mounted) {
      setState(() {
        _availableLanguages = languages;
      });
    }
  }
  
  Future<void> _toggleCaptions() async {
    if (_captionsEnabled) {
      await _stopCaptions();
    } else {
      await _enableCaptions();
    }
  }
  
  Future<void> _enableCaptions() async {
    setState(() {
      _isInitializing = true;
    });
    
    // Request permission
    final hasPermission = await _speechService.requestPermission();
    if (!hasPermission) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Microphone permission required for captions'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() {
        _isInitializing = false;
      });
      return;
    }
    
    // Initialize service
    final initialized = await _speechService.initialize();
    if (!initialized) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to initialize speech recognition'),
            backgroundColor: Colors.red,
          ),
        );
      }
      setState(() {
        _isInitializing = false;
      });
      return;
    }
    
    setState(() {
      _captionsEnabled = true;
      _isInitializing = false;
    });
    
    // Start captions if already recording
    if (widget.isRecording) {
      _startCaptions();
    }
  }
  
  Future<void> _startCaptions() async {
    if (!_captionsEnabled || !widget.isRecording) return;
    
    await _speechService.startListening(
      languageCode: _selectedLanguage,
      onLiveTextUpdated: (text) {
        if (mounted) {
          setState(() {
            _currentCaption = text;
          });
        }
      },
      onCaptionsUpdated: (captions) {
        widget.onCaptionsGenerated?.call(captions);
      },
    );
  }
  
  Future<void> _stopCaptions() async {
    final captions = await _speechService.stopListening();
    widget.onCaptionsGenerated?.call(captions);
    
    if (mounted) {
      setState(() {
        _currentCaption = '';
      });
    }
  }
  
  void _showLanguageSelector() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1A1A1A),
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[600],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Select Language',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _availableLanguages.length,
                itemBuilder: (context, index) {
                  final language = _availableLanguages[index];
                  final isSelected = language.id == _selectedLanguage;
                  
                  return ListTile(
                    title: Text(
                      language.name,
                      style: TextStyle(
                        color: isSelected ? const Color(0xFF00CED1) : Colors.white,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check, color: Color(0xFF00CED1))
                        : null,
                    onTap: () {
                      setState(() {
                        _selectedLanguage = language.id;
                      });
                      Navigator.pop(context);
                      
                      // Restart captions with new language
                      if (_captionsEnabled && widget.isRecording) {
                        _stopCaptions().then((_) => _startCaptions());
                      }
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Caption control button
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Row(
            children: [
              // Caption toggle button
              GestureDetector(
                onTap: _isInitializing ? null : _toggleCaptions,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _captionsEnabled
                        ? const Color(0xFF00CED1).withOpacity(0.3)
                        : Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: _captionsEnabled
                        ? Border.all(color: const Color(0xFF00CED1))
                        : null,
                  ),
                  child: Row(
                    children: [
                      if (_isInitializing)
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      else
                        Icon(
                          Icons.closed_caption,
                          color: _captionsEnabled
                              ? const Color(0xFF00CED1)
                              : Colors.white,
                          size: 18,
                        ),
                      const SizedBox(width: 8),
                      Text(
                        _captionsEnabled ? 'Captions On' : 'Auto Caption',
                        style: TextStyle(
                          color: _captionsEnabled
                              ? const Color(0xFF00CED1)
                              : Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              // Language selector
              if (_captionsEnabled) ...[
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _showLanguageSelector,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.language,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _selectedLanguage.split('_').first.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        
        // Live caption display
        if (_captionsEnabled && _currentCaption.isNotEmpty)
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 40, vertical: 10),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _currentCaption,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
                shadows: [
                  Shadow(
                    offset: Offset(1, 1),
                    blurRadius: 3,
                    color: Colors.black,
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }
}