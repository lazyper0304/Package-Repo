// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppInfo _$AppInfoFromJson(Map<String, dynamic> json) => AppInfo(
      appId: json['app_id'] as String,
      name: json['name'] as String,
      pkgName: json['pkg_name'] as String?,
      iconUrl: json['icon_url'] as String?,
      developerName: json['developer_name'] as String?,
      averageRating: json['average_rating'] as String?,
      totalDownloadCount: (json['download_count'] as num?)?.toInt(),
      versionName: json['version'] as String?,
      versionCode: (json['version_code'] as num?)?.toInt(),
      intro: json['description'] as String?,
      briefShowInfo: json['brief_desc'] as String?,
      updatedTime: json['updated_at'] as String?,
    );

Map<String, dynamic> _$AppInfoToJson(AppInfo instance) => <String, dynamic>{
      'app_id': instance.appId,
      'name': instance.name,
      'pkg_name': instance.pkgName,
      'icon_url': instance.iconUrl,
      'developer_name': instance.developerName,
      'average_rating': instance.averageRating,
      'download_count': instance.totalDownloadCount,
      'version': instance.versionName,
      'version_code': instance.versionCode,
      'description': instance.intro,
      'brief_desc': instance.briefShowInfo,
      'updated_at': instance.updatedTime,
    };

AppSearchResult _$AppSearchResultFromJson(Map<String, dynamic> json) =>
    AppSearchResult(
      data: (json['data'] as List<dynamic>)
          .map((e) => AppInfo.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalCount: (json['totalCount'] as num).toInt(),
      pageSize: (json['pageSize'] as num).toInt(),
    );

Map<String, dynamic> _$AppSearchResultToJson(AppSearchResult instance) =>
    <String, dynamic>{
      'data': instance.data,
      'totalCount': instance.totalCount,
      'pageSize': instance.pageSize,
    };

AppMetrics _$AppMetricsFromJson(Map<String, dynamic> json) => AppMetrics(
      pkgId: json['pkgId'] as String,
      records: (json['records'] as List<dynamic>)
          .map((e) => DownloadRecord.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$AppMetricsToJson(AppMetrics instance) =>
    <String, dynamic>{
      'pkgId': instance.pkgId,
      'records': instance.records,
    };

DownloadRecord _$DownloadRecordFromJson(Map<String, dynamic> json) =>
    DownloadRecord(
      count: (json['count'] as num).toInt(),
      date: json['date'] as String,
    );

Map<String, dynamic> _$DownloadRecordToJson(DownloadRecord instance) =>
    <String, dynamic>{
      'count': instance.count,
      'date': instance.date,
    };
