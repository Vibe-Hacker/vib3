import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../app/theme/app_theme.dart';

class MainScreen extends StatefulWidget {
  final StatefulNavigationShell navigationShell;
  
  const MainScreen({
    Key? key,
    required this.navigationShell,
  }) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with TickerProviderStateMixin {
  late AnimationController _fabAnimationController;
  late AnimationController _borderAnimationController;
  late AnimationController _vibeAnimationController;
  
  @override
  void initState() {
    super.initState();
    _fabAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _borderAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
    _vibeAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }
  
  @override
  void dispose() {
    _fabAnimationController.dispose();
    _borderAnimationController.dispose();
    _vibeAnimationController.dispose();
    super.dispose();
  }
  
  void _onItemTapped(int index) {
    // Special handling for camera tab
    if (index == 2) {
      HapticFeedback.lightImpact();
      context.push('/camera');
      return;
    }
    
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final currentIndex = widget.navigationShell.currentIndex;
    
    return Scaffold(
      body: widget.navigationShell,
      extendBody: true,
      floatingActionButton: _buildCameraFAB(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: _buildBottomNavBar(currentIndex),
    );
  }
  
  Widget _buildCameraFAB() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.push('/camera');
      },
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppTheme.pulseGradient,
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryColor.withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: const Icon(
          Icons.add_rounded,
          color: Colors.white,
          size: 32,
        ),
      ).animate(
        onPlay: (controller) => controller.repeat(reverse: true),
      ).scale(
        duration: const Duration(seconds: 2),
        begin: const Offset(1, 1),
        end: const Offset(1.05, 1.05),
      ),
    );
  }
  
  Widget _buildBottomNavBar(int currentIndex) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor.withOpacity(0.95),
        border: Border(
          top: BorderSide(
            color: Colors.white.withOpacity(0.1),
            width: 0.5,
          ),
        ),
      ),
      child: ClipRRect(
        child: BackdropFilter(
          filter: ColorFilter.mode(
            Colors.black.withOpacity(0.1),
            BlendMode.darken,
          ),
          child: BottomAppBar(
            color: Colors.transparent,
            elevation: 0,
            notchMargin: 8,
            shape: const CircularNotchedRectangle(),
            child: SizedBox(
              height: 65,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(
                    index: 0,
                    currentIndex: currentIndex,
                    icon: Icons.home_rounded,
                    activeIcon: Icons.home_rounded,
                    label: 'Home',
                  ),
                  _buildNavItem(
                    index: 1,
                    currentIndex: currentIndex,
                    icon: Icons.search_rounded,
                    activeIcon: Icons.search_rounded,
                    label: 'Discover',
                  ),
                  const SizedBox(width: 56), // Space for FAB
                  _buildNavItem(
                    index: 3,
                    currentIndex: currentIndex,
                    icon: Icons.group_work_outlined,
                    activeIcon: Icons.group_work,
                    label: 'Collab',
                  ),
                  _buildNavItem(
                    index: 4,
                    currentIndex: currentIndex,
                    icon: Icons.person_outline_rounded,
                    activeIcon: Icons.person_rounded,
                    label: 'Profile',
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildNavItem({
    required int index,
    required int currentIndex,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = index == currentIndex;
    
    return Expanded(
      child: InkWell(
        onTap: () => _onItemTapped(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              decoration: isSelected
                  ? BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    )
                  : null,
              child: Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? AppTheme.primaryColor : Colors.white54,
                size: 26,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? AppTheme.primaryColor : Colors.white54,
              ),
            ),
          ],
        ).animate(target: isSelected ? 1 : 0).scaleXY(
          end: 1.1,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        ),
      ),
    );
  }
}