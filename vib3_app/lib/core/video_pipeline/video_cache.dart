import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

class VideoCache {
  static final VideoCache _instance = VideoCache._internal();
  static VideoCache get instance => _instance;
  VideoCache._internal();

  static const String _cacheDir = 'vib3_video_cache';
  static const int _maxCacheSize = 500 * 1024 * 1024; // 500MB
  
  Directory? _cacheDirectory;

  Future<Directory> get cacheDirectory async {
    if (_cacheDirectory != null) return _cacheDirectory!;
    
    final tempDir = await getTemporaryDirectory();
    _cacheDirectory = Directory(path.join(tempDir.path, _cacheDir));
    
    if (!await _cacheDirectory!.exists()) {
      await _cacheDirectory!.create(recursive: true);
    }
    
    return _cacheDirectory!;
  }

  Future<String> generateTempPath(String extension) async {
    final dir = await cacheDirectory;
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return path.join(dir.path, 'vib3_temp_$timestamp.$extension');
  }

  Future<File> cacheVideo(String sourcePath, {String? customName}) async {
    final dir = await cacheDirectory;
    final file = File(sourcePath);
    
    if (!await file.exists()) {
      throw Exception('Source video does not exist');
    }
    
    final fileName = customName ?? path.basename(sourcePath);
    final cachedPath = path.join(dir.path, fileName);
    
    return await file.copy(cachedPath);
  }

  Future<void> clearOldCache() async {
    final dir = await cacheDirectory;
    final files = await dir.list().toList();
    
    // Sort by modification time
    files.sort((a, b) {
      final aTime = a.statSync().modified;
      final bTime = b.statSync().modified;
      return aTime.compareTo(bTime);
    });
    
    int totalSize = 0;
    final filesToDelete = <FileSystemEntity>[];
    
    // Calculate total size and mark old files for deletion
    for (final file in files) {
      if (file is File) {
        final size = await file.length();
        totalSize += size;
        
        if (totalSize > _maxCacheSize) {
          filesToDelete.add(file);
        }
      }
    }
    
    // Delete old files
    for (final file in filesToDelete) {
      try {
        await file.delete();
      } catch (e) {
        print('Failed to delete cache file: $e');
      }
    }
  }

  Future<void> clearAllCache() async {
    final dir = await cacheDirectory;
    
    try {
      await dir.delete(recursive: true);
      await dir.create(recursive: true);
    } catch (e) {
      print('Failed to clear cache: $e');
    }
  }

  Future<bool> exists(String fileName) async {
    final dir = await cacheDirectory;
    final file = File(path.join(dir.path, fileName));
    return await file.exists();
  }

  Future<File?> getFile(String fileName) async {
    final dir = await cacheDirectory;
    final file = File(path.join(dir.path, fileName));
    
    if (await file.exists()) {
      return file;
    }
    
    return null;
  }
}