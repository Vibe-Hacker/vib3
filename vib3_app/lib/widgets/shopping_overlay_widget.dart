import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ShoppingOverlayWidget extends StatefulWidget {
  final List<ShoppingTag> shoppingTags;
  final Duration currentPosition;
  final Function(ShoppingTag) onProductTap;
  
  const ShoppingOverlayWidget({
    super.key,
    required this.shoppingTags,
    required this.currentPosition,
    required this.onProductTap,
  });
  
  @override
  State<ShoppingOverlayWidget> createState() => _ShoppingOverlayWidgetState();
}

class _ShoppingOverlayWidgetState extends State<ShoppingOverlayWidget> 
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  ShoppingTag? _expandedTag;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    );
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    // Get active tags based on current video position
    final activeTags = widget.shoppingTags.where((tag) {
      return widget.currentPosition.inSeconds >= tag.startTime &&
             widget.currentPosition.inSeconds <= tag.endTime;
    }).toList();
    
    if (activeTags.isEmpty && _expandedTag == null) {
      return const SizedBox.shrink();
    }
    
    return Stack(
      children: [
        // Shopping bag indicator
        if (activeTags.isNotEmpty)
          Positioned(
            bottom: 100,
            right: 16,
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _expandedTag = _expandedTag == null ? activeTags.first : null;
                });
                _animationController.forward(from: 0);
                HapticFeedback.lightImpact();
              },
              child: AnimatedBuilder(
                animation: _animationController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: 1.0 + (_scaleAnimation.value * 0.1),
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFFFF0080),
                            Color(0xFF00CED1),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00CED1).withOpacity(0.5),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          const Icon(
                            Icons.shopping_bag,
                            color: Colors.white,
                            size: 28,
                          ),
                          // Badge with product count
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              width: 20,
                              height: 20,
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  activeTags.length.toString(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        
        // Expanded product view
        if (_expandedTag != null)
          Positioned(
            bottom: 170,
            left: 16,
            right: 16,
            child: AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF00CED1).withOpacity(0.5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Shop this look',
                              style: TextStyle(
                                color: Color(0xFF00CED1),
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                setState(() {
                                  _expandedTag = null;
                                });
                              },
                              icon: const Icon(
                                Icons.close,
                                color: Colors.white54,
                                size: 20,
                              ),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: 12),
                        
                        // Products list
                        SizedBox(
                          height: 100,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: activeTags.length,
                            itemBuilder: (context, index) {
                              final tag = activeTags[index];
                              return GestureDetector(
                                onTap: () => widget.onProductTap(tag),
                                child: Container(
                                  width: 80,
                                  margin: const EdgeInsets.only(right: 12),
                                  child: Column(
                                    children: [
                                      // Product image
                                      Container(
                                        width: 60,
                                        height: 60,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[800],
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(
                                          Icons.shopping_bag,
                                          color: Colors.white54,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      // Price
                                      Text(
                                        '\$${tag.price.toStringAsFixed(2)}',
                                        style: const TextStyle(
                                          color: Color(0xFF00CED1),
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      // Product name
                                      Text(
                                        tag.productName,
                                        style: const TextStyle(
                                          color: Colors.white70,
                                          fontSize: 10,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        textAlign: TextAlign.center,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        
        // Product tags on video
        ...activeTags.map((tag) {
          if (tag.position != null && _expandedTag == null) {
            return Positioned(
              left: tag.position!.dx * MediaQuery.of(context).size.width,
              top: tag.position!.dy * MediaQuery.of(context).size.height,
              child: GestureDetector(
                onTap: () => widget.onProductTap(tag),
                child: AnimatedBuilder(
                  animation: _animationController,
                  builder: (context, child) {
                    return Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.8),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF00CED1),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.shopping_bag,
                            color: Color(0xFF00CED1),
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '\$${tag.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            );
          }
          return const SizedBox.shrink();
        }),
      ],
    );
  }
}

class ShoppingTag {
  final String productId;
  final String productName;
  final double price;
  final int startTime; // in seconds
  final int endTime; // in seconds
  final Offset? position; // relative position on screen (0-1)
  final String? affiliateLink;
  
  ShoppingTag({
    required this.productId,
    required this.productName,
    required this.price,
    required this.startTime,
    required this.endTime,
    this.position,
    this.affiliateLink,
  });
}