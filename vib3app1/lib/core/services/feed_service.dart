import 'package:flutter/foundation.dart';
import 'api_service.dart';
import '../models/post_model.dart';
import '../models/user_model.dart';

class FeedService extends ChangeNotifier {
  final ApiService _apiService;
  
  List<Post> _homeFeed = [];
  List<Post> _reelsFeed = [];
  List<Post> _exploreFeed = [];
  Map<String, List<Post>> _userPosts = {};
  
  bool _isLoadingHome = false;
  bool _isLoadingReels = false;
  bool _isLoadingExplore = false;
  
  String? _nextHomeToken;
  String? _nextReelsToken;
  String? _nextExploreToken;
  
  List<Post> get homeFeed => _homeFeed;
  List<Post> get reelsFeed => _reelsFeed;
  List<Post> get exploreFeed => _exploreFeed;
  
  bool get isLoadingHome => _isLoadingHome;
  bool get isLoadingReels => _isLoadingReels;
  bool get isLoadingExplore => _isLoadingExplore;
  
  bool get hasMoreHome => _nextHomeToken != null;
  bool get hasMoreReels => _nextReelsToken != null;
  bool get hasMoreExplore => _nextExploreToken != null;
  
  FeedService(this._apiService) {
    // Initialize with mock data for development
    _initializeMockData();
  }
  
