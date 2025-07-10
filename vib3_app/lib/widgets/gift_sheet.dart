import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/live_stream_service.dart';

class GiftSheet extends StatefulWidget {
  final String streamId;
  final Function(String giftType, int quantity) onGiftSent;
  
  const GiftSheet({
    super.key,
    required this.streamId,
    required this.onGiftSent,
  });
  
  @override
  State<GiftSheet> createState() => _GiftSheetState();
}

class _GiftSheetState extends State<GiftSheet> {
  String? _selectedGift;
  int _quantity = 1;
  bool _isSending = false;
  
  final List<Gift> _gifts = [
    Gift(
      id: 'rose',
      name: 'Rose',
      icon: '🌹',
      coins: 1,
      color: const Color(0xFFFF1493),
    ),
    Gift(
      id: 'heart',
      name: 'Heart',
      icon: '❤️',
      coins: 5,
      color: const Color(0xFFFF0080),
    ),
    Gift(
      id: 'star',
      name: 'Star',
      icon: '⭐',
      coins: 10,
      color: const Color(0xFFFFD700),
    ),
    Gift(
      id: 'rainbow',
      name: 'Rainbow',
      icon: '🌈',
      coins: 20,
      color: const Color(0xFF00CED1),
    ),
    Gift(
      id: 'fire',
      name: 'Fire',
      icon: '🔥',
      coins: 50,
      color: const Color(0xFFFF4500),
    ),
    Gift(
      id: 'diamond',
      name: 'Diamond',
      icon: '💎',
      coins: 100,
      color: const Color(0xFF40E0D0),
    ),
    Gift(
      id: 'crown',
      name: 'Crown',
      icon: '👑',
      coins: 500,
      color: const Color(0xFFFFD700),
    ),
    Gift(
      id: 'rocket',
      name: 'Rocket',
      icon: '🚀',
      coins: 1000,
      color: const Color(0xFF1E90FF),
    ),
  ];
  
  void _sendGift() async {
    if (_selectedGift == null) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    setState(() {
      _isSending = true;
    });
    
    HapticFeedback.mediumImpact();
    
    final success = await LiveStreamService.sendGift(
      streamId: widget.streamId,
      giftType: _selectedGift!,
      quantity: _quantity,
      token: token,
    );
    
    if (success && mounted) {
      widget.onGiftSent(_selectedGift!, _quantity);
      Navigator.pop(context);
    } else {
      setState(() {
        _isSending = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to send gift'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12),
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Title
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Send a gift',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: const [
                      Icon(
                        Icons.monetization_on,
                        color: Color(0xFFFFD700),
                        size: 18,
                      ),
                      SizedBox(width: 4),
                      Text(
                        '1,234', // Mock coin balance
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Gifts grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                childAspectRatio: 1,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _gifts.length,
              itemBuilder: (context, index) {
                final gift = _gifts[index];
                final isSelected = _selectedGift == gift.id;
                
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    setState(() {
                      _selectedGift = gift.id;
                    });
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? gift.color.withOpacity(0.3)
                          : Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? gift.color
                            : Colors.white.withOpacity(0.1),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          gift.icon,
                          style: const TextStyle(fontSize: 32),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          gift.name,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.monetization_on,
                              color: Color(0xFFFFD700),
                              size: 12,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              gift.coins.toString(),
                              style: const TextStyle(
                                color: Color(0xFFFFD700),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Quantity selector
          if (_selectedGift != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              child: Row(
                children: [
                  const Text(
                    'Quantity:',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(width: 16),
                  
                  // Quantity buttons
                  ...List.generate(5, (index) {
                    final qty = index + 1;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: GestureDetector(
                        onTap: () {
                          HapticFeedback.lightImpact();
                          setState(() {
                            _quantity = qty;
                          });
                        },
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: _quantity == qty
                                ? const Color(0xFFFF0080)
                                : Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: _quantity == qty
                                  ? const Color(0xFFFF0080)
                                  : Colors.white.withOpacity(0.2),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              qty.toString(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          
          // Send button
          Container(
            padding: const EdgeInsets.all(16),
            child: SafeArea(
              top: false,
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedGift == null || _isSending
                      ? null
                      : _sendGift,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF0080),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    disabledBackgroundColor: const Color(0xFFFF0080).withOpacity(0.5),
                  ),
                  child: _isSending
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'Send',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (_selectedGift != null) ...[
                              const SizedBox(width: 8),
                              Text(
                                '(${_gifts.firstWhere((g) => g.id == _selectedGift).coins * _quantity} coins)',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class Gift {
  final String id;
  final String name;
  final String icon;
  final int coins;
  final Color color;
  
  const Gift({
    required this.id,
    required this.name,
    required this.icon,
    required this.coins,
    required this.color,
  });
}