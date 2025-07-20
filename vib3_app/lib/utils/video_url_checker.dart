import 'package:http/http.dart' as http;

class VideoUrlChecker {
  static Future<Map<String, dynamic>> checkVideoUrl(String url) async {
    try {
      print('🔍 Checking video URL: $url');
      
      // First do a HEAD request to check if URL is accessible
      final headResponse = await http.head(
        Uri.parse(url),
        headers: {
          'User-Agent': 'VIB3-App/1.0',
          'Accept': '*/*',
        },
      ).timeout(const Duration(seconds: 5));
      
      print('📊 HEAD Response:');
      print('  Status: ${headResponse.statusCode}');
      print('  Content-Type: ${headResponse.headers['content-type']}');
      print('  Content-Length: ${headResponse.headers['content-length']}');
      print('  Server: ${headResponse.headers['server']}');
      
      // Check CORS headers
      print('🌐 CORS Headers:');
      print('  Access-Control-Allow-Origin: ${headResponse.headers['access-control-allow-origin']}');
      print('  Access-Control-Allow-Methods: ${headResponse.headers['access-control-allow-methods']}');
      
      // Try a partial GET request to check if range requests are supported
      final rangeResponse = await http.get(
        Uri.parse(url),
        headers: {
          'User-Agent': 'VIB3-App/1.0',
          'Accept': '*/*',
          'Range': 'bytes=0-1023', // First 1KB
        },
      ).timeout(const Duration(seconds: 5));
      
      print('📦 Range Request Response:');
      print('  Status: ${rangeResponse.statusCode}');
      print('  Accept-Ranges: ${rangeResponse.headers['accept-ranges']}');
      print('  Content-Range: ${rangeResponse.headers['content-range']}');
      
      return {
        'accessible': headResponse.statusCode == 200,
        'statusCode': headResponse.statusCode,
        'contentType': headResponse.headers['content-type'],
        'contentLength': headResponse.headers['content-length'],
        'corsEnabled': headResponse.headers['access-control-allow-origin'] != null,
        'rangeSupported': rangeResponse.statusCode == 206,
      };
    } catch (e) {
      print('❌ Error checking video URL: $e');
      return {
        'accessible': false,
        'error': e.toString(),
      };
    }
  }
}