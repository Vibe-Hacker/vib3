import 'package:flutter/foundation.dart';

class PipelineState extends ChangeNotifier {
  // Video properties
  String? _videoPath;
  String? _thumbnailPath;
  Duration? _videoDuration;
  
  // Metadata
  String _description = '';
  List<String> _hashtags = [];
  String? _musicId;
  String? _musicName;
  
  // Effects applied
  Map<String, dynamic> _appliedEffects = {};
  
  // Upload settings
  bool _isPublic = true;
  bool _allowComments = true;
  bool _allowDuets = true;
  bool _allowStitches = true;
  
  // Getters
  String? get videoPath => _videoPath;
  String? get thumbnailPath => _thumbnailPath;
  Duration? get videoDuration => _videoDuration;
  String get description => _description;
  List<String> get hashtags => List.from(_hashtags);
  String? get musicId => _musicId;
  String? get musicName => _musicName;
  Map<String, dynamic> get appliedEffects => Map.from(_appliedEffects);
  bool get isPublic => _isPublic;
  bool get allowComments => _allowComments;
  bool get allowDuets => _allowDuets;
  bool get allowStitches => _allowStitches;
  
  // Setters
  void setVideoPath(String path) {
    _videoPath = path;
    notifyListeners();
  }
  
  void setThumbnailPath(String path) {
    _thumbnailPath = path;
    notifyListeners();
  }
  
  void setVideoDuration(Duration duration) {
    _videoDuration = duration;
    notifyListeners();
  }
  
  void updateDescription(String desc) {
    _description = desc;
    notifyListeners();
  }
  
  void addHashtag(String tag) {
    if (!_hashtags.contains(tag)) {
      _hashtags.add(tag);
      notifyListeners();
    }
  }
  
  void removeHashtag(String tag) {
    if (_hashtags.remove(tag)) {
      notifyListeners();
    }
  }
  
  void setMusic(String id, String name) {
    _musicId = id;
    _musicName = name;
    notifyListeners();
  }
  
  void addEffect(String effectType, dynamic effectData) {
    _appliedEffects[effectType] = effectData;
    notifyListeners();
  }
  
  void removeEffect(String effectType) {
    if (_appliedEffects.remove(effectType) != null) {
      notifyListeners();
    }
  }
  
  void updatePrivacySettings({
    bool? isPublic,
    bool? allowComments,
    bool? allowDuets,
    bool? allowStitches,
  }) {
    if (isPublic != null) _isPublic = isPublic;
    if (allowComments != null) _allowComments = allowComments;
    if (allowDuets != null) _allowDuets = allowDuets;
    if (allowStitches != null) _allowStitches = allowStitches;
    notifyListeners();
  }
  
  Map<String, dynamic> toJson() {
    return {
      'description': _description,
      'hashtags': _hashtags,
      'musicId': _musicId,
      'musicName': _musicName,
      'effects': _appliedEffects,
      'isPublic': _isPublic,
      'allowComments': _allowComments,
      'allowDuets': _allowDuets,
      'allowStitches': _allowStitches,
    };
  }
  
  void reset() {
    _videoPath = null;
    _thumbnailPath = null;
    _videoDuration = null;
    _description = '';
    _hashtags.clear();
    _musicId = null;
    _musicName = null;
    _appliedEffects.clear();
    _isPublic = true;
    _allowComments = true;
    _allowDuets = true;
    _allowStitches = true;
    notifyListeners();
  }
}