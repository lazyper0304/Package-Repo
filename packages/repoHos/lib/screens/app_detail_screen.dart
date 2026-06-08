import 'package:flutter/material.dart';
import 'package:signals_flutter/signals_flutter.dart';
import '../services/api.dart';
import '../models/app.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_page.dart';

class AppDetailScreen extends StatefulWidget {
  final String appId;

  const AppDetailScreen({super.key, required this.appId});

  @override
  State<AppDetailScreen> createState() => _AppDetailScreenState();
}

class _AppDetailScreenState extends State<AppDetailScreen> {
  final _api = ApiService();

  final _app = signal<AppInfo?>(null);
  final _metrics = signal<AppMetrics?>(null);
  final _isLoading = signal(true);

  @override
  void initState() {
    super.initState();
    _loadAppDetail();
  }

  Future<void> _loadAppDetail() async {
    _isLoading.value = true;

    try {
      final app = await _api.getAppById(widget.appId);
      _app.value = app;

      if (app?.pkgName != null) {
        final metrics = await _api.getAppMetrics(app!.pkgName!);
        _metrics.value = metrics;
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('加载失败: $e')),
        );
      }
    } finally {
      _isLoading.value = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GlassPage(
      title: _app.value?.name ?? '应用详情',
      onBack: () => Navigator.pop(context),
      builder: () => [
        SliverToBoxAdapter(
          child: Watch((context) {
            if (_isLoading.value) {
              return const Padding(
                padding: EdgeInsets.only(top: 200),
                child: Center(child: CircularProgressIndicator()),
              );
            }

            final app = _app.value;
            if (app == null) {
              return Padding(
                padding: const EdgeInsets.only(top: 200),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('应用不存在'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('返回'),
                      ),
                    ],
                  ),
                ),
              );
            }

            return _buildContent(theme, app);
          }),
        ),
      ],
    );
  }

  Widget _buildContent(ThemeData theme, AppInfo app) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 16),
        Center(child: _buildAppIcon(theme, app)),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildAppHeader(theme, app),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildInfoSection(theme, app),
        ),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _buildMetricsSection(theme),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildAppIcon(ThemeData theme, AppInfo app) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: theme.colorScheme.surfaceVariant,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: app.iconUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                app.iconUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.apps, size: 40),
              ),
            )
          : const Icon(Icons.apps, size: 40),
    );
  }

  Widget _buildAppHeader(ThemeData theme, AppInfo app) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            app.name,
            style: theme.textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          if (app.developerName != null) ...[
            const SizedBox(height: 4),
            Text(
              app.developerName!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
          if (app.averageRating != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                ...List.generate(5, (index) {
                  final rating = double.tryParse(app.averageRating!) ?? 0;
                  return Icon(
                    index < rating.floor()
                        ? Icons.star
                        : index < rating
                            ? Icons.star_half
                            : Icons.star_border,
                    color: Colors.amber,
                    size: 20,
                  );
                }),
                const SizedBox(width: 8),
                Text(
                  app.averageRating!,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoSection(ThemeData theme, AppInfo app) {
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '应用信息',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _buildInfoRow(theme, '应用ID', app.appId),
          if (app.pkgName != null)
            _buildInfoRow(theme, '包名', app.pkgName!),
          if (app.versionName != null)
            _buildInfoRow(theme, '版本', '${app.versionName} (${app.versionCode})'),
          if (app.totalDownloadCount != null)
            _buildInfoRow(theme, '下载量', _formatNumber(app.totalDownloadCount!)),
          if (app.updatedTime != null)
            _buildInfoRow(theme, '更新时间', _formatTime(app.updatedTime!)),
        ],
      ),
    );
  }

  Widget _buildInfoRow(ThemeData theme, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsSection(ThemeData theme) {
    final metrics = _metrics.value;
    if (metrics == null || metrics.records.isEmpty) {
      return const SizedBox.shrink();
    }

    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '下载趋势',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ClipRect(
              child: _buildChart(theme, metrics.records),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChart(ThemeData theme, List<DownloadRecord> records) {
    if (records.isEmpty) return const SizedBox.shrink();

    final maxCount = records.map((r) => r.count).reduce((a, b) => a > b ? a : b);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: records.take(7).map((record) {
        final height = maxCount > 0 ? (record.count / maxCount) * 180 : 0.0;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  _formatNumber(record.count),
                  style: TextStyle(
                    fontSize: 10,
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  height: height,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        theme.colorScheme.primary,
                        theme.colorScheme.primary.withOpacity(0.5),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  record.date.substring(5),
                  style: TextStyle(
                    fontSize: 10,
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  String _formatNumber(int number) {
    if (number >= 100000000) {
      return '${(number / 100000000).toStringAsFixed(1)}亿';
    } else if (number >= 10000) {
      return '${(number / 10000).toStringAsFixed(1)}万';
    } else {
      return number.toString();
    }
  }

  String _formatTime(String timeStr) {
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
