import 'package:flutter/material.dart';
import '../models/app.dart';
import 'glass_card.dart';

class AppCard extends StatelessWidget {
  final AppInfo app;
  final VoidCallback? onTap;

  const AppCard({
    super.key,
    required this.app,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: onTap,
      child: GlassCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            _buildIcon(theme),
            const SizedBox(width: 12),
            Expanded(child: _buildInfo(theme)),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon(ThemeData theme) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        color: theme.colorScheme.surfaceVariant,
      ),
      child: app.iconUrl != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.network(
                app.iconUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.apps, size: 28),
              ),
            )
          : const Icon(Icons.apps, size: 28),
    );
  }

  Widget _buildInfo(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          app.name,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        if (app.pkgName != null) ...[
          const SizedBox(height: 4),
          Text(
            app.pkgName!,
            style: TextStyle(
              fontSize: 12,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        if (app.developerName != null) ...[
          const SizedBox(height: 4),
          Text(
            app.developerName!,
            style: TextStyle(
              fontSize: 12,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        const SizedBox(height: 8),
        _buildStats(theme),
      ],
    );
  }

  Widget _buildStats(ThemeData theme) {
    return Row(
      children: [
        if (app.averageRating != null) ...[
          const Icon(Icons.star, size: 14, color: Colors.amber),
          const SizedBox(width: 4),
          Text(
            app.averageRating!,
            style: TextStyle(
              fontSize: 12,
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(width: 12),
        ],
        if (app.totalDownloadCount != null) ...[
          Icon(Icons.download, size: 14, color: theme.colorScheme.primary),
          const SizedBox(width: 4),
          Text(
            _formatNumber(app.totalDownloadCount!),
            style: TextStyle(
              fontSize: 12,
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ],
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
}
