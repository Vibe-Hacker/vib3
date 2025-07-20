import 'package:flutter/material.dart';

enum FilterType {
  none,
  vintage,
  dramatic,
  bright,
  black_and_white,
  sepia,
  vibrant,
  cool,
  warm,
  pink,
  blue,
  green,
  film,
  portrait,
  landscape,
  food,
  beauty,
  cinematic,
  retro,
  neon,
  sunset,
}

enum EffectType {
  none,
  slowMotion,
  speedUp,
  reverse,
  boomerang,
  glitch,
  mirror,
  split,
  green_screen,
  blur,
  zoom,
  shake,
  flash,
  fade,
  transition,
  particles,
  lightning,
  rain,
  snow,
  fire,
}

enum TextStyle {
  normal,
  bold,
  italic,
  outline,
  shadow,
  neon,
  typewriter,
  handwritten,
  futuristic,
  classic,
}

class VideoFilter {
  final FilterType type;
  final String name;
  final String thumbnailUrl;
  final double intensity;
  final Map<String, double> parameters;
  
  const VideoFilter({
    required this.type,
    required this.name,
    required this.thumbnailUrl,
    required this.intensity,
    required this.parameters,
  });
  
  factory VideoFilter.fromJson(Map<String, dynamic> json) {
    return VideoFilter(
      type: FilterType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => FilterType.none,
      ),
      name: json['name'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? '',
      intensity: (json['intensity'] ?? 1.0).toDouble(),
      parameters: Map<String, double>.from(json['parameters'] ?? {}),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'name': name,
      'thumbnailUrl': thumbnailUrl,
      'intensity': intensity,
      'parameters': parameters,
    };
  }
}

class VideoEffect {
  final EffectType type;
  final String name;
  final String iconUrl;
  final double intensity;
  final double startTime;
  final double endTime;
  final Map<String, dynamic> parameters;
  
  const VideoEffect({
    required this.type,
    required this.name,
    required this.iconUrl,
    required this.intensity,
    required this.startTime,
    required this.endTime,
    required this.parameters,
  });
  
  factory VideoEffect.fromJson(Map<String, dynamic> json) {
    return VideoEffect(
      type: EffectType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => EffectType.none,
      ),
      name: json['name'] ?? '',
      iconUrl: json['iconUrl'] ?? '',
      intensity: (json['intensity'] ?? 1.0).toDouble(),
      startTime: (json['startTime'] ?? 0.0).toDouble(),
      endTime: (json['endTime'] ?? 0.0).toDouble(),
      parameters: Map<String, dynamic>.from(json['parameters'] ?? {}),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'type': type.name,
      'name': name,
      'iconUrl': iconUrl,
      'intensity': intensity,
      'startTime': startTime,
      'endTime': endTime,
      'parameters': parameters,
    };
  }
}

class TextOverlay {
  final String id;
  final String text;
  final double x;
  final double y;
  final double width;
  final double height;
  final double fontSize;
  final String fontFamily;
  final TextStyle style;
  final Color color;
  final Color backgroundColor;
  final double opacity;
  final double rotation;
  final double startTime;
  final double endTime;
  final bool isAnimated;
  final String? animationType;
  
  const TextOverlay({
    required this.id,
    required this.text,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.fontSize,
    required this.fontFamily,
    required this.style,
    required this.color,
    required this.backgroundColor,
    required this.opacity,
    required this.rotation,
    required this.startTime,
    required this.endTime,
    required this.isAnimated,
    this.animationType,
  });
  
  factory TextOverlay.fromJson(Map<String, dynamic> json) {
    return TextOverlay(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      x: (json['x'] ?? 0.0).toDouble(),
      y: (json['y'] ?? 0.0).toDouble(),
      width: (json['width'] ?? 100.0).toDouble(),
      height: (json['height'] ?? 50.0).toDouble(),
      fontSize: (json['fontSize'] ?? 16.0).toDouble(),
      fontFamily: json['fontFamily'] ?? 'Arial',
      style: TextStyle.values.firstWhere(
        (e) => e.name == json['style'],
        orElse: () => TextStyle.normal,
      ),
      color: Color(json['color'] ?? 0xFFFFFFFF),
      backgroundColor: Color(json['backgroundColor'] ?? 0x00000000),
      opacity: (json['opacity'] ?? 1.0).toDouble(),
      rotation: (json['rotation'] ?? 0.0).toDouble(),
      startTime: (json['startTime'] ?? 0.0).toDouble(),
      endTime: (json['endTime'] ?? 0.0).toDouble(),
      isAnimated: json['isAnimated'] ?? false,
      animationType: json['animationType'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'x': x,
      'y': y,
      'width': width,
      'height': height,
      'fontSize': fontSize,
      'fontFamily': fontFamily,
      'style': style.name,
      'color': color.value,
      'backgroundColor': backgroundColor.value,
      'opacity': opacity,
      'rotation': rotation,
      'startTime': startTime,
      'endTime': endTime,
      'isAnimated': isAnimated,
      'animationType': animationType,
    };
  }
}

class AudioTrack {
  final String id;
  final String name;
  final String artist;
  final String url;
  final String thumbnailUrl;
  final double duration;
  final double startTime;
  final double endTime;
  final double volume;
  final bool isOriginal;
  final bool isTrending;
  final int usageCount;
  final List<String> genres;
  final String? mood;
  
