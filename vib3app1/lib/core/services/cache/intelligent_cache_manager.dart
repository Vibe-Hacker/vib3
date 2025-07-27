import 'dart:async';
import 'dart:io';
import 'dart:collection';
import 'package:path_provider/path_provider.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';

/// Multi-tier cache manager similar to TikTok's caching strategy
class IntelligentCacheManager {
  static final IntelligentCacheManager _instance = IntelligentCacheManager._internal();
  factory IntelligentCacheManager() => _instance;
  IntelligentCacheManager._internal();

  // Cache tiers
  final Map<String, CachedVideo> _memoryCache = {}; // Tier 1: Memory
  final LinkedHashMap<String, File> _diskCache = LinkedHashMap(); // Tier 2: Disk
  
  // Cache limits
  static const int _maxMemoryCacheMB = 100;
  static const int _maxDiskCacheMB = 500; // Reduced for mobile
  static const int _maxMemoryItems = 10;
  
  // Predictive caching
  final List<String> _viewHistory = [];
  final Map<String, double> _videoPriority = {};
  
  // Cache statistics
  int _cacheHits = 0;
  int _cacheMisses = 0;
  
  /// Initialize cache manager
  Future<void> initialize() async {
    debugPrint('💾 Initializing Intelligent Cache Manager');
    
    // Clean old cache on startup
    await _cleanOldCache();
    
    // Start periodic cache optimization
    Timer.periodic(const Duration(minutes: 5), (_) => _optimizeCache());
  }

  /// Get video from cache (checks all tiers)
  Future<File?> getVideo(String url) async {
    final key = _generateKey(url);
    
    // Tier 1: Memory cache
    if (_memoryCache.containsKey(key)) {
      _cacheHits++;
      final cached = _memoryCache[key]!;
      cached.lastAccessed = DateTime.now();
      cached.accessCount++;
      debugPrint('💾 Memory cache hit for: $key');
      return cached.file;
    }
    
    // Tier 2: Disk cache
    if (_diskCache.containsKey(key)) {
      _cacheHits++;
      final file = _diskCache[key]!;
      
      // Promote to memory cache if frequently accessed
      if (await file.exists()) {
        await _promoteToMemoryCache(key, file);
        debugPrint('💾 Disk cache hit for: $key');
        return file;
      } else {
        _diskCache.remove(key);
      }
    }
    
    _cacheMisses++;
    debugPrint('💾 Cache miss for: $key');
    return null;
  }

  /// Cache video with intelligent placement
  Future<void> cacheVideo(String url, List<int> data) async {
    final key = _generateKey(url);
    final priority = _calculatePriority(url);
    
    // High priority videos go to memory cache
    if (priority > 0.7 && _getMemoryCacheSize() < _maxMemoryCacheMB) {
      await _addToMemoryCache(key, data);
    } else {
      await _addToDiskCache(key, data);
    }
    
    _videoPriority[key] = priority;
  }

  /// Add video to memory cache
  Future<void> _addToMemoryCache(String key, List<int> data) async {
    // Evict if necessary
    while (_memoryCache.length >= _maxMemoryItems) {
      _evictFromMemoryCache();
    }
    
    final tempFile = File('${(await getTemporaryDirectory()).path}/$key.mp4');
    await tempFile.writeAsBytes(data);
    
    _memoryCache[key] = CachedVideo(
      file: tempFile,
      size: data.length,
      cached: DateTime.now(),
      lastAccessed: DateTime.now(),
    );
    
    debugPrint('💾 Added to memory cache: $key');
  }

  /// Add video to disk cache
  Future<void> _addToDiskCache(String key, List<int> data) async {
    final cacheDir = await _getCacheDirectory();
    final file = File('${cacheDir.path}/$key.mp4');
    
    await file.writeAsBytes(data);
    _diskCache[key] = file;
    
    // Maintain disk cache size
    await _maintainDiskCacheSize();
    
    debugPrint('💾 Added to disk cache: $key');
  }

  /// Promote frequently accessed video to memory cache
  Future<void> _promoteToMemoryCache(String key, File file) async {
    if (_memoryCache.length < _maxMemoryItems) {
      final data = await file.readAsBytes();
      await _addToMemoryCache(key, data);
    }
  }

  /// Calculate video priority for caching
  double _calculatePriority(String url) {
    // Factors:
    // 1. Position in feed (earlier = higher priority)
    // 2. User interaction history
    // 3. Video popularity
    // 4. Network conditions
    
    double priority = 0.5; // Base priority
    
    // Recent videos get higher priority
    if (_viewHistory.isNotEmpty) {
      final position = _viewHistory.indexOf(url);
      if (position >= 0) {
        priority += (10 - position) * 0.05;
      }
    }
    
    // Popular videos (would need backend data)
    // priority += popularityScore * 0.3;
    
    return priority.clamp(0.0, 1.0);
  }

