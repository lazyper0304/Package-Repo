import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:signals_flutter/signals_flutter.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' hide GlassCard;
import 'package:animated_gradient/animated_gradient.dart';
import '../main.dart';
import '../services/api.dart';
import '../models/app.dart';
import '../models/ranking.dart';
import '../widgets/app_card.dart';
import '../widgets/search_bar.dart';
import '../widgets/glass_card.dart';
import '../widgets/stat_card.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiService();
  final _searchController = TextEditingController();

  final _apps = signal<List<AppInfo>>([]);
  final _marketInfo = signal<MarketInfo?>(null);
  final _isLoading = signal(false);
  final _currentPage = signal(1);
  final _totalCount = signal(0);
  final _hasMore = signal(true);
  final _currentTab = signal(0); // 0: 搜索, 1: 排行, 2: 设置

  // 排行榜数据缓存
  late Future<List<DownloadIncrement>> _downloadRankingFuture;
  late Future<List<AppRating>> _ratingRankingFuture;
  late Future<List<AppInfo>> _recentRankingFuture;

  @override
  void initState() {
    super.initState();
    _loadMarketInfo();
    _downloadRankingFuture = _api.getDownloadIncreaseRanking(limit: 50);
    _ratingRankingFuture = _api.getRatingRanking(limit: 50);
    _recentRankingFuture = _api.getRecentUpdateRanking(limit: 50);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMarketInfo() async {
    final info = await _api.getMarketInfo();
    _marketInfo.value = info;
  }

  Future<void> _searchApps(String keyword, {bool loadMore = false}) async {
    if (_isLoading.value) return;

    if (!loadMore) {
      _currentPage.value = 1;
      _apps.value = [];
    }

    _isLoading.value = true;

    try {
      final result = await _api.searchApps(
        page: _currentPage.value,
        searchKey: 'name',
        searchValue: keyword,
        detail: true,
      );

      if (loadMore) {
        _apps.value = [..._apps.value, ...result.data];
      } else {
        _apps.value = result.data;
      }

      _totalCount.value = result.totalCount;
      _hasMore.value = _apps.value.length < result.totalCount;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('搜索失败: $e')),
        );
      }
    } finally {
      _isLoading.value = false;
    }
  }

  void _loadMore() {
    if (_hasMore.value && !_isLoading.value) {
      _currentPage.value++;
      _searchApps(_searchController.text, loadMore: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final themeScope = ThemeScope.of(context);

    return AdaptiveLiquidGlassLayer(
      settings: AppGlassSettings.standard,
      child: AnimatedGradient(
        key: ValueKey(isDark),
        colors: isDark
            ? const [Color(0xFF0A0A0A), Color(0xFF1A1A2E), Color(0xFF16213E)]
            : const [Color(0xFFF2F2F7), Color(0xFFE8E0F0), Color(0xFFD4E4F7)],
        child: Scaffold(
          backgroundColor: Colors.transparent,
          extendBody: true,
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                _buildHeader(theme),
                if (_currentTab.value != 2) _buildMarketStats(theme),
                Expanded(
                  child: Watch((context) {
                    switch (_currentTab.value) {
                      case 0:
                        return _buildSearchTab(theme);
                      case 1:
                        return _buildRankingTab(theme);
                      case 2:
                        return SettingsScreen(
                          themeType: themeScope.themeType,
                          onThemeChanged: themeScope.onThemeChanged,
                        );
                      default:
                        return const SizedBox.shrink();
                    }
                  }),
                ),
              ],
            ),
          ),
          bottomNavigationBar: Watch((context) => GlassBottomBar(
            tabs: [
              GlassBottomBarTab(
                label: '搜索',
                icon: const Icon(Icons.search),
                glowColor: theme.colorScheme.primary,
              ),
              GlassBottomBarTab(
                label: '排行榜',
                icon: const Icon(Icons.leaderboard),
                glowColor: theme.colorScheme.secondary,
              ),
              GlassBottomBarTab(
                label: '设置',
                icon: const Icon(Icons.settings),
                glowColor: theme.colorScheme.tertiary,
              ),
            ],
            selectedIndex: _currentTab.value,
            onTabSelected: (index) => _currentTab.value = index,
            selectedIconColor: theme.colorScheme.primary,
            unselectedIconColor: theme.colorScheme.onSurface.withOpacity(0.6),
          )),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: Image.asset('assets/icon.png', fit: BoxFit.cover),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'Package Repo',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMarketStats(ThemeData theme) {
    return Watch((context) {
      final info = _marketInfo.value;
      if (info == null) return const SizedBox.shrink();

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: StatCard(
                icon: Icons.apps,
                label: '应用总数',
                value: '${info.appCount}',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatCard(
                icon: Icons.developer_mode,
                label: '开发者',
                value: '${info.developerCount}',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StatCard(
                icon: Icons.layers,
                label: '专题',
                value: '${info.substanceCount}',
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildSearchTab(ThemeData theme) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SearchBarWidget(
            controller: _searchController,
            onSearch: (keyword) => _searchApps(keyword),
          ),
        ),
        const SizedBox(height: 16),
        Expanded(
          child: Watch((context) {
            if (_isLoading.value && _apps.value.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (_apps.value.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.search,
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
                  _loadMore();
                }
                return false;
              },
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                itemCount: _apps.value.length + (_hasMore.value ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _apps.value.length) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  final app = _apps.value[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: AppCard(
                      app: app,
                      onTap: () => context.push('/app/${app.appId}'),
                    ),
                  );
                },
              ),
            );
          }),
        ),
      ],
    );
  }

  Widget _buildRankingTab(ThemeData theme) {
    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: '下载增长'),
              Tab(text: '评分排行'),
              Tab(text: '最近更新'),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: TabBarView(
              children: [
                _buildDownloadRanking(theme),
                _buildRatingRanking(theme),
                _buildRecentRanking(theme),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDownloadRanking(ThemeData theme) {
    return FutureBuilder<List<DownloadIncrement>>(
      future: _downloadRankingFuture,
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
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildRatingRanking(ThemeData theme) {
    return FutureBuilder<List<AppRating>>(
      future: _ratingRankingFuture,
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
            );
          }).toList(),
        );
      },
    );
  }

  Widget _buildRecentRanking(ThemeData theme) {
    return FutureBuilder<List<AppInfo>>(
      future: _recentRankingFuture,
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
  }) {
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
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
