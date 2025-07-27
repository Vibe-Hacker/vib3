import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:video_player/video_player.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../video/video_url_service.dart';
import '../../../app/constants/app_constants.dart';

/// Service for HLS (HTTP Live Streaming) support
/// Similar to TikTok's adaptive streaming implementation
class HLSStreamingService {
  static final HLSStreamingService _instance = HLSStreamingService._internal();
  factory HLSStreamingService() => _instance;
  HLSStreamingService._internal();
  
  final Dio _dio = Dio();
  
  // Cache for manifest files
  final Map<String, M3U8Manifest> _manifestCache = {};
  
  // Quality levels matching TikTok's approach
  static const Map<String, VideoQuality> qualityLevels = {
    '1080p': VideoQuality(resolution: '1920x1080', bitrate: 4000000),
    '720p': VideoQuality(resolution: '1280x720', bitrate: 2500000),
    '540p': VideoQuality(resolution: '960x540', bitrate: 1500000),
    '360p': VideoQuality(resolution: '640x360', bitrate: 800000),
  };
  
  /// Check if URL is HLS stream
  bool isHLSUrl(String url) {
    return url.contains('.m3u8') || url.contains('/hls/');
  }
  
  /// Get optimal HLS variant based on network conditions
  Future<String> getOptimalHLSVariant(String masterPlaylistUrl) async {
    try {
      // Check cache first
      if (_manifestCache.containsKey(masterPlaylistUrl)) {
        return _selectOptimalVariant(_manifestCache[masterPlaylistUrl]!);
      }
      
      // Download and parse master playlist
      final response = await _dio.get(masterPlaylistUrl);
      if (response.statusCode != 200) {
        return masterPlaylistUrl; // Fallback to original
      }
      
      final manifest = _parseM3U8(response.data.toString());
      _manifestCache[masterPlaylistUrl] = manifest;
      
      return _selectOptimalVariant(manifest);
    } catch (e) {
      print('⚠️ HLS: Error getting optimal variant: $e');
      return masterPlaylistUrl;
    }
  }
  
  /// Parse M3U8 playlist
  M3U8Manifest _parseM3U8(String content) {
    final lines = content.split('\n');
    final variants = <HLSVariant>[];
    
    for (int i = 0; i < lines.length; i++) {
      final line = lines[i].trim();
      
      if (line.startsWith('#EXT-X-STREAM-INF:')) {
        // Parse stream info
        final info = _parseStreamInfo(line);
        if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
          variants.add(HLSVariant(
            url: lines[i + 1].trim(),
            bandwidth: info['BANDWIDTH'] ?? 0,
            resolution: info['RESOLUTION'] ?? '',
            codecs: info['CODECS'] ?? '',
          ));
        }
      }
    }
    
    return M3U8Manifest(variants: variants);
  }
  
  /// Parse stream info line
  Map<String, dynamic> _parseStreamInfo(String line) {
    final info = <String, dynamic>{};
    final attributes = line.substring('#EXT-X-STREAM-INF:'.length).split(',');
    
    for (final attr in attributes) {
      final parts = attr.split('=');
      if (parts.length == 2) {
        final key = parts[0].trim();
        var value = parts[1].trim().replaceAll('"', '');
        
        if (key == 'BANDWIDTH') {
          info[key] = int.tryParse(value) ?? 0;
        } else {
          info[key] = value;
        }
      }
    }
    
    return info;
  }
  
  /// Select optimal variant based on network conditions
  String _selectOptimalVariant(M3U8Manifest manifest) {
    if (manifest.variants.isEmpty) {
      return '';
    }
    
    // Sort by bandwidth
    manifest.variants.sort((a, b) => a.bandwidth.compareTo(b.bandwidth));
    
    // TODO: Get actual network speed
    // For now, select middle quality
    final targetIndex = manifest.variants.length ~/ 2;
    return manifest.variants[targetIndex].url;
  }
  
  /// Create HLS URL from regular video URL
  String createHLSUrl(String videoUrl) {
    // Check if already HLS
    if (isHLSUrl(videoUrl)) {
      return videoUrl;
    }
    
    // Convert regular video URL to HLS format
    // This assumes your backend supports HLS conversion
    final baseUrl = AppConstants.baseUrl;
    
    // Extract video ID from URL
    final uri = Uri.parse(videoUrl);
    final pathSegments = uri.pathSegments;
    
    if (pathSegments.isNotEmpty) {
      final videoId = pathSegments.last.split('.').first;
      return '$baseUrl/hls/$videoId/master.m3u8';
    }
    
    return videoUrl; // Fallback
  }
  
  /// Prefetch HLS segments for smooth playback
  Future<void> prefetchHLSSegments(String playlistUrl, {int segmentCount = 3}) async {
    try {
      print('📥 HLS: Prefetching segments from $playlistUrl');
      
      // Download playlist
      final response = await _dio.get(playlistUrl);
      if (response.statusCode != 200) return;
      
      final lines = response.data.toString().split('\n');
      final segments = <String>[];
      
      // Extract segment URLs
      for (final line in lines) {
        if (!line.startsWith('#') && line.trim().isNotEmpty) {
          segments.add(line.trim());
        }
      }
      
      // Prefetch first few segments
      final toPrefetch = segments.take(segmentCount);
      for (final segment in toPrefetch) {
        final segmentUrl = _resolveUrl(segment, playlistUrl);
        _prefetchSegment(segmentUrl);
      }
      
    } catch (e) {
      print('⚠️ HLS: Error prefetching segments: $e');
    }
  }
  
  /// Resolve relative URLs
  String _resolveUrl(String url, String baseUrl) {
    if (url.startsWith('http')) {
      return url;
    }
    
    final base = Uri.parse(baseUrl);
    final resolved = base.resolve(url);
    return resolved.toString();
  }
  
  /// Prefetch individual segment
  Future<void> _prefetchSegment(String segmentUrl) async {
    try {
      // Just make a HEAD request to warm up the CDN cache
      await _dio.head(segmentUrl);
      print('✅ HLS: Prefetched segment: ${Uri.parse(segmentUrl).pathSegments.last}');
    } catch (e) {
      // Ignore errors - this is just optimization
    }
  }
  
  /// Clear manifest cache
  void clearCache() {
    _manifestCache.clear();
  }
}

/// M3U8 Manifest representation
class M3U8Manifest {
  final List<HLSVariant> variants;
  
  M3U8Manifest({required this.variants});
}

/// HLS Variant (quality level)
class HLSVariant {
  final String url;
  final int bandwidth;
  final String resolution;
  final String codecs;
  
  HLSVariant({
    required this.url,
    required this.bandwidth,
    required this.resolution,
    required this.codecs,
  });
}

/// Video quality definition
class VideoQuality {
  final String resolution;
  final int bitrate;
  
  const VideoQuality({
    required this.resolution,
    required this.bitrate,
  });
}