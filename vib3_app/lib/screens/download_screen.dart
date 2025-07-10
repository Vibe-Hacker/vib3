import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/video.dart';

class DownloadScreen extends StatefulWidget {
  final Video video;
  
  const DownloadScreen({
    super.key,
    required this.video,
  });
  
  @override
  State<DownloadScreen> createState() => _DownloadScreenState();
}

class _DownloadScreenState extends State<DownloadScreen> {
  DownloadQuality _selectedQuality = DownloadQuality.hd;
  bool _includeWatermark = true;
  WatermarkPosition _watermarkPosition = WatermarkPosition.bottomRight;
  double _watermarkOpacity = 0.8;
  bool _isDownloading = false;
  double _downloadProgress = 0.0;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Download Video',
          style: TextStyle(color: Colors.white),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Video preview
            Container(
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(
                      Icons.play_circle_outline,
                      color: Colors.white.withOpacity(0.5),
                      size: 64,
                    ),
                  ),
                  
                  // Watermark preview
                  if (_includeWatermark)
                    Positioned(
                      top: _watermarkPosition == WatermarkPosition.topLeft ||
                            _watermarkPosition == WatermarkPosition.topRight
                          ? 16
                          : null,
                      bottom: _watermarkPosition == WatermarkPosition.bottomLeft ||
                              _watermarkPosition == WatermarkPosition.bottomRight
                          ? 16
                          : null,
                      left: _watermarkPosition == WatermarkPosition.topLeft ||
                            _watermarkPosition == WatermarkPosition.bottomLeft
                          ? 16
                          : null,
                      right: _watermarkPosition == WatermarkPosition.topRight ||
                             _watermarkPosition == WatermarkPosition.bottomRight
                          ? 16
                          : null,
                      child: Opacity(
                        opacity: _watermarkOpacity,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Icon(
                                Icons.play_circle_filled,
                                color: Color(0xFF00CED1),
                                size: 16,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'VIB3',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Video info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.video.caption ?? 'Untitled Video',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        Icons.person,
                        color: Colors.white54,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '@${widget.video.username}',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Icon(
                        Icons.timer,
                        color: Colors.white54,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.video.duration}s',
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Quality selection
            const Text(
              'Download Quality',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            ...DownloadQuality.values.map((quality) => 
              RadioListTile<DownloadQuality>(
                value: quality,
                groupValue: _selectedQuality,
                onChanged: (value) {
                  setState(() {
                    _selectedQuality = value!;
                  });
                },
                title: Text(
                  _getQualityName(quality),
                  style: const TextStyle(color: Colors.white),
                ),
                subtitle: Text(
                  _getQualityDescription(quality),
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
                activeColor: const Color(0xFF00CED1),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Watermark settings
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'VIB3 Watermark',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Switch(
                        value: _includeWatermark,
                        onChanged: (value) {
                          setState(() {
                            _includeWatermark = value;
                          });
                        },
                        activeColor: const Color(0xFF00CED1),
                      ),
                    ],
                  ),
                  
                  if (_includeWatermark) ...[
                    const SizedBox(height: 16),
                    
                    // Position
                    const Text(
                      'Position',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 3,
                      children: WatermarkPosition.values.map((position) {
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _watermarkPosition = position;
                            });
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: _watermarkPosition == position
                                  ? const Color(0xFF00CED1).withOpacity(0.2)
                                  : Colors.white.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: _watermarkPosition == position
                                    ? const Color(0xFF00CED1)
                                    : Colors.transparent,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                _getPositionName(position),
                                style: TextStyle(
                                  color: _watermarkPosition == position
                                      ? const Color(0xFF00CED1)
                                      : Colors.white70,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Opacity
                    Row(
                      children: [
                        const Text(
                          'Opacity',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Slider(
                            value: _watermarkOpacity,
                            min: 0.3,
                            max: 1.0,
                            onChanged: (value) {
                              setState(() {
                                _watermarkOpacity = value;
                              });
                            },
                            activeColor: const Color(0xFF00CED1),
                            inactiveColor: Colors.white.withOpacity(0.2),
                          ),
                        ),
                        Text(
                          '${(_watermarkOpacity * 100).toInt()}%',
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
            ),
            
            const SizedBox(height: 30),
            
            // Download button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isDownloading ? null : _startDownload,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF00CED1),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  disabledBackgroundColor: Colors.grey[800],
                ),
                child: _isDownloading
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              value: _downloadProgress,
                              strokeWidth: 2,
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            '${(_downloadProgress * 100).toInt()}%',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.download),
                          SizedBox(width: 8),
                          Text(
                            'Download Video',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Info text
            Text(
              'Downloaded videos will be saved to your gallery',
              style: TextStyle(
                color: Colors.white.withOpacity(0.5),
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  String _getQualityName(DownloadQuality quality) {
    switch (quality) {
      case DownloadQuality.original:
        return 'Original Quality';
      case DownloadQuality.hd:
        return 'HD (720p)';
      case DownloadQuality.sd:
        return 'SD (480p)';
      case DownloadQuality.low:
        return 'Low (360p)';
    }
  }
  
  String _getQualityDescription(DownloadQuality quality) {
    switch (quality) {
      case DownloadQuality.original:
        return 'Best quality, largest file size';
      case DownloadQuality.hd:
        return 'Good quality, moderate file size';
      case DownloadQuality.sd:
        return 'Standard quality, smaller file size';
      case DownloadQuality.low:
        return 'Lower quality, smallest file size';
    }
  }
  
  String _getPositionName(WatermarkPosition position) {
    switch (position) {
      case WatermarkPosition.topLeft:
        return 'Top Left';
      case WatermarkPosition.topRight:
        return 'Top Right';
      case WatermarkPosition.bottomLeft:
        return 'Bottom Left';
      case WatermarkPosition.bottomRight:
        return 'Bottom Right';
    }
  }
  
  void _startDownload() {
    setState(() {
      _isDownloading = true;
      _downloadProgress = 0.0;
    });
    
    // Simulate download progress
    final timer = Stream.periodic(const Duration(milliseconds: 100), (i) => i);
    timer.take(100).listen((i) {
      setState(() {
        _downloadProgress = (i + 1) / 100;
      });
      
      if (_downloadProgress >= 1.0) {
        _completeDownload();
      }
    });
  }
  
  void _completeDownload() {
    setState(() {
      _isDownloading = false;
    });
    
    HapticFeedback.heavyImpact();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white),
            SizedBox(width: 8),
            Text('Video saved to gallery'),
          ],
        ),
        backgroundColor: Colors.green,
      ),
    );
    
    Navigator.pop(context);
  }
}

// Data models
enum DownloadQuality {
  original,
  hd,
  sd,
  low,
}

enum WatermarkPosition {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}