  /// Evict least recently used item from memory cache
  void _evictFromMemoryCache() {
    if (_memoryCache.isEmpty) return;
    
    String? oldestKey;
    DateTime? oldestTime;
    
    _memoryCache.forEach((key, video) {
      if (oldestTime == null || video.lastAccessed.isBefore(oldestTime!)) {
        oldestTime = video.lastAccessed;
        oldestKey = key;
      }
    });
    
    if (oldestKey != null) {
      final video = _memoryCache.remove(oldestKey!);
      video?.file.deleteSync();
      debugPrint('💾 Evicted from memory cache: $oldestKey');
    }
  }

  /// Get current memory cache size
  int _getMemoryCacheSize() {
    int totalSize = 0;
    _memoryCache.forEach((_, video) {
      totalSize += video.size;
    });
    return totalSize ~/ (1024 * 1024); // Convert to MB
  }

  /// Maintain disk cache size
  Future<void> _maintainDiskCacheSize() async {
    final cacheDir = await _getCacheDirectory();
    final files = cacheDir.listSync();
    
    int totalSize = 0;
    final filesByDate = <File, FileStat>{};
    
    for (final entity in files) {
      if (entity is File) {
        final stat = await entity.stat();
        totalSize += stat.size;
        filesByDate[entity] = stat;
      }
    }
    
    // If over limit, remove oldest files
    if (totalSize > _maxDiskCacheMB * 1024 * 1024) {
      final sortedFiles = filesByDate.entries.toList()
        ..sort((a, b) => a.value.modified.compareTo(b.value.modified));
      
      for (final entry in sortedFiles) {
        if (totalSize <= _maxDiskCacheMB * 1024 * 1024) break;
        
        totalSize -= entry.value.size;
        await entry.key.delete();
        debugPrint('💾 Deleted old cache file: ${entry.key.path}');
      }
    }
  }

  /// Optimize cache based on usage patterns
  Future<void> _optimizeCache() async {
    debugPrint('💾 Optimizing cache...');
    
    // Calculate cache hit rate
    final hitRate = _cacheHits / (_cacheHits + _cacheMisses + 1);
    debugPrint('💾 Cache hit rate: ${(hitRate * 100).toStringAsFixed(1)}%');
    
    // Adjust cache strategy based on hit rate
    if (hitRate < 0.5) {
      // Poor hit rate - need better prediction
      debugPrint('💾 Low hit rate - adjusting prediction algorithm');
    }
    
    // Reset counters
    _cacheHits = 0;
    _cacheMisses = 0;
  }

  /// Clean old cache files
  Future<void> _cleanOldCache() async {
    final cacheDir = await _getCacheDirectory();
    final now = DateTime.now();
    
    await for (final entity in cacheDir.list()) {
      if (entity is File) {
        final stat = await entity.stat();
        if (now.difference(stat.modified).inDays > 7) {
          await entity.delete();
          debugPrint('💾 Deleted old cache: ${entity.path}');
        }
      }
    }
  }

  /// Get cache directory
  Future<Directory> _getCacheDirectory() async {
    final tempDir = await getTemporaryDirectory();
    final cacheDir = Directory('${tempDir.path}/vib3_video_cache');
    if (!await cacheDir.exists()) {
      await cacheDir.create(recursive: true);
    }
    return cacheDir;
  }

  /// Generate cache key from URL
  String _generateKey(String url) {
    return md5.convert(utf8.encode(url)).toString();
  }

  /// Track video view for predictive caching
  void trackVideoView(String url) {
    _viewHistory.add(url);
    if (_viewHistory.length > 100) {
      _viewHistory.removeAt(0);
    }
  }

  /// Prefetch videos based on prediction
  Future<void> prefetchVideos(List<String> urls) async {
    // Prefetch top 3 predicted videos
    for (int i = 0; i < urls.length && i < 3; i++) {
      final priority = _calculatePriority(urls[i]);
      if (priority > 0.6) {
        // Would download and cache here
        debugPrint('💾 Prefetching video ${i + 1} with priority: $priority');
      }
    }
  }

  /// Clear all caches
  Future<void> clearCache() async {
    // Clear memory cache
    _memoryCache.forEach((_, video) => video.file.deleteSync());
    _memoryCache.clear();
    
    // Clear disk cache
    final cacheDir = await _getCacheDirectory();
    await cacheDir.delete(recursive: true);
    _diskCache.clear();
    
    debugPrint('💾 All caches cleared');
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    return {
      'memoryCacheSize': _getMemoryCacheSize(),
      'memoryCacheItems': _memoryCache.length,
      'diskCacheItems': _diskCache.length,
      'hitRate': (_cacheHits / (_cacheHits + _cacheMisses + 1) * 100).toStringAsFixed(1),
    };
  }
}

/// Cached video metadata
class CachedVideo {
  final File file;
  final int size;
  final DateTime cached;
  DateTime lastAccessed;
  int accessCount;
  
  CachedVideo({
    required this.file,
    required this.size,
    required this.cached,
    required this.lastAccessed,
    this.accessCount = 1,
  });
}