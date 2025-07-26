import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/services/auth_service.dart';
import 'package:flutter_animate/flutter_animate.dart';

// Unique VIB3 Feature: Collab Rooms - Real-time collaborative content creation
class CollabRoomScreen extends StatefulWidget {
  const CollabRoomScreen({Key? key}) : super(key: key);

  @override
  State<CollabRoomScreen> createState() => _CollabRoomScreenState();
}

class _CollabRoomScreenState extends State<CollabRoomScreen>
    with TickerProviderStateMixin {
  final List<CollabRoom> _activeRooms = [
    CollabRoom(
      id: '1',
      name: 'Dance Battle Arena',
      participants: 12,
      maxParticipants: 16,
      theme: 'Dance',
      isLive: true,
      thumbnail: '',
    ),
    CollabRoom(
      id: '2',
      name: 'Art Fusion Studio',
      participants: 8,
      maxParticipants: 10,
      theme: 'Art',
      isLive: true,
      thumbnail: '',
    ),
    CollabRoom(
      id: '3',
      name: 'Music Jam Session',
      participants: 5,
      maxParticipants: 8,
      theme: 'Music',
      isLive: false,
      thumbnail: '',
    ),
  ];
  
  late AnimationController _pulseController;
  
  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Collab Rooms'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: _createNewRoom,
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(AppTheme.defaultPadding),
              decoration: BoxDecoration(
                gradient: AppTheme.pulseGradient,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Create Together',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Join live rooms and create content with others in real-time',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 600.ms).slideY(begin: -0.3, end: 0),
          ),
          
          // Quick join categories
          SliverToBoxAdapter(
            child: SizedBox(
              height: 120,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppTheme.defaultPadding),
                children: [
                  _buildCategoryChip('🎵 Music', AppTheme.primaryColor),
                  _buildCategoryChip('💃 Dance', AppTheme.secondaryColor),
                  _buildCategoryChip('🎨 Art', AppTheme.accentColor),
                  _buildCategoryChip('🎮 Gaming', Colors.green),
                  _buildCategoryChip('📚 Study', Colors.blue),
                  _buildCategoryChip('🍳 Cooking', Colors.orange),
                ].animate(interval: 100.ms).fadeIn().slideX(begin: 0.2, end: 0),
              ),
            ),
          ),
          
          // Active rooms
          SliverPadding(
            padding: const EdgeInsets.all(AppTheme.defaultPadding),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final room = _activeRooms[index];
                  return _buildRoomCard(room)
                      .animate()
                      .fadeIn(delay: (100 * index).ms)
                      .slideY(begin: 0.2, end: 0);
                },
                childCount: _activeRooms.length,
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _startInstantCollab,
        backgroundColor: AppTheme.primaryColor,
        icon: const Icon(Icons.flash_on),
        label: const Text('Instant Collab'),
      ).animate(
        onPlay: (controller) => controller.repeat(reverse: true),
      ).scaleXY(
        duration: 1.seconds,
        begin: 1.0,
        end: 1.05,
      ),
    );
  }
  
  Widget _buildCategoryChip(String label, Color color) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          // Filter by category
        },
        borderRadius: BorderRadius.circular(AppTheme.largeRadius),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(AppTheme.largeRadius),
            border: Border.all(
              color: color.withOpacity(0.5),
              width: 2,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label.split(' ')[0],
                style: const TextStyle(fontSize: 32),
              ),
              const SizedBox(height: 4),
              Text(
                label.split(' ')[1],
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildRoomCard(CollabRoom room) {
    final themeColor = _getRoomThemeColor(room.theme);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () => _joinRoom(room),
        borderRadius: BorderRadius.circular(AppTheme.defaultRadius),
        child: Container(
          height: 200,
          decoration: BoxDecoration(
            color: AppTheme.cardColor,
            borderRadius: BorderRadius.circular(AppTheme.defaultRadius),
            border: room.isLive
                ? Border.all(
                    color: themeColor,
                    width: 2,
                  )
                : null,
          ),
          child: Stack(
            children: [
              // Background gradient
              if (room.isLive)
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTheme.defaultRadius),
                      gradient: LinearGradient(
                        colors: [
                          themeColor.withOpacity(0.3),
                          Colors.transparent,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                ),
              
              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (room.isLive)
                          AnimatedBuilder(
                            animation: _pulseController,
                            builder: (context, child) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.red.withOpacity(
                                        0.5 + 0.3 * _pulseController.value,
                                      ),
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Text(
                                      'LIVE',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: themeColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            room.theme,
                            style: TextStyle(
                              color: themeColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Text(
                      room.name,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        // Participant avatars
                        SizedBox(
                          height: 32,
                          child: Stack(
                            children: List.generate(
                              room.participants.clamp(0, 4),
                              (index) => Positioned(
                                left: index * 20.0,
                                child: Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: themeColor.withOpacity(0.8),
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: AppTheme.backgroundColor,
                                      width: 2,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      '${index + 1}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 60),
                        Text(
                          '${room.participants}/${room.maxParticipants} creators',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.7),
                            fontSize: 14,
                          ),
                        ),
                        const Spacer(),
                        Icon(
                          Icons.arrow_forward_ios,
                          size: 16,
                          color: Colors.white.withOpacity(0.5),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Color _getRoomThemeColor(String theme) {
    switch (theme) {
      case 'Dance':
        return AppTheme.secondaryColor;
      case 'Art':
        return AppTheme.accentColor;
      case 'Music':
        return AppTheme.primaryColor;
      case 'Gaming':
        return Colors.green;
      case 'Study':
        return Colors.blue;
      case 'Cooking':
        return Colors.orange;
      default:
        return AppTheme.primaryColor;
    }
  }
  
  void _createNewRoom() {
    HapticFeedback.mediumImpact();
    // Navigate to create room screen
  }
  
  void _startInstantCollab() {
    HapticFeedback.heavyImpact();
    // Start instant collaboration
  }
  
  void _joinRoom(CollabRoom room) {
    HapticFeedback.selectionClick();
    // Navigate to room
  }
}

class CollabRoom {
  final String id;
  final String name;
  final int participants;
  final int maxParticipants;
  final String theme;
  final bool isLive;
  final String thumbnail;
  
  CollabRoom({
    required this.id,
    required this.name,
    required this.participants,
    required this.maxParticipants,
    required this.theme,
    required this.isLive,
    required this.thumbnail,
  });
}