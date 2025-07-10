/// Model for video collections/favorites
class Collection {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final bool isPrivate;
  final List<String> videoIds;
  final String? coverImage;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  Collection({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    this.isPrivate = true,
    this.videoIds = const [],
    this.coverImage,
    required this.createdAt,
    required this.updatedAt,
  });
  
  factory Collection.fromJson(Map<String, dynamic> json) {
    return Collection(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      name: json['name'] ?? 'Untitled',
      description: json['description'],
      isPrivate: json['isPrivate'] ?? true,
      videoIds: List<String>.from(json['videoIds'] ?? []),
      coverImage: json['coverImage'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt']) 
          : DateTime.now(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'userId': userId,
      'name': name,
      'description': description,
      'isPrivate': isPrivate,
      'videoIds': videoIds,
      'coverImage': coverImage,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
  
  Collection copyWith({
    String? id,
    String? userId,
    String? name,
    String? description,
    bool? isPrivate,
    List<String>? videoIds,
    String? coverImage,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Collection(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      isPrivate: isPrivate ?? this.isPrivate,
      videoIds: videoIds ?? this.videoIds,
      coverImage: coverImage ?? this.coverImage,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}