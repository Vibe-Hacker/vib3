import 'user_model.dart';

enum PostType {
  photo,
  video,
  reel,
  story,
  text,
  poll,
  live,
}

enum MediaType {
  image,
  video,
  gif,
}

class Post {
  final String id;
  final String userId;
  final User? author;
  final PostType type;
  final String? caption;
  final List<PostMedia> media;
  final List<String> tags;
  final List<String> mentions;
  final String? location;
  final double? latitude;
  final double? longitude;
  final int likesCount;
  final int commentsCount;
  final int sharesCount;
  final int viewsCount;
  final bool isLiked;
  final bool isSaved;
  final bool commentsEnabled;
  final bool sharingEnabled;
  final String? soundId;
  final Sound? sound;
  final List<Comment>? topComments;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Post({
    required this.id,
    required this.userId,
    this.author,
    required this.type,
    this.caption,
    required this.media,
    this.tags = const [],
    this.mentions = const [],
    this.location,
    this.latitude,
    this.longitude,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.viewsCount = 0,
    this.isLiked = false,
    this.isSaved = false,
    this.commentsEnabled = true,
    this.sharingEnabled = true,
    this.soundId,
    this.sound,
    this.topComments,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as String,
      userId: json['userId'] as String,
      author: json['author'] != null ? User.fromJson(json['author']) : null,
      type: PostType.values.firstWhere(
        (e) => e.toString() == 'PostType.${json['type']}',
        orElse: () => PostType.photo,
      ),
      caption: json['caption'] as String?,
      media: (json['media'] as List<dynamic>?)
          ?.map((e) => PostMedia.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? [],
      mentions: (json['mentions'] as List<dynamic>?)?.cast<String>() ?? [],
      location: json['location'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      likesCount: json['likesCount'] as int? ?? 0,
      commentsCount: json['commentsCount'] as int? ?? 0,
      sharesCount: json['sharesCount'] as int? ?? 0,
      viewsCount: json['viewsCount'] as int? ?? 0,
      isLiked: json['isLiked'] as bool? ?? false,
      isSaved: json['isSaved'] as bool? ?? false,
      commentsEnabled: json['commentsEnabled'] as bool? ?? true,
      sharingEnabled: json['sharingEnabled'] as bool? ?? true,
      soundId: json['soundId'] as String?,
      sound: json['sound'] != null ? Sound.fromJson(json['sound']) : null,
      topComments: (json['topComments'] as List<dynamic>?)
          ?.map((e) => Comment.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'author': author?.toJson(),
      'type': type.toString().split('.').last,
      'caption': caption,
      'media': media.map((e) => e.toJson()).toList(),
      'tags': tags,
      'mentions': mentions,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'sharesCount': sharesCount,
      'viewsCount': viewsCount,
      'isLiked': isLiked,
      'isSaved': isSaved,
      'commentsEnabled': commentsEnabled,
      'sharingEnabled': sharingEnabled,
      'soundId': soundId,
      'sound': sound?.toJson(),
      'topComments': topComments?.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class PostMedia {
  final String id;
  final MediaType type;
  final String url;
  final String? thumbnailUrl;
  final int? width;
  final int? height;
  final double? duration;
  final double? aspectRatio;
  
  PostMedia({
    required this.id,
    required this.type,
    required this.url,
    this.thumbnailUrl,
    this.width,
    this.height,
    this.duration,
    this.aspectRatio,
  });
  
  factory PostMedia.fromJson(Map<String, dynamic> json) {
    return PostMedia(
      id: json['id'] as String,
      type: MediaType.values.firstWhere(
        (e) => e.toString() == 'MediaType.${json['type']}',
        orElse: () => MediaType.image,
      ),
      url: json['url'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      width: json['width'] as int?,
      height: json['height'] as int?,
      duration: (json['duration'] as num?)?.toDouble(),
      aspectRatio: (json['aspectRatio'] as num?)?.toDouble(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toString().split('.').last,
      'url': url,
      'thumbnailUrl': thumbnailUrl,
      'width': width,
      'height': height,
      'duration': duration,
      'aspectRatio': aspectRatio,
    };
  }
}

class Comment {
  final String id;
  final String postId;
  final String userId;
  final User? author;
  final String content;
  final int likesCount;
  final bool isLiked;
  final List<String> mentions;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<Comment>? replies;
  final int repliesCount;
  
  Comment({
    required this.id,
    required this.postId,
    required this.userId,
    this.author,
    required this.content,
    this.likesCount = 0,
    this.isLiked = false,
    this.mentions = const [],
    required this.createdAt,
    required this.updatedAt,
    this.replies,
    this.repliesCount = 0,
  });
  
  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as String,
      postId: json['postId'] as String,
      userId: json['userId'] as String,
      author: json['author'] != null ? User.fromJson(json['author']) : null,
      content: json['content'] as String,
      likesCount: json['likesCount'] as int? ?? 0,
      isLiked: json['isLiked'] as bool? ?? false,
      mentions: (json['mentions'] as List<dynamic>?)?.cast<String>() ?? [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      replies: (json['replies'] as List<dynamic>?)
          ?.map((e) => Comment.fromJson(e as Map<String, dynamic>))
          .toList(),
      repliesCount: json['repliesCount'] as int? ?? 0,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'postId': postId,
      'userId': userId,
      'author': author?.toJson(),
      'content': content,
      'likesCount': likesCount,
      'isLiked': isLiked,
      'mentions': mentions,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'replies': replies?.map((e) => e.toJson()).toList(),
      'repliesCount': repliesCount,
    };
  }
}

class Sound {
  final String id;
  final String name;
  final String artistName;
  final String? albumArt;
  final String audioUrl;
  final double duration;
  final int usageCount;
  final bool isOriginal;
  final String? originalCreatorId;
  final User? originalCreator;
  
  Sound({
    required this.id,
    required this.name,
    required this.artistName,
    this.albumArt,
    required this.audioUrl,
    required this.duration,
    this.usageCount = 0,
    this.isOriginal = false,
    this.originalCreatorId,
    this.originalCreator,
  });
  
  factory Sound.fromJson(Map<String, dynamic> json) {
    return Sound(
      id: json['id'] as String,
      name: json['name'] as String,
      artistName: json['artistName'] as String,
      albumArt: json['albumArt'] as String?,
      audioUrl: json['audioUrl'] as String,
      duration: (json['duration'] as num).toDouble(),
      usageCount: json['usageCount'] as int? ?? 0,
      isOriginal: json['isOriginal'] as bool? ?? false,
      originalCreatorId: json['originalCreatorId'] as String?,
      originalCreator: json['originalCreator'] != null 
          ? User.fromJson(json['originalCreator']) 
          : null,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'artistName': artistName,
      'albumArt': albumArt,
      'audioUrl': audioUrl,
      'duration': duration,
      'usageCount': usageCount,
      'isOriginal': isOriginal,
      'originalCreatorId': originalCreatorId,
      'originalCreator': originalCreator?.toJson(),
    };
  }
}

class Poll {
  final String id;
  final String question;
  final List<PollOption> options;
  final DateTime endsAt;
  final int totalVotes;
  final bool hasVoted;
  final String? votedOptionId;
  
  Poll({
    required this.id,
    required this.question,
    required this.options,
    required this.endsAt,
    this.totalVotes = 0,
    this.hasVoted = false,
    this.votedOptionId,
  });
  
  factory Poll.fromJson(Map<String, dynamic> json) {
    return Poll(
      id: json['id'] as String,
      question: json['question'] as String,
      options: (json['options'] as List<dynamic>)
          .map((e) => PollOption.fromJson(e as Map<String, dynamic>))
          .toList(),
      endsAt: DateTime.parse(json['endsAt'] as String),
      totalVotes: json['totalVotes'] as int? ?? 0,
      hasVoted: json['hasVoted'] as bool? ?? false,
      votedOptionId: json['votedOptionId'] as String?,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'question': question,
      'options': options.map((e) => e.toJson()).toList(),
      'endsAt': endsAt.toIso8601String(),
      'totalVotes': totalVotes,
      'hasVoted': hasVoted,
      'votedOptionId': votedOptionId,
    };
  }
}

class PollOption {
  final String id;
  final String text;
  final int votes;
  final double percentage;
  
  PollOption({
    required this.id,
    required this.text,
    this.votes = 0,
    this.percentage = 0,
  });
  
  factory PollOption.fromJson(Map<String, dynamic> json) {
    return PollOption(
      id: json['id'] as String,
      text: json['text'] as String,
      votes: json['votes'] as int? ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0,
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'votes': votes,
      'percentage': percentage,
    };
  }
}