  const AudioTrack({
    required this.id,
    required this.name,
    required this.artist,
    required this.url,
    required this.thumbnailUrl,
    required this.duration,
    required this.startTime,
    required this.endTime,
    required this.volume,
    required this.isOriginal,
    required this.isTrending,
    required this.usageCount,
    required this.genres,
    this.mood,
  });
  
  factory AudioTrack.fromJson(Map<String, dynamic> json) {
    return AudioTrack(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      artist: json['artist'] ?? '',
      url: json['url'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? '',
      duration: (json['duration'] ?? 0.0).toDouble(),
      startTime: (json['startTime'] ?? 0.0).toDouble(),
      endTime: (json['endTime'] ?? 0.0).toDouble(),
      volume: (json['volume'] ?? 1.0).toDouble(),
      isOriginal: json['isOriginal'] ?? false,
      isTrending: json['isTrending'] ?? false,
      usageCount: json['usageCount'] ?? 0,
      genres: List<String>.from(json['genres'] ?? []),
      mood: json['mood'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'artist': artist,
      'url': url,
      'thumbnailUrl': thumbnailUrl,
      'duration': duration,
      'startTime': startTime,
      'endTime': endTime,
      'volume': volume,
      'isOriginal': isOriginal,
      'isTrending': isTrending,
      'usageCount': usageCount,
      'genres': genres,
      'mood': mood,
    };
  }
}

class VideoEditingProject {
  final String id;
  final String videoUrl;
  final double duration;
  final double trimStart;
  final double trimEnd;
  final VideoFilter? filter;
  final List<VideoEffect> effects;
  final List<TextOverlay> textOverlays;
  final AudioTrack? audioTrack;
  final double videoVolume;
  final double audioVolume;
  final String? thumbnailUrl;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isExported;
  final String? exportedUrl;
  
  const VideoEditingProject({
    required this.id,
    required this.videoUrl,
    required this.duration,
    required this.trimStart,
    required this.trimEnd,
    this.filter,
    required this.effects,
    required this.textOverlays,
    this.audioTrack,
    required this.videoVolume,
    required this.audioVolume,
    this.thumbnailUrl,
    required this.createdAt,
    required this.updatedAt,
    required this.isExported,
    this.exportedUrl,
  });
  
  factory VideoEditingProject.fromJson(Map<String, dynamic> json) {
    return VideoEditingProject(
      id: json['id'] ?? '',
      videoUrl: json['videoUrl'] ?? '',
      duration: (json['duration'] ?? 0.0).toDouble(),
      trimStart: (json['trimStart'] ?? 0.0).toDouble(),
      trimEnd: (json['trimEnd'] ?? 0.0).toDouble(),
      filter: json['filter'] != null ? VideoFilter.fromJson(json['filter']) : null,
      effects: (json['effects'] as List? ?? [])
          .map((e) => VideoEffect.fromJson(e))
          .toList(),
      textOverlays: (json['textOverlays'] as List? ?? [])
          .map((e) => TextOverlay.fromJson(e))
          .toList(),
      audioTrack: json['audioTrack'] != null ? AudioTrack.fromJson(json['audioTrack']) : null,
      videoVolume: (json['videoVolume'] ?? 1.0).toDouble(),
      audioVolume: (json['audioVolume'] ?? 1.0).toDouble(),
      thumbnailUrl: json['thumbnailUrl'],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      isExported: json['isExported'] ?? false,
      exportedUrl: json['exportedUrl'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'videoUrl': videoUrl,
      'duration': duration,
      'trimStart': trimStart,
      'trimEnd': trimEnd,
      'filter': filter?.toJson(),
      'effects': effects.map((e) => e.toJson()).toList(),
      'textOverlays': textOverlays.map((t) => t.toJson()).toList(),
      'audioTrack': audioTrack?.toJson(),
      'videoVolume': videoVolume,
      'audioVolume': audioVolume,
      'thumbnailUrl': thumbnailUrl,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isExported': isExported,
      'exportedUrl': exportedUrl,
    };
  }
  
  VideoEditingProject copyWith({
    String? id,
    String? videoUrl,
    double? duration,
    double? trimStart,
    double? trimEnd,
    VideoFilter? filter,
    List<VideoEffect>? effects,
    List<TextOverlay>? textOverlays,
    AudioTrack? audioTrack,
    double? videoVolume,
    double? audioVolume,
    String? thumbnailUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isExported,
    String? exportedUrl,
  }) {
    return VideoEditingProject(
      id: id ?? this.id,
      videoUrl: videoUrl ?? this.videoUrl,
      duration: duration ?? this.duration,
      trimStart: trimStart ?? this.trimStart,
      trimEnd: trimEnd ?? this.trimEnd,
      filter: filter ?? this.filter,
      effects: effects ?? this.effects,
      textOverlays: textOverlays ?? this.textOverlays,
      audioTrack: audioTrack ?? this.audioTrack,
      videoVolume: videoVolume ?? this.videoVolume,
      audioVolume: audioVolume ?? this.audioVolume,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isExported: isExported ?? this.isExported,
      exportedUrl: exportedUrl ?? this.exportedUrl,
    );
  }
}