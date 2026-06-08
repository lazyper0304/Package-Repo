// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ranking.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DownloadIncrement _$DownloadIncrementFromJson(Map<String, dynamic> json) =>
    DownloadIncrement(
      appId: json['app_id'] as String,
      name: json['name'] as String,
      pkgName: json['pkg_name'] as String?,
      iconUrl: json['icon_url'] as String?,
      currentCount: (json['current_download_count'] as num).toInt(),
      priorCount: (json['prior_download_count'] as num).toInt(),
      increment: (json['download_increment'] as num).toInt(),
      currentDate: json['current_period_date'] as String?,
      priorDate: json['prior_period_date'] as String?,
    );

Map<String, dynamic> _$DownloadIncrementToJson(DownloadIncrement instance) =>
    <String, dynamic>{
      'app_id': instance.appId,
      'name': instance.name,
      'pkg_name': instance.pkgName,
      'icon_url': instance.iconUrl,
      'current_download_count': instance.currentCount,
      'prior_download_count': instance.priorCount,
      'download_increment': instance.increment,
      'current_period_date': instance.currentDate,
      'prior_period_date': instance.priorDate,
    };

AppRating _$AppRatingFromJson(Map<String, dynamic> json) => AppRating(
      appId: json['app_id'] as String,
      name: json['name'] as String,
      pkgName: json['pkg_name'] as String?,
      iconUrl: json['icon_url'] as String?,
      averageRating: json['average_rating'] as String,
      totalStarRatingCount: (json['total_star_rating_count'] as num).toInt(),
    );

Map<String, dynamic> _$AppRatingToJson(AppRating instance) =>
    <String, dynamic>{
      'app_id': instance.appId,
      'name': instance.name,
      'pkg_name': instance.pkgName,
      'icon_url': instance.iconUrl,
      'average_rating': instance.averageRating,
      'total_star_rating_count': instance.totalStarRatingCount,
    };

MarketInfo _$MarketInfoFromJson(Map<String, dynamic> json) => MarketInfo(
      appCount: (json['app_count'] as num).toInt(),
      substanceCount: (json['substance_count'] as num).toInt(),
      developerCount: (json['developer_count'] as num).toInt(),
      lastSyncTime: json['last_sync_time'] as String?,
      version: json['version'] as String?,
    );

Map<String, dynamic> _$MarketInfoToJson(MarketInfo instance) =>
    <String, dynamic>{
      'app_count': instance.appCount,
      'substance_count': instance.substanceCount,
      'developer_count': instance.developerCount,
      'last_sync_time': instance.lastSyncTime,
      'version': instance.version,
    };
