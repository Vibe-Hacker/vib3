import 'package:flutter/material.dart';
import '../../app/theme/app_theme.dart';

class PlaceholderImage extends StatelessWidget {
  final double width;
  final double height;
  final String text;
  final Color? backgroundColor;
  final Color? textColor;
  
  const PlaceholderImage({
    Key? key,
    required this.width,
    required this.height,
    required this.text,
    this.backgroundColor,
    this.textColor,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            backgroundColor ?? AppTheme.primaryColor.withOpacity(0.8),
            backgroundColor?.withOpacity(0.6) ?? AppTheme.secondaryColor.withOpacity(0.8),
          ],
        ),
      ),
      child: Stack(
        children: [
          // Pattern overlay
          Positioned.fill(
            child: CustomPaint(
              painter: PatternPainter(),
            ),
          ),
          // Text
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.photo_outlined,
                  size: 48,
                  color: textColor ?? Colors.white.withOpacity(0.7),
                ),
                const SizedBox(height: 8),
                Text(
                  text,
                  style: TextStyle(
                    color: textColor ?? Colors.white.withOpacity(0.9),
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PatternPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    
    const spacing = 30.0;
    
    // Draw diagonal lines
    for (double i = -size.height; i < size.width + size.height; i += spacing) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class PlaceholderAvatar extends StatelessWidget {
  final double size;
  final String seed;
  
  const PlaceholderAvatar({
    Key? key,
    this.size = 40,
    required this.seed,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    // Generate color from seed
    final hash = seed.hashCode;
    final hue = (hash % 360).toDouble();
    final color = HSLColor.fromAHSL(1, hue, 0.7, 0.5).toColor();
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color.withOpacity(0.8),
            color.withOpacity(0.6),
          ],
        ),
      ),
      child: Center(
        child: Text(
          seed.isNotEmpty ? seed[0].toUpperCase() : '?',
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.4,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}