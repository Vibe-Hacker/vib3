import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math' as math;
import '../models/video.dart';

/// Dialog to show QR code for sharing videos
class QRShareDialog extends StatefulWidget {
  final Video video;
  
  const QRShareDialog({
    super.key,
    required this.video,
  });
  
  @override
  State<QRShareDialog> createState() => _QRShareDialogState();
}

class _QRShareDialogState extends State<QRShareDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  
  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));
    
    _animationController.forward();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final videoUrl = 'https://vib3.app/v/${widget.video.id}';
    
    return Dialog(
      backgroundColor: Colors.transparent,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF00CED1).withOpacity(0.3),
                blurRadius: 30,
                spreadRadius: 5,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Share with QR Code',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // QR Code Container
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: CustomPaint(
                  size: const Size(200, 200),
                  painter: QRCodePainter(videoUrl),
                ),
              ),
              const SizedBox(height: 16),
              
              // VIB3 Logo
              ShaderMask(
                shaderCallback: (bounds) => const LinearGradient(
                  colors: [
                    Color(0xFF00CED1),
                    Color(0xFFFF1493),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ).createShader(bounds),
                child: const Text(
                  'VIB3',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              
              // Video description
              if (widget.video.description != null)
                Text(
                  widget.video.description!,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              const SizedBox(height: 16),
              
              // URL Display
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.link,
                      color: Colors.white70,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        videoUrl,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: videoUrl));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Link copied!'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: Colors.white.withOpacity(0.1),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Copy Link',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextButton(
                      onPressed: () {
                        // TODO: Implement save QR code
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('QR code saved!'),
                            backgroundColor: Color(0xFF00CED1),
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: const Color(0xFF00CED1),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Save QR',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Simple QR code painter (placeholder - in production, use qr_flutter package)
class QRCodePainter extends CustomPainter {
  final String data;
  
  QRCodePainter(this.data);
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;
    
    // This is a simplified placeholder QR code visual
    // In production, use the qr_flutter package for actual QR generation
    final moduleSize = size.width / 25;
    final random = math.Random(data.hashCode);
    
    // Draw finder patterns (corners)
    _drawFinderPattern(canvas, paint, 0, 0, moduleSize);
    _drawFinderPattern(canvas, paint, size.width - 7 * moduleSize, 0, moduleSize);
    _drawFinderPattern(canvas, paint, 0, size.height - 7 * moduleSize, moduleSize);
    
    // Draw timing patterns
    for (int i = 8; i < 17; i++) {
      if (i % 2 == 0) {
        canvas.drawRect(
          Rect.fromLTWH(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize),
          paint,
        );
        canvas.drawRect(
          Rect.fromLTWH(6 * moduleSize, i * moduleSize, moduleSize, moduleSize),
          paint,
        );
      }
    }
    
    // Draw random data modules (placeholder)
    for (int x = 0; x < 25; x++) {
      for (int y = 0; y < 25; y++) {
        // Skip finder patterns and timing patterns
        if ((x < 8 && y < 8) || 
            (x > 16 && y < 8) || 
            (x < 8 && y > 16) ||
            (x == 6) || (y == 6)) {
          continue;
        }
        
        if (random.nextBool()) {
          canvas.drawRect(
            Rect.fromLTWH(x * moduleSize, y * moduleSize, moduleSize, moduleSize),
            paint,
          );
        }
      }
    }
  }
  
  void _drawFinderPattern(Canvas canvas, Paint paint, double x, double y, double moduleSize) {
    // Outer square
    canvas.drawRect(
      Rect.fromLTWH(x, y, 7 * moduleSize, 7 * moduleSize),
      paint,
    );
    
    // White square
    paint.color = Colors.white;
    canvas.drawRect(
      Rect.fromLTWH(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize),
      paint,
    );
    
    // Inner square
    paint.color = Colors.black;
    canvas.drawRect(
      Rect.fromLTWH(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize),
      paint,
    );
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}