import 'package:flutter/material.dart';
import '../services/grok_service.dart';

class GrokAIAssistant extends StatefulWidget {
  final String? videoContext;
  final Function(String)? onDescriptionGenerated;
  final Function(List<String>)? onHashtagsGenerated;

  const GrokAIAssistant({
    super.key,
    this.videoContext,
    this.onDescriptionGenerated,
    this.onHashtagsGenerated,
  });

  @override
  State<GrokAIAssistant> createState() => _GrokAIAssistantState();
}

class _GrokAIAssistantState extends State<GrokAIAssistant> {
  bool _isGeneratingDescription = false;
  bool _isGeneratingHashtags = false;
  bool _isGeneratingIdeas = false;
  List<String> _videoIdeas = [];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [
            Color(0xFF1A1A1A),
            Color(0xFF2D2D2D),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF00CED1).withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF00CED1), Color(0xFF1E90FF)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.auto_awesome,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Grok AI Assistant',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // AI Features
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildAIButton(
                'Generate Description',
                Icons.description,
                _isGeneratingDescription,
                () => _generateDescription(),
              ),
              _buildAIButton(
                'Generate Hashtags',
                Icons.tag,
                _isGeneratingHashtags,
                () => _generateHashtags(),
              ),
              _buildAIButton(
                'Video Ideas',
                Icons.lightbulb,
                _isGeneratingIdeas,
                () => _generateVideoIdeas(),
              ),
            ],
          ),

          // Video Ideas Display
          if (_videoIdeas.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text(
              'AI Video Ideas:',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ..._videoIdeas.map((idea) => Container(
              margin: const EdgeInsets.only(bottom: 4),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFF00CED1).withOpacity(0.2),
                ),
              ),
              child: Text(
                idea,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                ),
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildAIButton(String title, IconData icon, bool isLoading, VoidCallback onTap) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isLoading ? Colors.grey[700] : const Color(0xFF00CED1).withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isLoading ? Colors.grey : const Color(0xFF00CED1),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isLoading)
              const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            else
              Icon(
                icon,
                color: Colors.white,
                size: 14,
              ),
            const SizedBox(width: 6),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _generateDescription() async {
    if (widget.videoContext == null) {
      _showMessage('Please add video context first');
      return;
    }

    setState(() {
      _isGeneratingDescription = true;
    });

    try {
      final description = await GrokService.generateVideoDescription(widget.videoContext!);
      if (widget.onDescriptionGenerated != null) {
        widget.onDescriptionGenerated!(description);
      }
      _showMessage('Description generated!');
    } catch (e) {
      _showMessage('Failed to generate description');
    } finally {
      setState(() {
        _isGeneratingDescription = false;
      });
    }
  }

  Future<void> _generateHashtags() async {
    if (widget.videoContext == null) {
      _showMessage('Please add video context first');
      return;
    }

    setState(() {
      _isGeneratingHashtags = true;
    });

    try {
      final hashtags = await GrokService.generateHashtags(widget.videoContext!);
      if (widget.onHashtagsGenerated != null) {
        widget.onHashtagsGenerated!(hashtags);
      }
      _showMessage('Hashtags generated!');
    } catch (e) {
      _showMessage('Failed to generate hashtags');
    } finally {
      setState(() {
        _isGeneratingHashtags = false;
      });
    }
  }

  Future<void> _generateVideoIdeas() async {
    setState(() {
      _isGeneratingIdeas = true;
    });

    try {
      final ideas = await GrokService.generateVideoIdeas('trending content, viral videos, social media');
      setState(() {
        _videoIdeas = ideas;
      });
      _showMessage('Video ideas generated!');
    } catch (e) {
      _showMessage('Failed to generate video ideas');
    } finally {
      setState(() {
        _isGeneratingIdeas = false;
      });
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF00CED1),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

class GrokInsightsWidget extends StatefulWidget {
  final String videoDescription;
  final int views;
  final int likes;
  final int comments;

  const GrokInsightsWidget({
    super.key,
    required this.videoDescription,
    required this.views,
    required this.likes,
    required this.comments,
  });

  @override
  State<GrokInsightsWidget> createState() => _GrokInsightsWidgetState();
}

class _GrokInsightsWidgetState extends State<GrokInsightsWidget> {
  Map<String, dynamic>? _insights;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadInsights();
  }

  Future<void> _loadInsights() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final insights = await GrokService.getContentInsights(
        widget.videoDescription,
        widget.views,
        widget.likes,
        widget.comments,
      );
      setState(() {
        _insights = insights;
      });
    } catch (e) {
      print('Error loading insights: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF00CED1)),
      );
    }

    if (_insights == null) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF00CED1).withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.analytics,
                color: Color(0xFF00CED1),
                size: 20,
              ),
              const SizedBox(width: 8),
              const Text(
                'AI Insights',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Performance Score
          Row(
            children: [
              const Text(
                'Performance Score: ',
                style: TextStyle(color: Colors.white70),
              ),
              Text(
                '${_insights!['performance_score']}/10',
                style: const TextStyle(
                  color: Color(0xFF00CED1),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          
          // Trending Potential
          Row(
            children: [
              const Text(
                'Trending Potential: ',
                style: TextStyle(color: Colors.white70),
              ),
              Text(
                _insights!['trending_potential'].toString().toUpperCase(),
                style: TextStyle(
                  color: _getTrendingColor(_insights!['trending_potential']),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Suggestions
          if (_insights!['suggestions'] != null) ...[
            const Text(
              'Suggestions:',
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            ...(_insights!['suggestions'] as List).map((suggestion) => 
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(color: Color(0xFF00CED1))),
                    Expanded(
                      child: Text(
                        suggestion,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _getTrendingColor(String potential) {
    switch (potential.toLowerCase()) {
      case 'high':
        return Colors.green;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}