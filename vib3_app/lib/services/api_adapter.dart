import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../config/app_config.dart';

/// Adapter to handle API calls for both monolith and microservices
class ApiAdapter {
  static final ApiAdapter _instance = ApiAdapter._internal();
  factory ApiAdapter() => _instance;
  ApiAdapter._internal();
  
  String? _authToken;
  String? _serverIp;
  
  // Set the server IP dynamically
  void setServerIp(String ip) {
    _serverIp = ip;
  }
  
  // Get the current base URL
  String get baseUrl {
    if (_serverIp != null && ApiConfig.useMicroservices) {
      // Use HTTPS for production domains, HTTP for local IPs
      if (_serverIp.contains('.net') || _serverIp.contains('.com') || _serverIp.contains('.app')) {
        return 'https://$_serverIp';
      }
      return 'http://$_serverIp:4000'; // API Gateway for local development
    }
    return ApiConfig.useMicroservices ? ApiConfig.apiGatewayUrl : AppConfig.baseUrl;
  }
  
  // Set auth token
  void setAuthToken(String? token) {
    _authToken = token;
  }
  
  // Get headers with auth
  Map<String, String> get headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    
    return headers;
  }
  
  // Generic request method
  Future<http.Response> request(
    String method,
    String endpoint, {
    Map<String, String>? pathParams,
    Map<String, dynamic>? queryParams,
    Map<String, dynamic>? body,
    Map<String, String>? additionalHeaders,
  }) async {
    try {
      // Build URL
      String url;
      if (ApiConfig.useMicroservices) {
        url = ApiConfig.buildUrl(endpoint, params: pathParams);
      } else {
        // Fallback to monolith endpoints
        url = '$baseUrl${_getMonolithEndpoint(endpoint)}';
        if (pathParams != null) {
          pathParams.forEach((key, value) {
            url = url.replaceAll(':$key', value);
          });
        }
      }
      
      // Add query parameters
      if (queryParams != null && queryParams.isNotEmpty) {
        final queryString = Uri(queryParameters: queryParams.map((k, v) => MapEntry(k, v.toString()))).query;
        url += '?$queryString';
      }
      
      // Prepare headers
      final requestHeaders = {...headers};
      if (additionalHeaders != null) {
        requestHeaders.addAll(additionalHeaders);
      }
      
      // Make request
      http.Response response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(
            Uri.parse(url),
            headers: requestHeaders,
          ).timeout(ApiConfig.timeout);
          break;
          
        case 'POST':
          response = await http.post(
            Uri.parse(url),
            headers: requestHeaders,
            body: body != null ? json.encode(body) : null,
          ).timeout(
            endpoint.contains('upload') ? ApiConfig.uploadTimeout : ApiConfig.timeout,
          );
          break;
          
        case 'PUT':
          response = await http.put(
            Uri.parse(url),
            headers: requestHeaders,
            body: body != null ? json.encode(body) : null,
          ).timeout(ApiConfig.timeout);
          break;
          
        case 'DELETE':
          response = await http.delete(
            Uri.parse(url),
            headers: requestHeaders,
          ).timeout(ApiConfig.timeout);
          break;
          
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
      
      return response;
      
    } catch (e) {
      print('API Request Error: $e');
      rethrow;
    }
  }
  
  // Map microservice endpoints to monolith endpoints
  String _getMonolithEndpoint(String endpoint) {
    // Map new endpoints to old ones for backward compatibility
    final monolithMappings = {
      'login': AppConfig.loginEndpoint,
      'register': AppConfig.signupEndpoint,
      'videoFeed': AppConfig.videosEndpoint,
      'videoUpload': AppConfig.uploadEndpoint,
      'profile': AppConfig.profileEndpoint,
      // Add more mappings as needed
    };
    
    return monolithMappings[endpoint] ?? '/api/$endpoint';
  }
  
  // Convenience methods
  Future<http.Response> get(String endpoint, {
    Map<String, String>? pathParams,
    Map<String, dynamic>? queryParams,
  }) {
    return request('GET', endpoint, pathParams: pathParams, queryParams: queryParams);
  }
  
  Future<http.Response> post(String endpoint, {
    Map<String, String>? pathParams,
    Map<String, dynamic>? body,
  }) {
    return request('POST', endpoint, pathParams: pathParams, body: body);
  }
  
  Future<http.Response> put(String endpoint, {
    Map<String, String>? pathParams,
    Map<String, dynamic>? body,
  }) {
    return request('PUT', endpoint, pathParams: pathParams, body: body);
  }
  
  Future<http.Response> delete(String endpoint, {
    Map<String, String>? pathParams,
  }) {
    return request('DELETE', endpoint, pathParams: pathParams);
  }
  
  // Upload method with multipart support
  Future<http.StreamedResponse> uploadFile(
    String endpoint,
    String filePath, {
    Map<String, String>? fields,
    Map<String, String>? pathParams,
  }) async {
    try {
      String url;
      if (ApiConfig.useMicroservices) {
        url = ApiConfig.buildUrl(endpoint, params: pathParams);
      } else {
        url = '$baseUrl${AppConfig.uploadEndpoint}';
      }
      
      final request = http.MultipartRequest('POST', Uri.parse(url));
      request.headers.addAll(headers);
      
      if (fields != null) {
        request.fields.addAll(fields);
      }
      
      request.files.add(await http.MultipartFile.fromPath('video', filePath));
      
      return await request.send().timeout(ApiConfig.uploadTimeout);
      
    } catch (e) {
      print('Upload Error: $e');
      rethrow;
    }
  }
}