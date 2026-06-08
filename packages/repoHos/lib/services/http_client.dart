import 'package:dio/dio.dart';

class HttpClient {
  static final HttpClient _instance = HttpClient._();
  static HttpClient get instance => _instance;

  late final Dio _dio;

  HttpClient._() {
    _dio = Dio(
      BaseOptions(
        baseUrl: 'https://shenjack.top:10003',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  Dio get dio => _dio;
}
