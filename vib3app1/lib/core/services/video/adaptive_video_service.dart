import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:http/http.dart' as http;
import '../network/adaptive_streaming_service.dart';
import 'video_url_service.dart';
import '../../../app/constants/app_constants.dart';

/// Service for selecting optimal video quality based on device/network
class AdaptiveVideoService {
  final AdaptiveStreamingService _streamingService = AdaptiveStreamingService();
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  
  static final AdaptiveVideoService _instance = AdaptiveVideoService._internal();
  factory AdaptiveVideoService() => _instance;
  AdaptiveVideoService._internal();
  
  /// Video manifest containing all available variants
  Map<String, dynamic>? _currentManifest;
  
  /// Get optimal video URL based on current conditions
  Future<String> getOptimalVideoUrl(String baseUrl, {Map<String, dynamic>? manifest, bool fastMode = false}) async {
    try {
      // In fast mode (during fast scrolling), skip quality checks
      if (fastMode) {
        return baseUrl;
      }
      // First check if this is already a direct video file URL (ends with .mp4, etc)
      final uri = Uri.parse(baseUrl);
      final path = uri.path.toLowerCase();
      if (path.endsWith('.mp4') || path.endsWith('.m3u8') || path.endsWith('.webm')) {
        // This is already a direct video file, not a variant-enabled video
        print('🎥 Direct video URL detected, using as-is: $baseUrl');
        
        // Check if we need to use proxy for non-DigitalOcean videos
        if (!baseUrl.contains('digitaloceanspaces.com') && 
            !baseUrl.contains(AppConstants.baseUrl)) {
          // This video might have CORS issues, use proxy
          final proxiedUrl = VideoUrlService.getProxiedUrl(baseUrl);
          print('🔄 Using proxy for external video: $proxiedUrl');
          return proxiedUrl;
        }
        
        return baseUrl;
      }
      
      // If manifest provided, use it
      if (manifest != null) {
        _currentManifest = manifest;
      }
      
      // Only try to load manifest for videos that might have variants
      // Skip if it's a DigitalOcean Spaces URL (they don't have variants yet)
      if (_currentManifest == null && 
          !baseUrl.contains('digitaloceanspaces.com') && 
          !baseUrl.contains('.mp4')) {
        await _loadManifest(baseUrl);
      }
      
      // If still no manifest, return original URL
      if (_currentManifest == null || _currentManifest!['variants'] == null) {
        print('🎥 No variants available, using original URL');
        return baseUrl;
      }
      
      // Get device capabilities
      final capabilities = await _getDeviceCapabilities();
      
      // Select optimal variant
      final variant = _selectOptimalVariant(_currentManifest!['variants'], capabilities);
      
      // Build variant URL
      if (variant != null) {
        final variantUrl = _buildVariantUrl(baseUrl, variant);
        print('🎥 Selected video variant: ${variant['quality']} ${variant['codec']} for ${capabilities['connectionType']}');
        return variantUrl;
      }
      
      return baseUrl;
    } catch (e) {
      print('⚠️ AdaptiveVideoService: Falling back to original URL due to: $e');
      return baseUrl;
    }
  }
  
  /// Load video manifest
  Future<void> _loadManifest(String videoUrl) async {
    try {
      // Don't try to load manifest for direct video files
      if (videoUrl.contains('.mp4') || videoUrl.contains('digitaloceanspaces.com')) {
        return;
      }
      
      // Extract base path from video URL
      final uri = Uri.parse(videoUrl);
      final pathParts = uri.pathSegments;
      
      // For now, don't load manifests since they're not implemented on server yet
      // Just return to use original URL
      return;
      
      // TODO: When server implements manifest endpoints, uncomment this:
      /*
      if (pathParts.length >= 2 && pathParts[0] == 'videos') {
        // Construct manifest URL
        final manifestUrl = '${uri.scheme}://${uri.host}/uploads/videos/${pathParts[1]}/manifest.json';
        
        // Fetch manifest from server
        final response = await http.get(Uri.parse(manifestUrl))
            .timeout(const Duration(seconds: 2)); // Short timeout
            
        if (response.statusCode == 200) {
          _currentManifest = jsonDecode(response.body);
          print('📄 Loaded manifest with ${_currentManifest!['variants']?.length ?? 0} variants');
        }
      }
      */
    } catch (e) {
      // Silently fail - we'll use the original URL
      print('⚠️ Manifest not available: ${e.toString().split('\n').first}');
    }
  }
  
  /// Get device capabilities
  Future<Map<String, dynamic>> _getDeviceCapabilities() async {
    final connectivity = await Connectivity().checkConnectivity();
    final isWifi = connectivity.contains(ConnectivityResult.wifi);
    final isMobile = connectivity.contains(ConnectivityResult.mobile);
    
    // Determine connection type
    String connectionType = 'unknown';
    if (isWifi) {
      connectionType = 'wifi';
    } else if (isMobile) {
      // TODO: Detect 3G/4G/5G
      connectionType = '4g';
    }
    
    // Get device type
    String deviceType = 'mobile';
    
    return {
      'connectionType': connectionType,
      'deviceType': deviceType,
      'supportsH265': false, // TODO: Detect H.265 support
    };
  }
  
  /// Select optimal variant based on capabilities
  Map<String, dynamic>? _selectOptimalVariant(
    List<dynamic> variants,
    Map<String, dynamic> capabilities,
  ) {
    // Filter by codec support
    var availableVariants = variants.where((v) {
      if (!capabilities['supportsH265'] && v['codec'] == 'h265') {
        return false;
      }
      return true;
    }).toList();
    
    // Select target quality based on connection
    String targetQuality;
    switch (capabilities['connectionType']) {
      case 'wifi':
      case '5g':
        targetQuality = '1080p';
        break;
      case '4g':
        targetQuality = '720p';
        break;
      case '3g':
        targetQuality = '480p';
        break;
      default:
        targetQuality = '360p';
    }
    
    // Find matching variant
    var variant = availableVariants.firstWhere(
      (v) => v['quality'] == targetQuality,
      orElse: () => availableVariants.isNotEmpty ? availableVariants.last : null,
    );
    
    return variant;
  }
  
  /// Build variant URL
  String _buildVariantUrl(String baseUrl, Map<String, dynamic> variant) {
    try {
      final uri = Uri.parse(baseUrl);
      final pathParts = uri.pathSegments;
      
      if (pathParts.length >= 2 && pathParts[0] == 'videos') {
        // Extract video ID from path
        final videoId = pathParts[1].split('.')[0];
        
        // Build variant URL
        final variantPath = 'uploads/videos/${videoId.split('-')[0]}/${variant['filename']}';
        return '${uri.scheme}://${uri.host}/$variantPath';
      }
      
      return baseUrl;
    } catch (e) {
      return baseUrl;
    }
  }
  
  /// Preload video variants for smooth quality switching
  Future<void> preloadVariants(String videoUrl) async {
    try {
      await _loadManifest(videoUrl);
      
      if (_currentManifest != null && _currentManifest!['variants'] != null) {
        // TODO: Implement preloading logic
        print('📥 Preloading ${_currentManifest!['variants'].length} video variants');
      }
    } catch (e) {
      print('❌ Error preloading variants: $e');
    }
  }
}