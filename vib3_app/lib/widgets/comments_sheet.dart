import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../models/comment.dart';
import '../models/video.dart';
import '../providers/auth_provider.dart';
import '../services/comment_service.dart';

/// Bottom sheet for displaying and managing video comments
class CommentsSheet extends StatefulWidget {
  final Video video;
  
  const CommentsSheet({
    super.key,
    required this.video,
  });
  
  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  final TextEditingController _commentController = TextEditingController();
  final FocusNode _commentFocusNode = FocusNode();
  final ScrollController _scrollController = ScrollController();
  
  List<Comment> _comments = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _isSending = false;
  String? _replyingTo;
  Comment? _replyingToComment;
  
  // Sorting and filtering
  CommentSort _sortBy = CommentSort.newest;
  bool _showOnlyCreatorComments = false;
  
  @override
  void initState() {
    super.initState();
    _loadComments();
    _scrollController.addListener(_scrollListener);
  }
  
  @override
  void dispose() {
    _commentController.dispose();
    _commentFocusNode.dispose();
    _scrollController.dispose();
    super.dispose();
  }
  
  void _scrollListener() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreComments();
    }
  }
  
  Future<void> _loadComments() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    try {
      final comments = await CommentService.getVideoComments(
        widget.video.id,
        token,
        sortBy: _sortBy,
      );
      
      if (mounted) {
        setState(() {
          _comments = comments;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load comments')),
        );
      }
    }
  }
  
  Future<void> _loadMoreComments() async {
    if (_isLoadingMore || _comments.isEmpty) return;
    
    setState(() {
      _isLoadingMore = true;
    });
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    try {
      final moreComments = await CommentService.getVideoComments(
        widget.video.id,
        token,
        offset: _comments.length,
        sortBy: _sortBy,
      );
      
      if (mounted) {
        setState(() {
          _comments.addAll(moreComments);
          _isLoadingMore = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingMore = false;
        });
      }
    }
  }
  
  Future<void> _sendComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    final user = authProvider.currentUser;
    
    if (token == null || user == null) return;
    
    setState(() {
      _isSending = true;
    });
    
    try {
      final newComment = await CommentService.postComment(
        videoId: widget.video.id,
        text: text,
        token: token,
        parentId: _replyingToComment?.id,
      );
      
      if (newComment == null) {
        throw Exception('Failed to post comment');
      }
      
      if (mounted) {
        setState(() {
          if (_replyingToComment != null) {
            // Add reply to parent comment
            final parentIndex = _comments.indexWhere(
              (c) => c.id == _replyingToComment!.id
            );
            if (parentIndex != -1) {
              _comments[parentIndex].replies.insert(0, newComment);
            }
          } else {
            // Add new top-level comment
            _comments.insert(0, newComment);
          }
          
          _commentController.clear();
          _replyingTo = null;
          _replyingToComment = null;
          _isSending = false;
        });
        
        // Unfocus keyboard
        _commentFocusNode.unfocus();
        
        // Haptic feedback
        HapticFeedback.mediumImpact();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to post comment')),
        );
      }
    }
  }
  
  Future<void> _likeComment(Comment comment) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    // Optimistic update
    setState(() {
      comment.isLiked = !comment.isLiked;
      comment.likesCount += comment.isLiked ? 1 : -1;
    });
    
    try {
      await CommentService.likeComment(comment.id, token);
      HapticFeedback.lightImpact();
    } catch (e) {
      // Revert on error
      setState(() {
        comment.isLiked = !comment.isLiked;
        comment.likesCount += comment.isLiked ? 1 : -1;
      });
    }
  }
  
  Future<void> _deleteComment(Comment comment) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1A),
        title: const Text(
          'Delete Comment',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Are you sure you want to delete this comment?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
    
    if (confirmed != true) return;
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.authToken;
    
    if (token == null) return;
    
    // Optimistic delete
    setState(() {
      _comments.removeWhere((c) => c.id == comment.id);
      // Also remove from replies
      for (final c in _comments) {
        c.replies.removeWhere((r) => r.id == comment.id);
      }
    });
    
    try {
      await CommentService.deleteComment(comment.id, token);
      HapticFeedback.mediumImpact();
    } catch (e) {
      // Reload comments on error
      _loadComments();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to delete comment')),
      );
    }
  }
  
  void _showCommentOptions(Comment comment) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.currentUser?.id;
    final isOwnComment = currentUserId == comment.userId;
    final isVideoCreator = currentUserId == widget.video.userId;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1A1A1A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isOwnComment || isVideoCreator)
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _deleteComment(comment);
                },
              ),
            ListTile(
              leading: const Icon(Icons.copy, color: Colors.white),
              title: const Text(
                'Copy',
                style: TextStyle(color: Colors.white),
              ),
              onTap: () {
                Navigator.pop(context);
                Clipboard.setData(ClipboardData(text: comment.text));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Comment copied')),
                );
              },
            ),
            if (!isOwnComment)
              ListTile(
                leading: const Icon(Icons.flag, color: Colors.white),
                title: const Text(
                  'Report',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement report functionality
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Comment reported')),
                  );
                },
              ),
            if (isVideoCreator && !comment.isPinned)
              ListTile(
                leading: const Icon(Icons.push_pin, color: Colors.white),
                title: const Text(
                  'Pin comment',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Implement pin functionality
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Comment pinned')),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final currentUser = authProvider.currentUser;
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
            ),
            child: Row(
              children: [
                Text(
                  '${widget.video.commentsCount} Comments',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                
                // Sort button
                PopupMenuButton<CommentSort>(
                  initialValue: _sortBy,
                  onSelected: (value) {
                    setState(() {
                      _sortBy = value;
                    });
                    _loadComments();
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: CommentSort.newest,
                      child: Text('Newest first'),
                    ),
                    const PopupMenuItem(
                      value: CommentSort.mostLiked,
                      child: Text('Most liked'),
                    ),
                    const PopupMenuItem(
                      value: CommentSort.oldest,
                      child: Text('Oldest first'),
                    ),
                  ],
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.sort,
                          color: Colors.white,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _getSortLabel(_sortBy),
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
            ),
          ),
          
          // Comments list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF00CED1),
                    ),
                  )
                : _comments.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline,
                              size: 64,
                              color: Colors.white.withOpacity(0.3),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No comments yet',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.5),
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Be the first to comment!',
                              style: TextStyle(
                                color: Color(0xFF00CED1),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.only(bottom: 80),
                        itemCount: _comments.length + (_isLoadingMore ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index >= _comments.length) {
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(
                                  color: Color(0xFF00CED1),
                                ),
                              ),
                            );
                          }
                          
                          return _buildCommentItem(_comments[index]);
                        },
                      ),
          ),
          
          // Reply indicator
          if (_replyingTo != null)
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                border: Border(
                  top: BorderSide(
                    color: Colors.white.withOpacity(0.1),
                  ),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.reply,
                    color: Color(0xFF00CED1),
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Replying to $_replyingTo',
                      style: const TextStyle(
                        color: Color(0xFF00CED1),
                        fontSize: 12,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _replyingTo = null;
                        _replyingToComment = null;
                      });
                    },
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white54,
                      size: 16,
                    ),
                  ),
                ],
              ),
            ),
          
          // Comment input
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 8,
              bottom: MediaQuery.of(context).viewInsets.bottom + 8,
            ),
            decoration: BoxDecoration(
              color: Colors.black,
              border: Border(
                top: BorderSide(
                  color: Colors.white.withOpacity(0.1),
                ),
              ),
            ),
            child: Row(
              children: [
                // User avatar
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF00CED1), Color(0xFFFF1493)],
                    ),
                  ),
                  child: Center(
                    child: Text(
                      currentUser?.username[0].toUpperCase() ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                
                // Comment field
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    focusNode: _commentFocusNode,
                    maxLines: null,
                    maxLength: 500,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: _replyingTo != null 
                          ? 'Reply to $_replyingTo...'
                          : 'Add a comment...',
                      hintStyle: const TextStyle(color: Colors.white54),
                      border: InputBorder.none,
                      counterText: '',
                    ),
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendComment(),
                  ),
                ),
                
                // Send button
                IconButton(
                  onPressed: _isSending ? null : _sendComment,
                  icon: _isSending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Color(0xFF00CED1),
                            ),
                          ),
                        )
                      : const Icon(
                          Icons.send,
                          color: Color(0xFF00CED1),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCommentItem(Comment comment, {bool isReply = false}) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.currentUser?.id;
    final isOwnComment = currentUserId == comment.userId;
    final isVideoCreator = comment.userId == widget.video.userId;
    
    return GestureDetector(
      onLongPress: () => _showCommentOptions(comment),
      child: Container(
        padding: EdgeInsets.only(
          left: isReply ? 56 : 16,
          right: 16,
          top: 12,
          bottom: 12,
        ),
        decoration: BoxDecoration(
          color: comment.isPinned
              ? const Color(0xFF00CED1).withOpacity(0.05)
              : Colors.transparent,
          border: comment.isPinned
              ? Border(
                  left: BorderSide(
                    color: const Color(0xFF00CED1),
                    width: 3,
                  ),
                )
              : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User avatar
            GestureDetector(
              onTap: () {
                // TODO: Navigate to user profile
              },
              child: Container(
                width: isReply ? 28 : 36,
                height: isReply ? 28 : 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: isVideoCreator
                        ? [const Color(0xFFFFD700), const Color(0xFFFFA500)]
                        : [const Color(0xFF00CED1), const Color(0xFFFF1493)],
                  ),
                ),
                child: Center(
                  child: Text(
                    comment.username[0].toUpperCase(),
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: isReply ? 12 : 14,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            
            // Comment content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Username and badges
                  Row(
                    children: [
                      Text(
                        comment.username,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      if (isVideoCreator) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFD700),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'Creator',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                      if (comment.isPinned) ...[
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.push_pin,
                          color: Color(0xFF00CED1),
                          size: 14,
                        ),
                      ],
                      const SizedBox(width: 8),
                      Text(
                        timeago.format(comment.createdAt, locale: 'en'),
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  
                  // Comment text
                  Text(
                    comment.text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Actions
                  Row(
                    children: [
                      // Like button
                      GestureDetector(
                        onTap: () => _likeComment(comment),
                        child: Row(
                          children: [
                            Icon(
                              comment.isLiked
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: comment.isLiked
                                  ? Colors.red
                                  : Colors.white54,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              comment.likesCount.toString(),
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      
                      // Reply button
                      if (!isReply)
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _replyingTo = comment.username;
                              _replyingToComment = comment;
                            });
                            _commentFocusNode.requestFocus();
                          },
                          child: const Text(
                            'Reply',
                            style: TextStyle(
                              color: Colors.white54,
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                  
                  // Replies
                  if (comment.replies.isNotEmpty && !isReply) ...[
                    const SizedBox(height: 12),
                    ...comment.replies.map((reply) => 
                      _buildCommentItem(reply, isReply: true)
                    ),
                    if (comment.hasMoreReplies)
                      TextButton(
                        onPressed: () {
                          // TODO: Load more replies
                        },
                        child: Text(
                          'View ${comment.totalReplies - comment.replies.length} more replies',
                          style: const TextStyle(
                            color: Color(0xFF00CED1),
                            fontSize: 12,
                          ),
                        ),
                      ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  String _getSortLabel(CommentSort sort) {
    switch (sort) {
      case CommentSort.newest:
        return 'Newest';
      case CommentSort.mostLiked:
        return 'Top';
      case CommentSort.oldest:
        return 'Oldest';
    }
  }
}