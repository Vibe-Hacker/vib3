import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../app/theme/app_theme.dart';
import '../../../core/widgets/placeholder_image.dart';

class PostCard extends StatefulWidget {
  final String postId;
  final String username;
  final String userAvatar;
  final String? location;
  final List<String> mediaUrls;
  final String caption;
  final int likes;
  final int comments;
  final String timeAgo;
  final bool isLiked;
  final bool isSaved;
  
  const PostCard({
    Key? key,
    required this.postId,
    required this.username,
    required this.userAvatar,
    this.location,
    required this.mediaUrls,
    required this.caption,
    required this.likes,
    required this.comments,
    required this.timeAgo,
    this.isLiked = false,
    this.isSaved = false,
  }) : super(key: key);
  
  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> with TickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _likeAnimationController;
  late AnimationController _doubleTapAnimationController;
  
  int _currentPage = 0;
  bool _isLiked = false;
  bool _isSaved = false;
  bool _showHeart = false;
  
  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _likeAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _doubleTapAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _isLiked = widget.isLiked;
    _isSaved = widget.isSaved;
  }
  
  @override
  void dispose() {
    _pageController.dispose();
    _likeAnimationController.dispose();
    _doubleTapAnimationController.dispose();
    super.dispose();
  }
  
  void _toggleLike() {
    setState(() {
      _isLiked = !_isLiked;
    });
    HapticFeedback.lightImpact();
    _likeAnimationController.forward().then((_) {
      _likeAnimationController.reverse();
    });
  }
  
  void _handleDoubleTap() {
    if (!_isLiked) {
      _toggleLike();
    }
    
    setState(() {
      _showHeart = true;
    });
    
    _doubleTapAnimationController.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 200), () {
        if (mounted) {
          setState(() {
            _showHeart = false;
          });
          _doubleTapAnimationController.reverse();
        }
      });
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          _buildHeader(),
          
          // Media
          _buildMedia(),
          
          // Actions
          _buildActions(),
          
          // Likes
          _buildLikes(),
          
          // Caption
          _buildCaption(),
          
          // Comments
          _buildComments(),
          
          // Time
          _buildTime(),
        ],
      ),
    );
  }
  
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          // Avatar
          GestureDetector(
            onTap: () {
              // TODO: Navigate to profile
            },
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [AppTheme.primaryColor, AppTheme.secondaryColor],
                ),
              ),
              padding: const EdgeInsets.all(1.5),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.backgroundColor,
                ),
                padding: const EdgeInsets.all(1.5),
                child: ClipOval(
                  child: widget.userAvatar.startsWith('http')
                      ? CachedNetworkImage(
                          imageUrl: widget.userAvatar,
                          fit: BoxFit.cover,
                          errorWidget: (context, url, error) => PlaceholderAvatar(
                            size: 32,
                            seed: widget.username,
                          ),
                        )
                      : PlaceholderAvatar(
                          size: 32,
                          seed: widget.username,
                        ),
                ),
              ),
            ),
          ),
          
          const SizedBox(width: 12),
          
          // Username & Location
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.username,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (widget.location != null)
                  Text(
                    widget.location!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white60,
                    ),
                  ),
              ],
            ),
          ),
          
          // More button
          IconButton(
            icon: const Icon(Icons.more_horiz),
            onPressed: () {
              // TODO: Show options
            },
          ),
        ],
      ),
    );
  }
  
  Widget _buildMedia() {
    return GestureDetector(
      onDoubleTap: _handleDoubleTap,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Images
          AspectRatio(
            aspectRatio: 1,
            child: PageView.builder(
              controller: _pageController,
              onPageChanged: (index) {
                setState(() {
                  _currentPage = index;
                });
              },
              itemCount: widget.mediaUrls.length,
              itemBuilder: (context, index) {
                return CachedNetworkImage(
                  imageUrl: widget.mediaUrls[index],
                  fit: BoxFit.cover,
                  placeholder: (context, url) => PlaceholderImage(
                    width: double.infinity,
                    height: double.infinity,
                    text: 'Loading...',
                  ),
                  errorWidget: (context, url, error) => PlaceholderImage(
                    width: double.infinity,
                    height: double.infinity,
                    text: 'Post ${index + 1}',
                  ),
                );
              },
            ),
          ),
          
          // Page indicator
          if (widget.mediaUrls.length > 1)
            Positioned(
              top: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_currentPage + 1}/${widget.mediaUrls.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          
          // Like animation
          if (_showHeart)
            ScaleTransition(
              scale: Tween<double>(
                begin: 0.5,
                end: 1.5,
              ).animate(
                CurvedAnimation(
                  parent: _doubleTapAnimationController,
                  curve: Curves.easeOut,
                ),
              ),
              child: FadeTransition(
                opacity: Tween<double>(
                  begin: 0.0,
                  end: 1.0,
                ).animate(
                  CurvedAnimation(
                    parent: _doubleTapAnimationController,
                    curve: Curves.easeOut,
                  ),
                ),
                child: const Icon(
                  Icons.favorite,
                  color: Colors.white,
                  size: 80,
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          // Like
          ScaleTransition(
            scale: Tween<double>(
              begin: 1.0,
              end: 1.2,
            ).animate(
              CurvedAnimation(
                parent: _likeAnimationController,
                curve: Curves.easeOut,
              ),
            ),
            child: IconButton(
              icon: Icon(
                _isLiked ? Icons.favorite : Icons.favorite_outline,
                color: _isLiked ? Colors.red : Colors.white,
              ),
              onPressed: _toggleLike,
            ),
          ),
          
          // Comment
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () {
              // TODO: Show comments
            },
          ),
          
          // Share
          IconButton(
            icon: const Icon(Icons.send_outlined),
            onPressed: () {
              // TODO: Share
            },
          ),
          
          const Spacer(),
          
          // Save
          IconButton(
            icon: Icon(
              _isSaved ? Icons.bookmark : Icons.bookmark_outline,
              color: _isSaved ? AppTheme.primaryColor : Colors.white,
            ),
            onPressed: () {
              setState(() {
                _isSaved = !_isSaved;
              });
              HapticFeedback.lightImpact();
            },
          ),
        ],
      ),
    );
  }
  
  Widget _buildLikes() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        '${widget.likes} likes',
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
  
  Widget _buildCaption() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: '${widget.username} ',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            TextSpan(
              text: widget.caption,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildComments() {
    if (widget.comments > 0) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: GestureDetector(
          onTap: () {
            // TODO: Show all comments
          },
          child: Text(
            'View all ${widget.comments} comments',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white60,
            ),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
  
  Widget _buildTime() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Text(
        widget.timeAgo,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Colors.white60,
        ),
      ),
    );
  }
}