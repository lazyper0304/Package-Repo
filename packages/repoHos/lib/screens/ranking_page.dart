import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:signals_flutter/signals_flutter.dart';
import '../models/app.dart';
import '../models/ranking.dart';
import '../widgets/glass_card.dart';

class RankingPage extends StatelessWidget {
  final Signal<int> selectedTab;
  final Future<List<DownloadIncrement>> downloadFuture;
  final Future<List<AppRating>> ratingFuture;
  final Future<List<AppInfo>> recentFuture;

  const RankingPage({
    super.key,
    required this.selectedTab,
    required this.downloadFuture,
    required this.ratingFuture,
    required this.recentFuture,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Watch((context) {
            return Row(
              children: [
                _buildTabChip(theme, '下载增长', 0),
                const SizedBox(width: 8),
                _buildTabChip(theme, '评分排行', 1),
                const SizedBox(width: 8),
                _buildTabChip(theme, '最近更新', 2),
              ],
            );
          }),
        ),
        const SizedBox(height: 12),
        Watch((context) {
          switch (selectedTab.value) {
            case 0:
              return _buildDownloadRanking(context, theme);
            case 1:
              return _buildRatingRanking(context, theme);
            case 2:
              return _buildRecentRanking(context, theme);
            default:
              return const SizedBox.shrink();
          }
        }),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildTabChip(ThemeData theme, String label, int index) {
    final isSelected = selectedTab.value == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => selectedTab.value = index,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? theme.colorScheme.primary.withOpacity(0.15)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.outline.withOpacity(0.3),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDownloadRanking(BuildContext context, ThemeData theme) {
    return FutureBuilder<List<DownloadIncrement>>(
      future: downloadFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 300,
            child: Center(child: CircularProgressIndicator()),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox(
            height: 300,
            child: Center(child: Text('暂无数据')),
          );
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < snapshot.data!.length; i++) ...[
              if (i > 0) const SizedBox(height: 8),
              _buildRankingItem(
                context,
                theme,
                rank: i + 1,
                appId: snapshot.data![i].appId,
                iconUrl: snapshot.data![i].iconUrl,
                name: snapshot.data![i].name,
                subtitle: snapshot.data![i].pkgName ?? '',
                trailing: '+${snapshot.data![i].increment}',
                trailingColor: Colors.green,
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildRatingRanking(BuildContext context, ThemeData theme) {
    return FutureBuilder<List<AppRating>>(
      future: ratingFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 300,
            child: Center(child: CircularProgressIndicator()),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox(
            height: 300,
            child: Center(child: Text('暂无数据')),
          );
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < snapshot.data!.length; i++) ...[
              if (i > 0) const SizedBox(height: 8),
              _buildRankingItem(
                context,
                theme,
                rank: i + 1,
                appId: snapshot.data![i].appId,
                iconUrl: snapshot.data![i].iconUrl,
                name: snapshot.data![i].name,
                subtitle: snapshot.data![i].pkgName ?? '',
                trailing: '${snapshot.data![i].averageRating} ★',
                trailingColor: Colors.amber,
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildRecentRanking(BuildContext context, ThemeData theme) {
    return FutureBuilder<List<AppInfo>>(
      future: recentFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(
            height: 300,
            child: Center(child: CircularProgressIndicator()),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const SizedBox(
            height: 300,
            child: Center(child: Text('暂无数据')),
          );
        }

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < snapshot.data!.length; i++) ...[
              if (i > 0) const SizedBox(height: 8),
              _buildRankingItem(
                context,
                theme,
                rank: i + 1,
                appId: snapshot.data![i].appId,
                iconUrl: snapshot.data![i].iconUrl,
                name: snapshot.data![i].name,
                subtitle: snapshot.data![i].pkgName ?? '',
                trailing: _formatTime(snapshot.data![i].updatedTime),
                trailingColor: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildRankingItem(
    BuildContext context,
    ThemeData theme, {
    required int rank,
    required String appId,
    String? iconUrl,
    required String name,
    required String subtitle,
    required String trailing,
    required Color trailingColor,
  }) {
    return GlassCard(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(12),
      onTap: () {
        final param = iconUrl != null ? '?icon=${Uri.encodeComponent(iconUrl!)}' : '';
        context.push('/app/$appId$param');
      },
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: Text(
              '$rank',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: rank <= 3
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface.withOpacity(0.5),
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(width: 12),
          _buildRankingIcon(theme, appId, iconUrl, name),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            trailing,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: trailingColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRankingIcon(
      ThemeData theme, String appId, String? iconUrl, String name) {
    final icon = Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: iconUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                iconUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _buildLetterAvatar(theme, name),
              ),
            )
          : _buildLetterAvatar(theme, name),
    );

    if (iconUrl == null) return icon;

    return Hero(
      tag: 'app-icon-$appId',
      child: icon,
    );
  }

  Widget _buildLetterAvatar(ThemeData theme, String name) {
    final letter = name.isNotEmpty ? name.characters.first : '?';
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary.withOpacity(0.7),
            theme.colorScheme.primary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        letter,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 18,
        ),
      ),
    );
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null || timeStr.isEmpty) return '';
    try {
      final time = DateTime.parse(timeStr);
      final now = DateTime.now();
      final diff = now.difference(time);

      if (diff.inDays > 365) {
        return '${(diff.inDays / 365).floor()}年前';
      } else if (diff.inDays > 30) {
        return '${(diff.inDays / 30).floor()}个月前';
      } else if (diff.inDays > 0) {
        return '${diff.inDays}天前';
      } else if (diff.inHours > 0) {
        return '${diff.inHours}小时前';
      } else if (diff.inMinutes > 0) {
        return '${diff.inMinutes}分钟前';
      } else {
        return '刚刚';
      }
    } catch (e) {
      return timeStr;
    }
  }
}
