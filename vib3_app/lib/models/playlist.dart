import 'video.dart';

class Playlist {
  final String id;
  final String name;
  final String description;
  final String userId;
  final List<String> videoIds;
  final String? thumbnailUrl;
  final bool isPrivate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int videoCount;
  final int totalDuration; // in seconds
  final PlaylistType type;
  final List<String> tags;
  final String? coverImageUrl;
  final bool isCollaborative;
  final List<String> collaborators;
  
  const Playlist({
    required this.id,
    required this.name,
    required this.description,
    required this.userId,
    required this.videoIds,
    this.thumbnailUrl,
    required this.isPrivate,
    required this.createdAt,
    required this.updatedAt,
    required this.videoCount,
    required this.totalDuration,
    required this.type,
    required this.tags,
    this.coverImageUrl,
    required this.isCollaborative,
    required this.collaborators,
  });
  
  factory Playlist.fromJson(Map<String, dynamic> json) {
    return Playlist(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      userId: json['userId'] ?? '',
      videoIds: List<String>.from(json['videoIds'] ?? []),
      thumbnailUrl: json['thumbnailUrl'],
      isPrivate: json['isPrivate'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      videoCount: json['videoCount'] ?? 0,
      totalDuration: json['totalDuration'] ?? 0,
      type: PlaylistType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => PlaylistType.custom,
      ),
      tags: List<String>.from(json['tags'] ?? []),
      coverImageUrl: json['coverImageUrl'],
      isCollaborative: json['isCollaborative'] ?? false,
      collaborators: List<String>.from(json['collaborators'] ?? []),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'userId': userId,
      'videoIds': videoIds,
      'thumbnailUrl': thumbnailUrl,
      'isPrivate': isPrivate,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'videoCount': videoCount,
      'totalDuration': totalDuration,
      'type': type.name,
      'tags': tags,
      'coverImageUrl': coverImageUrl,
      'isCollaborative': isCollaborative,
      'collaborators': collaborators,
    };
  }
  
  Playlist copyWith({
    String? id,
    String? name,
    String? description,
    String? userId,
    List<String>? videoIds,
    String? thumbnailUrl,
    bool? isPrivate,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? videoCount,
    int? totalDuration,
    PlaylistType? type,
    List<String>? tags,
    String? coverImageUrl,
    bool? isCollaborative,
    List<String>? collaborators,
  }) {
    return Playlist(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      userId: userId ?? this.userId,
      videoIds: videoIds ?? this.videoIds,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      isPrivate: isPrivate ?? this.isPrivate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      videoCount: videoCount ?? this.videoCount,
      totalDuration: totalDuration ?? this.totalDuration,
      type: type ?? this.type,
      tags: tags ?? this.tags,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      isCollaborative: isCollaborative ?? this.isCollaborative,
      collaborators: collaborators ?? this.collaborators,
    );
  }
}

enum PlaylistType {
  custom,
  favorites,
  watchLater,
  liked,
  shared,
  collaborative,
}

class Collection {
  final String id;
  final String name;
  final String description;
  final String userId;
  final List<String> playlistIds;
  final String? thumbnailUrl;
  final bool isPrivate;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int playlistCount;
  final CollectionType type;
  final List<String> tags;
  
  const Collection({
    required this.id,
    required this.name,
    required this.description,
    required this.userId,
    required this.playlistIds,
    this.thumbnailUrl,
    required this.isPrivate,
    required this.createdAt,
    required this.updatedAt,
    required this.playlistCount,
    required this.type,
    required this.tags,
  });
  
  factory Collection.fromJson(Map<String, dynamic> json) {
    return Collection(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      userId: json['userId'] ?? '',
      playlistIds: List<String>.from(json['playlistIds'] ?? []),
      thumbnailUrl: json['thumbnailUrl'],
      isPrivate: json['isPrivate'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      playlistCount: json['playlistCount'] ?? 0,
      type: CollectionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => CollectionType.custom,
      ),
      tags: List<String>.from(json['tags'] ?? []),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'userId': userId,
      'playlistIds': playlistIds,
      'thumbnailUrl': thumbnailUrl,
      'isPrivate': isPrivate,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'playlistCount': playlistCount,
      'type': type.name,
      'tags': tags,
    };
  }
}

enum CollectionType {
  custom,
  favorites,
  archived,
  shared,
}