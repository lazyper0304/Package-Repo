import 'package:dio/dio.dart';
import 'http_client.dart';
import '../models/app.dart';
import '../models/ranking.dart';

class ApiService {
  final Dio _dio = HttpClient.instance.dio;

  // 从 API 响应中提取列表数据
  List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      return data['list'] ?? data['data'] ?? [];
    }
    return [];
  }

  // 搜索应用
  Future<AppSearchResult> searchApps({
    required int page,
    int pageSize = 20,
    String? searchKey,
    String? searchValue,
    bool? detail,
    String? sort,
    bool? desc,
  }) async {
    final response = await _dio.get('/api/v0/apps/list/$page', queryParameters: {
      'page_size': pageSize,
      if (searchKey != null) 'search_key': searchKey,
      if (searchValue != null) 'search_value': searchValue,
      if (detail != null) 'detail': detail,
      if (sort != null) 'sort': sort,
      if (desc != null) 'desc': desc,
    });

    final data = response.data;
    // 处理不同的 API 响应格式
    List<dynamic> list;
    int total;

    if (data is Map<String, dynamic>) {
      // 格式1: { success: true, data: [...], total: N }
      // 格式2: { success: true, data: { list: [...], total: N } }
      final apiData = data['data'];
      if (apiData is List) {
        list = apiData;
        total = data['total'] ?? data['total_count'] ?? 0;
      } else if (apiData is Map<String, dynamic>) {
        list = apiData['list'] ?? apiData['data'] ?? [];
        total = apiData['total'] ?? apiData['total_count'] ?? 0;
      } else {
        list = [];
        total = 0;
      }
    } else {
      list = [];
      total = 0;
    }

    return AppSearchResult(
      data: list.map((e) => AppInfo.fromJson(e as Map<String, dynamic>)).toList(),
      totalCount: total,
      pageSize: pageSize,
    );
  }

  // 按包名查询
  Future<AppInfo?> getAppByPkgName(String pkgName) async {
    final response = await _dio.get('/api/v0/apps/pkg_name/$pkgName');
    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true && data['data'] != null) {
      final appData = data['data'];
      // 处理嵌套的 full_info 结构
      final Map<String, dynamic> appInfo = appData is Map<String, dynamic>
          ? (appData['full_info'] as Map<String, dynamic>?) ?? appData
          : appData;
      return AppInfo.fromJson(appInfo);
    }
    return null;
  }

  // 按ID查询
  Future<AppInfo?> getAppById(String appId) async {
    final response = await _dio.get('/api/v0/apps/app_id/$appId');
    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true) {
      final rawData = data['data'];
      if (rawData is Map<String, dynamic>) {
        // 处理嵌套的 full_info 结构
        final fullInfo = rawData['full_info'];
        final Map<String, dynamic> appInfo = (fullInfo is Map<String, dynamic>) ? fullInfo : rawData;
        return AppInfo.fromJson(appInfo);
      }
    }
    return null;
  }

  // 获取应用指标
  Future<AppMetrics?> getAppMetrics(String pkgId) async {
    final response = await _dio.get('/api/v0/apps/metrics/$pkgId');
    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true && data['data'] != null) {
      final metricsData = data['data'];
      // API 返回的是 List，需要转换为 AppMetrics 格式
      if (metricsData is List) {
        return AppMetrics(
          pkgId: pkgId,
          records: metricsData.map((e) => DownloadRecord(
            count: (e['download_count'] as num?)?.toInt() ?? 0,
            date: e['created_at'] as String? ?? '',
          )).toList(),
        );
      }
    }
    return null;
  }

  // 下载增长排行
  Future<List<DownloadIncrement>> getDownloadIncreaseRanking({
    int? days,
    int? months,
    int limit = 50,
    int page = 1,
  }) async {
    final response = await _dio.get('/api/v0/rankings/download_increase', queryParameters: {
      if (days != null) 'days': days,
      if (months != null) 'months': months,
      'limit': limit,
      'page': page,
    });

    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true) {
      final list = _extractList(data['data']);
      return list.map((e) => DownloadIncrement.fromJson(e)).toList();
    }
    return [];
  }

  // 评分排行
  Future<List<AppRating>> getRatingRanking({
    int limit = 50,
    int page = 1,
  }) async {
    final response = await _dio.get('/api/v0/rankings/ratings', queryParameters: {
      'limit': limit,
      'page': page,
    });

    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true) {
      final list = _extractList(data['data']);
      return list.map((e) => AppRating.fromJson(e)).toList();
    }
    return [];
  }

  // 最近更新排行
  Future<List<AppInfo>> getRecentUpdateRanking({
    int limit = 50,
    int page = 1,
  }) async {
    final response = await _dio.get('/api/v0/rankings/recent', queryParameters: {
      'limit': limit,
      'page': page,
    });

    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true) {
      final list = _extractList(data['data']);
      return list.map((e) => AppInfo.fromJson(e)).toList();
    }
    return [];
  }

  // 市场统计
  Future<MarketInfo?> getMarketInfo() async {
    final response = await _dio.get('/api/v0/market_info');
    final data = response.data;
    if (data is Map<String, dynamic> && data['success'] == true && data['data'] != null) {
      return MarketInfo.fromJson(data['data'] as Map<String, dynamic>);
    }
    return null;
  }
}
