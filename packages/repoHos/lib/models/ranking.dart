import 'package:json_annotation/json_annotation.dart';

part 'ranking.g.dart';

@JsonSerializable()
class DownloadIncrement {
  @JsonKey(name: 'app_id')
  final String appId;
  final String name;
  @JsonKey(name: 'pkg_name')
  final String? pkgName;
  @JsonKey(name: 'icon_url')
  final String? iconUrl;
  @JsonKey(name: 'current_download_count')
  final int currentCount;
  @JsonKey(name: 'prior_download_count')
  final int priorCount;
  @JsonKey(name: 'download_increment')
  final int increment;
  @JsonKey(name: 'current_period_date')
  final String? currentDate;
  @JsonKey(name: 'prior_period_date')
  final String? priorDate;

  DownloadIncrement({
    required this.appId,
    required this.name,
    this.pkgName,
    this.iconUrl,
    required this.currentCount,
    required this.priorCount,
    required this.increment,
    this.currentDate,
    this.priorDate,
  });

  factory DownloadIncrement.fromJson(Map<String, dynamic> json) =>
      _$DownloadIncrementFromJson(json);
}

@JsonSerializable()
class AppRating {
  @JsonKey(name: 'app_id')
  final String appId;
  final String name;
  @JsonKey(name: 'pkg_name')
  final String? pkgName;
  @JsonKey(name: 'icon_url')
  final String? iconUrl;
  @JsonKey(name: 'average_rating')
  final String averageRating;
  @JsonKey(name: 'total_star_rating_count')
  final int totalStarRatingCount;

  AppRating({
    required this.appId,
    required this.name,
    this.pkgName,
    this.iconUrl,
    required this.averageRating,
    required this.totalStarRatingCount,
  });

  factory AppRating.fromJson(Map<String, dynamic> json) =>
      _$AppRatingFromJson(json);
}

@JsonSerializable()
class MarketInfo {
  @JsonKey(name: 'app_count')
  final int appCount;
  @JsonKey(name: 'substance_count')
  final int substanceCount;
  @JsonKey(name: 'developer_count')
  final int developerCount;
  @JsonKey(name: 'last_sync_time')
  final String? lastSyncTime;
  final String? version;

  MarketInfo({
    required this.appCount,
    required this.substanceCount,
    required this.developerCount,
    this.lastSyncTime,
    this.version,
  });

  factory MarketInfo.fromJson(Map<String, dynamic> json) =>
      _$MarketInfoFromJson(json);
}
