import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api.dart';
import '../models/ranking.dart';
import '../widgets/glass_card.dart';
import '../widgets/glass_page.dart';

class RankingScreen extends StatefulWidget {
  const RankingScreen({super.key});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen>
    with SingleTickerProviderStateMixin {
  final _api = ApiService();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GlassPage(
      title: '排行榜',
      onBack: () => context.pop(),
      builder: () => [
        SliverToBoxAdapter(
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: '下载增长'),
                  Tab(text: '评分排行'),
                  Tab(text: '最近更新'),
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
        SliverFillRemaining(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildDownloadRanking(theme),
              _buildRatingRanking(theme),
              _buildRecentRanking(theme),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDownloadRanking(ThemeData theme) {
    return FutureBuilder<List<DownloadIncrement>>(
      future: _api.getDownloadIncreaseRanking(limit: 100),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('暂无数据'));
        }

        return _buildRankingList(
          theme,
          snapshot.data!.asMap().entries.map((entry) {
            final rank = entry.key + 1;
            final item = entry.value;
            return _buildRankingItem(
              theme,
              rank: rank,
              iconUrl: item.iconUrl,
              name: item.name,
              subtitle: item.pkgName ?? '',
              trailing: '+${item.increment}',
              trailingColor: Colors.green,
              onTap: () => context.push('/app/${item.appId}'),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildRatingRanking(ThemeData theme) {
    return FutureBuilder<List<AppRating>>(
      future: _api.getRatingRanking(limit: 100),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('暂无数据'));
        }

        return _buildRankingList(
          theme,
          snapshot.data!.asMap().entries.map((entry) {
            final rank = entry.key + 1;
            final item = entry.value;
            return _buildRankingItem(
              theme,
              rank: rank,
              iconUrl: item.iconUrl,
              name: item.name,
              subtitle: item.pkgName ?? '',
              trailing: '${item.averageRating} ★',
              trailingColor: Colors.amber,
              onTap: () => context.push('/app/${item.appId}'),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildRecentRanking(ThemeData theme) {
    return FutureBuilder<List<dynamic>>(
      future: _api.getRecentUpdateRanking(limit: 100),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('暂无数据'));
        }

        return _buildRankingList(
          theme,
          snapshot.data!.asMap().entries.map((entry) {
            final rank = entry.key + 1;
            final item = entry.value;
            return _buildRankingItem(
              theme,
              rank: rank,
              iconUrl: item.iconUrl,
              name: item.name,
              subtitle: item.pkgName ?? '',
              trailing: item.updatedTime ?? '',
              trailingColor: theme.colorScheme.onSurface.withOpacity(0.5),
              onTap: () => context.push('/app/${item.appId}'),
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildRankingList(ThemeData theme, List<Widget> items) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      itemCount: items.length,
      itemBuilder: (context, index) => items[index],
    );
  }

  Widget _buildRankingItem(
    ThemeData theme, {
    required int rank,
    String? iconUrl,
    required String name,
    required String subtitle,
    required String trailing,
    required Color trailingColor,
    VoidCallback? onTap,
  }) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      onTap: onTap,
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
          Container(
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
                      errorBuilder: (_, __, ___) =>
                          const Icon(Icons.apps, size: 24),
                    ),
                  )
                : const Icon(Icons.apps, size: 24),
          ),
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
}
