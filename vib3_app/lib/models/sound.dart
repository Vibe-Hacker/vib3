class Sound {
  final String id;
  final String name;
  final String? artist;
  final String? url;
  final String? coverUrl;
  final int duration;
  final int useCount;
  final String? creatorId;
  final String? creatorUsername;
  final DateTime createdAt;
  
  Sound({
    required this.id,
    required this.name,
    this.artist,
    this.url,
    this.coverUrl,
    required this.duration,
    this.useCount = 0,
    this.creatorId,
    this.creatorUsername,
    required this.createdAt,
  });
  
  factory Sound.fromJson(Map<String, dynamic> json) {
    return Sound(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'Unknown Sound',
      artist: json['artist'],
      url: json['url'],
      coverUrl: json['coverUrl'],
      duration: json['duration'] ?? 0,
      useCount: json['useCount'] ?? 0,
      creatorId: json['creatorId'],
      creatorUsername: json['creatorUsername'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'artist': artist,
      'url': url,
      'coverUrl': coverUrl,
      'duration': duration,
      'useCount': useCount,
      'creatorId': creatorId,
      'creatorUsername': creatorUsername,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}