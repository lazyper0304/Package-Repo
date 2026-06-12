import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:signals_flutter/signals_flutter.dart';
import '../models/app.dart';
import '../widgets/app_card.dart';

class SearchPage extends StatelessWidget {
  final List<AppInfo> apps;
  final bool isLoading;
  final bool hasMore;
  final VoidCallback onLoadMore;

  const SearchPage({
    super.key,
    required this.apps,
    required this.isLoading,
    required this.hasMore,
    required this.onLoadMore,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (isLoading && apps.isEmpty) {
      return const SizedBox(
        height: 300,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (apps.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.home_outlined,
              size: 64,
              color: theme.colorScheme.onSurface.withOpacity(0.3),
            ),
            const SizedBox(height: 16),
            Text(
              '搜索鸿蒙应用',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
            ),
          ],
        ),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200) {
          onLoadMore();
        }
        return false;
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < apps.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: AppCard(
                app: apps[i],
                onTap: () {
                  final icon = apps[i].iconUrl;
                  final param = icon != null ? '?icon=${Uri.encodeComponent(icon)}' : '';
                  context.push('/app/${apps[i].appId}$param');
                },
              ),
            ),
          ],
          if (isLoading)
            const Padding(
              padding: EdgeInsets.all(16),
              child: CircularProgressIndicator(),
            ),
          const SizedBox(height: 100),
        ],
      ),
    );
  }
}
