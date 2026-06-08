import 'package:json_annotation/json_annotation.dart';

part 'app.g.dart';

@JsonSerializable()
class AppInfo {
  @JsonKey(name: 'app_id')
  final String appId;
  final String name;
  @JsonKey(name: 'pkg_name')
  final String? pkgName;
  @JsonKey(name: 'icon_url')
  final String? iconUrl;
  @JsonKey(name: 'developer_name')
  final String? developerName;
  @JsonKey(name: 'average_rating')
  final String? averageRating;
  @JsonKey(name: 'download_count')
  final int? totalDownloadCount;
  @JsonKey(name: 'version')
  final String? versionName;
  @JsonKey(name: 'version_code')
  final int? versionCode;
  @JsonKey(name: 'description')
  final String? intro;
  @JsonKey(name: 'brief_desc')
  final String? briefShowInfo;
  @JsonKey(name: 'updated_at')
  final String? updatedTime;

  AppInfo({
    required this.appId,
    required this.name,
    this.pkgName,
    this.iconUrl,
    this.developerName,
    this.averageRating,
    this.totalDownloadCount,
    this.versionName,
    this.versionCode,
    this.intro,
    this.briefShowInfo,
    this.updatedTime,
  });

  factory AppInfo.fromJson(Map<String, dynamic> json) =>
      _$AppInfoFromJson(json);

  Map<String, dynamic> toJson() => _$AppInfoToJson(this);
}

@JsonSerializable()
class AppSearchResult {
  final List<AppInfo> data;
  final int totalCount;
  final int pageSize;

  AppSearchResult({
    required this.data,
    required this.totalCount,
    required this.pageSize,
  });

  factory AppSearchResult.fromJson(Map<String, dynamic> json) =>
      _$AppSearchResultFromJson(json);
}

@JsonSerializable()
class AppMetrics {
  final String pkgId;
  final List<DownloadRecord> records;

  AppMetrics({
    required this.pkgId,
    required this.records,
  });

  factory AppMetrics.fromJson(Map<String, dynamic> json) =>
      _$AppMetricsFromJson(json);
}

@JsonSerializable()
class DownloadRecord {
  final int count;
  final String date;

  DownloadRecord({
    required this.count,
    required this.date,
  });

  factory DownloadRecord.fromJson(Map<String, dynamic> json) =>
      _$DownloadRecordFromJson(json);
}
