import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

/// Enhanced video caching with background pre-loading
/// Similar to TikTok's aggressive caching strategy
class EnhancedVideoCache {
  static final EnhancedVideoCache _instance = EnhancedVideoCache._internal();
  factory EnhancedVideoCache() => _instance;
  EnhancedVideoCache._internal();
  
  final Dio _dio = Dio();
  Directory? _cacheDir;
  
  // Cache settings
  final int _maxCacheSize = 500 * 1024 * 1024; // 500MB
  final int _maxConcurrentDownloads = 3;
  final Set<String> _downloading = {};
  final Map<String, double> _downloadProgress = {};
  
  // Priority queue for downloads
  final List<_DownloadTask> _downloadQueue = [];
  int _activeDownloads = 0;
  
  Future<void> initialize() async {
    final appDir = await getApplicationDocumentsDirectory();
    _cacheDir = Directory(path.join(appDir.path, 'video_cache'));
    if (!_cacheDir!.existsSync()) {
      _cacheDir!.createSync();
    }
    
    // Clean old cache on startup
    _cleanCache();
  }
  
  /// Get cached video path or start download
  Future<String?> getCachedVideo(String url, {int priority = 0}) async {
    final cacheKey = _getCacheKey(url);
    final cachedFile = File(path.join(_cacheDir!.path, cacheKey));
    
    // Return cached file if exists
    if (cachedFile.existsSync()) {
      // Update last accessed time
      cachedFile.setLastAccessedSync(DateTime.now());
      return cachedFile.path;
    }
    
    // Add to download queue with priority
    _queueDownload(url, priority);
    
    return null;
  }
  
  /// Pre-cache multiple videos
  void preCacheVideos(List<String> urls, {int startPriority = 10}) {
    for (int i = 0; i < urls.length; i++) {
      getCachedVideo(urls[i], priority: startPriority - i);
    }
  }
  
  /// Queue a download with priority
  void _queueDownload(String url, int priority) {
    if (_downloading.contains(url)) return;
    
    // Check if already queued
    if (_downloadQueue.any((task) => task.url == url)) return;
    
    _downloadQueue.add(_DownloadTask(url, priority));
    _downloadQueue.sort((a, b) => b.priority.compareTo(a.priority));
    
    _processQueue();
  }
  
  /// Process download queue
  void _processQueue() async {
    while (_activeDownloads < _maxConcurrentDownloads && _downloadQueue.isNotEmpty) {
      final task = _downloadQueue.removeAt(0);
      _activeDownloads++;
      
      _downloadVideo(task.url).whenComplete(() {
        _activeDownloads--;
        _processQueue(); // Process next in queue
      });
    }
  }
  
  /// Download video in background
  Future<void> _downloadVideo(String url) async {
    if (_downloading.contains(url)) return;
    
    _downloading.add(url);
    final cacheKey = _getCacheKey(url);
    final tempFile = File(path.join(_cacheDir!.path, '$cacheKey.tmp'));
    final targetFile = File(path.join(_cacheDir!.path, cacheKey));
    
    try {
      await _dio.download(
        url,
        tempFile.path,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            _downloadProgress[url] = received / total;
          }
        },
        options: Options(
          headers: {
            'User-Agent': 'VIB3/1.0',
          },
          receiveTimeout: Duration(seconds: 30),
        ),
      );
      
      // Rename temp file to final name
      if (tempFile.existsSync()) {
        tempFile.renameSync(targetFile.path);
      }
      
      // Clean cache if needed
      _cleanCache();
      
    } catch (e) {
      print('Failed to download video: $e');
      if (tempFile.existsSync()) {
        tempFile.deleteSync();
      }
    } finally {
      _downloading.remove(url);
      _downloadProgress.remove(url);
    }
  }
  
  /// Get download progress
  double? getDownloadProgress(String url) {
    return _downloadProgress[url];
  }
  
  /// Clean cache to stay under size limit
  void _cleanCache() async {
    if (_cacheDir == null) return;
    
    final files = _cacheDir!.listSync()
        .whereType<File>()
        .where((f) => !f.path.endsWith('.tmp'))
        .toList();
    
    // Calculate total size
    int totalSize = 0;
    final fileStats = <File, FileStat>{};
    
    for (final file in files) {
      final stat = file.statSync();
      fileStats[file] = stat;
      totalSize += stat.size;
    }
    
    // Remove oldest files if over limit
    if (totalSize > _maxCacheSize) {
      // Sort by last accessed time
      files.sort((a, b) {
        final statA = fileStats[a]!;
        final statB = fileStats[b]!;
        return statA.accessed.compareTo(statB.accessed);
      });
      
      // Delete oldest files
      for (final file in files) {
        if (totalSize <= _maxCacheSize) break;
        
        final stat = fileStats[file]!;
        totalSize -= stat.size;
        file.deleteSync();
      }
    }
  }
  
  /// Clear entire cache
  void clearCache() {
    if (_cacheDir?.existsSync() ?? false) {
      _cacheDir!.listSync().forEach((file) {
        if (file is File) {
          file.deleteSync();
        }
      });
    }
  }
  
  String _getCacheKey(String url) {
    // Simple hash for cache key
    final hash = url.hashCode.toUnsigned(32).toRadixString(16);
    final ext = path.extension(Uri.parse(url).path);
    return '$hash$ext';
  }
}

class _DownloadTask {
  final String url;
  final int priority;
  
  _DownloadTask(this.url, this.priority);
}