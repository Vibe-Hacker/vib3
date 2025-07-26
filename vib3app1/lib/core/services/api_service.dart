import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:vib3app1/app/constants/app_constants.dart';
import 'storage_service.dart';

class ApiService {
  late final Dio _dio;
  late final StorageService _storage;
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: '${AppConstants.baseUrl}${AppConstants.apiVersion}',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    _setupInterceptors();
  }
  
  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token to requests
          final token = await StorageService.getAuthToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          
          print('REQUEST[${options.method}] => PATH: ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (error, handler) {
          print('ERROR[${error.response?.statusCode}] => PATH: ${error.requestOptions.path}');
          
          // Handle common errors
          if (error.response?.statusCode == 401) {
            // Token expired or invalid
            _handleAuthError();
          }
          
          return handler.next(error);
        },
      ),
    );
  }
  
  void _handleAuthError() {
    // Clear auth data and redirect to login
    StorageService.clearAuthData();
    // Navigate to login screen (implement navigation service)
  }
  
  // Generic request methods
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<T> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  Future<T> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // File upload
  Future<T> uploadFile<T>(
    String path,
    File file, {
    String fieldName = 'file',
    Map<String, dynamic>? data,
    Function(int, int)? onSendProgress,
  }) async {
    try {
      final fileName = file.path.split('/').last;
      final formData = FormData.fromMap({
        fieldName: await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        ...?data,
      });
      
      final response = await _dio.post<T>(
        path,
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
        onSendProgress: onSendProgress,
      );
      
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Multiple file upload
  Future<T> uploadFiles<T>(
    String path,
    List<File> files, {
    String fieldName = 'files',
    Map<String, dynamic>? data,
    Function(int, int)? onSendProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        ...?data,
      });
      
      for (var file in files) {
        final fileName = file.path.split('/').last;
        formData.files.add(
          MapEntry(
            fieldName,
            await MultipartFile.fromFile(
              file.path,
              filename: fileName,
            ),
          ),
        );
      }
      
      final response = await _dio.post<T>(
        path,
        data: formData,
        options: Options(
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        ),
        onSendProgress: onSendProgress,
      );
      
      return response.data!;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Download file
  Future<void> downloadFile(
    String url,
    String savePath, {
    Function(int, int)? onReceiveProgress,
  }) async {
    try {
      await _dio.download(
        url,
        savePath,
        onReceiveProgress: onReceiveProgress,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }
  
  // Error handling
  Exception _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TimeoutException('Connection timeout');
        
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;
        
        if (data is Map<String, dynamic> && data.containsKey('message')) {
          return ApiException(
            statusCode ?? 0,
            data['message'],
            data,
          );
        }
        
        switch (statusCode) {
          case 400:
            return BadRequestException('Bad request');
          case 401:
            return UnauthorizedException('Unauthorized');
          case 403:
            return ForbiddenException('Forbidden');
          case 404:
            return NotFoundException('Not found');
          case 500:
            return ServerException('Server error');
          default:
            return ApiException(
              statusCode ?? 0,
              'Unknown error occurred',
              data,
            );
        }
        
      case DioExceptionType.cancel:
        return ApiException(0, 'Request cancelled');
        
      case DioExceptionType.unknown:
        if (error.error is SocketException) {
          return NetworkException('No internet connection');
        }
        return ApiException(0, 'Unknown error: ${error.message}');
        
      default:
        return ApiException(0, 'Unknown error');
    }
  }
}

// Custom exceptions
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic data;
  
  ApiException(this.statusCode, this.message, [this.data]);
  
  @override
  String toString() => 'ApiException: $statusCode - $message';
}

class NetworkException extends ApiException {
  NetworkException(String message) : super(0, message);
}

class BadRequestException extends ApiException {
  BadRequestException(String message) : super(400, message);
}

class UnauthorizedException extends ApiException {
  UnauthorizedException(String message) : super(401, message);
}

class ForbiddenException extends ApiException {
  ForbiddenException(String message) : super(403, message);
}

class NotFoundException extends ApiException {
  NotFoundException(String message) : super(404, message);
}

class ServerException extends ApiException {
  ServerException(String message) : super(500, message);
}

class TimeoutException extends ApiException {
  TimeoutException(String message) : super(0, message);
}