  void _initializeMockData() {
    final mockUser = User(
      id: 'user_1',
      username: 'creative_soul',
      email: 'user@example.com',
      displayName: 'Creative Soul',
      bio: '✨ Creating magic daily',
      profilePicture: 'user1',
      followersCount: 15234,
      followingCount: 892,
      postsCount: 143,
      isVerified: true,
      createdAt: DateTime.now().subtract(const Duration(days: 365)),
      updatedAt: DateTime.now(),
    );
    
    // Create diverse mock posts
    _homeFeed = List.generate(10, (index) {
      final type = index % 3 == 0 ? PostType.video : PostType.photo;
      return Post(
        id: 'post_home_$index',
        userId: mockUser.id,
        author: mockUser,
        type: type,
        caption: _generateMockCaption(index),
        media: [
          PostMedia(
            id: 'media_home_$index',
            type: type == PostType.video ? MediaType.video : MediaType.image,
            url: type == PostType.video 
                ? 'video_$index'
                : 'image_$index',
            thumbnailUrl: 'thumbnail_$index',
            aspectRatio: 0.67,
          ),
        ],
        tags: ['vib3', 'flutter', 'creative'],
        likesCount: 1000 + index * 234,
        commentsCount: 50 + index * 12,
        sharesCount: 10 + index * 5,
        viewsCount: 5000 + index * 1000,
        isLiked: index % 3 == 0,
        isSaved: index % 5 == 0,
        createdAt: DateTime.now().subtract(Duration(hours: index)),
        updatedAt: DateTime.now().subtract(Duration(hours: index)),
      );
    });
    
    // Create reels/video feed
    _reelsFeed = List.generate(20, (index) {
      return Post(
        id: 'reel_$index',
        userId: 'user_${index % 5}',
        author: User(
          id: 'user_${index % 5}',
          username: 'creator_${index % 5}',
          email: 'creator${index % 5}@example.com',
          displayName: 'Creator ${index % 5}',
          bio: '🎬 Video creator',
          profilePicture: 'user${index % 5}',
          followersCount: 50000 + index * 1000,
          followingCount: 234,
          postsCount: 89,
          isVerified: index % 3 == 0,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
        type: PostType.reel,
        caption: _generateReelCaption(index),
        media: [
          PostMedia(
            id: 'reel_media_$index',
            type: MediaType.video,
            url: 'reel_video_$index',
            thumbnailUrl: 'reel_thumbnail_$index',
            aspectRatio: 0.5625, // 9:16
            duration: 15 + (index % 45).toDouble(),
          ),
        ],
        tags: ['reels', 'vib3', 'trending', 'fyp'],
        sound: Sound(
          id: 'sound_${index % 10}',
          name: _getMockSoundName(index),
          artistName: _getMockArtistName(index),
          albumArt: 'sound_${index % 10}',
          audioUrl: 'https://example.com/sound_${index % 10}.mp3',
          duration: 30.0,
          usageCount: 10000 + index * 500,
          isOriginal: index % 5 == 0,
        ),
        likesCount: 10000 + index * 2500,
        commentsCount: 500 + index * 50,
        sharesCount: 100 + index * 20,
        viewsCount: 50000 + index * 10000,
        isLiked: index % 4 == 0,
        isSaved: index % 6 == 0,
        createdAt: DateTime.now().subtract(Duration(hours: index * 2)),
        updatedAt: DateTime.now().subtract(Duration(hours: index * 2)),
      );
    });
    
    notifyListeners();
  }
  
  String _generateMockCaption(int index) {
    final captions = [
      "Living my best life ✨ #vib3 #lifestyle",
      "Coffee and creativity ☕️💡",
      "Sunset vibes 🌅 Who else loves golden hour?",
      "New day, new possibilities 🌟",
      "Work in progress... stay tuned! 🎨",
      "Weekend mood activated 🎉",
      "Behind the scenes of today's shoot 📸",
      "Nature therapy 🌿 Where's your favorite escape?",
      "Making memories one day at a time 📷",
      "Good vibes only ✌️ #positivity",
    ];
    return captions[index % captions.length];
  }
  
  String _generateReelCaption(int index) {
    final captions = [
      "Wait for it... 😱 #viral #vib3",
      "POV: You discovered this amazing hack 🤯",
      "This trend but make it ✨aesthetic✨",
      "Day in my life as a content creator 📱",
      "You won't believe what happened next...",
      "Tutorial: How to level up your content 🚀",
      "Replying to @user: Here's how it's done!",
      "Things that live rent free in my head",
      "Rating viral food hacks 🍕 Which one wins?",
      "Outfit ideas for this season 👗",
    ];
    return captions[index % captions.length];
  }
  
  String _getMockVideoUrl(int index) {
    // Using Flutter's sample video which should work better
    return 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4';
  }
  
  String _getMockSoundName(int index) {
    final sounds = [
      "Trending Beat",
      "Chill Vibes",
      "Epic Moment",
      "Dance Challenge",
      "Emotional Piano",
      "Summer Hits",
      "Retro Wave",
      "Lo-fi Study",
      "Party Anthem",
      "Acoustic Sessions",
    ];
    return sounds[index % sounds.length];
  }
  
  String _getMockArtistName(int index) {
    final artists = [
      "DJ Vibe",
      "The Creators",
      "Sound Master",
      "Beat Maker Pro",
      "Audio Dreams",
      "Rhythm Nation",
      "Studio Sessions",
      "Music Lab",
      "Sound Factory",
      "Original Sounds",
    ];
    return artists[index % artists.length];
  }
  
  // API Methods (to be implemented with backend)
  
  Future<void> loadHomeFeed({bool refresh = false}) async {
    if (_isLoadingHome) return;
    
    try {
      _setLoadingHome(true);
      
      if (refresh) {
        _homeFeed.clear();
        _nextHomeToken = null;
      }
      
      // TODO: Implement actual API call
      // final response = await _apiService.get<Map<String, dynamic>>(
      //   '/feed/home',
      //   queryParameters: {
      //     if (_nextHomeToken != null) 'nextToken': _nextHomeToken,
      //   },
      // );
      
      // For now, just add more mock data
      await Future.delayed(const Duration(seconds: 1));
      
      notifyListeners();
    } catch (e) {
      print('Error loading home feed: $e');
    } finally {
      _setLoadingHome(false);
    }
  }
  
  Future<void> loadReelsFeed({bool refresh = false}) async {
    if (_isLoadingReels) return;
    
    try {
      _setLoadingReels(true);
      
      if (refresh) {
        _reelsFeed.clear();
        _nextReelsToken = null;
      }
      
      // TODO: Implement actual API call
      await Future.delayed(const Duration(seconds: 1));
      
      notifyListeners();
    } catch (e) {
      print('Error loading reels feed: $e');
    } finally {
      _setLoadingReels(false);
    }
  }
  
  Future<void> likePost(String postId) async {
    final postIndex = _homeFeed.indexWhere((p) => p.id == postId);
    if (postIndex != -1) {
      final post = _homeFeed[postIndex];
      _homeFeed[postIndex] = Post(
        id: post.id,
        userId: post.userId,
        author: post.author,
        type: post.type,
        caption: post.caption,
        media: post.media,
        tags: post.tags,
        mentions: post.mentions,
        location: post.location,
        latitude: post.latitude,
        longitude: post.longitude,
        likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        viewsCount: post.viewsCount,
        isLiked: !post.isLiked,
        isSaved: post.isSaved,
        commentsEnabled: post.commentsEnabled,
        sharingEnabled: post.sharingEnabled,
        soundId: post.soundId,
        sound: post.sound,
        topComments: post.topComments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      );
      notifyListeners();
    }
    
    // TODO: Make API call
    // await _apiService.post('/posts/$postId/like');
  }
  
  Future<void> savePost(String postId) async {
    // Similar to likePost
    // TODO: Implement
  }
  
  Future<void> deletePost(String postId) async {
    _homeFeed.removeWhere((p) => p.id == postId);
    _reelsFeed.removeWhere((p) => p.id == postId);
    notifyListeners();
    
    // TODO: Make API call
    // await _apiService.delete('/posts/$postId');
  }
  
  void _setLoadingHome(bool value) {
    _isLoadingHome = value;
    notifyListeners();
  }
  
  void _setLoadingReels(bool value) {
    _isLoadingReels = value;
    notifyListeners();
  }
  
  void _setLoadingExplore(bool value) {
    _isLoadingExplore = value;
    notifyListeners();
  }
}