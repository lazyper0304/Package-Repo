import 'package:flutter/material.dart';
import 'package:flutter_sficon/flutter_sficon.dart';
import 'package:go_router/go_router.dart';
import 'package:signals_flutter/signals_flutter.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' hide GlassCard;
import 'package:animated_gradient/animated_gradient.dart';
import '../main.dart';
import '../services/api.dart';
import '../models/app.dart';
import '../models/ranking.dart';
import '../widgets/page_wrapper.dart';
import 'search_page.dart';
import 'ranking_page.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  final StatefulNavigationShell navigationShell;

  const HomeScreen({super.key, required this.navigationShell});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = ApiService();
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();

  final _apps = signal<List<AppInfo>>([]);
  final _isLoading = signal(false);
  final _currentPage = signal(1);
  final _totalCount = signal(0);
  final _hasMore = signal(true);
  final _selectedRankingTab = signal(0);
  final _isSearching = signal(false);

  late Future<List<DownloadIncrement>> _downloadRankingFuture;
  late Future<List<AppRating>> _ratingRankingFuture;
  late Future<List<AppInfo>> _recentRankingFuture;

  int get _currentTab => widget.navigationShell.currentIndex;

  @override
  void initState() {
    super.initState();
    _loadDefaultApps();
    _downloadRankingFuture = _api.getDownloadIncreaseRanking(limit: 50);
    _ratingRankingFuture = _api.getRatingRanking(limit: 50);
    _recentRankingFuture = _api.getRecentUpdateRanking(limit: 50);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadDefaultApps() async {
    _isLoading.value = true;
    try {
      final result = await _api.searchApps(
        page: 1,
        detail: true,
        sort: 'download_count',
        desc: true,
      );
      _apps.value = result.data;
      _totalCount.value = result.totalCount;
      _hasMore.value = _apps.value.length < result.totalCount;
    } catch (e) {
      // 静默失败
    } finally {
      _isLoading.value = false;
    }
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

  void _onTabSelected(int index) {
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }

  Widget _buildBottomBar(ThemeData theme) {
    final isDark = theme.brightness == Brightness.dark;
    final tabs = [
      GlassBottomBarTab(
        label: '首页',
        icon: const SFIcon(SFIcons.sf_house),
        activeIcon: const SFIcon(SFIcons.sf_house_fill),
        glowColor: theme.colorScheme.primary,
      ),
      GlassBottomBarTab(
        label: '排行榜',
        icon: const SFIcon(SFIcons.sf_chart_bar),
        activeIcon: const SFIcon(SFIcons.sf_chart_bar_fill),
        glowColor: theme.colorScheme.secondary,
      ),
      GlassBottomBarTab(
        label: '设置',
        icon: const SFIcon(SFIcons.sf_gearshape),
        activeIcon: const SFIcon(SFIcons.sf_gearshape_fill),
        glowColor: theme.colorScheme.tertiary,
      ),
    ];

    return GlassSearchableBottomBar(
      isSearchActive: _isSearching.value,
      selectedIndex: _currentTab,
      onTabSelected: (index) {
        // 点击收缩的导航按钮 → 退出搜索模式
        if (_isSearching.value) {
          _isSearching.value = false;
          _searchController.clear();
          _searchFocusNode.unfocus();
          _loadDefaultApps();
          return;
        }
        _onTabSelected(index);
      },
      barHeight: 64,
      searchBarHeight: 50,
      horizontalPadding: 20,
      verticalPadding: 16,
      spacing: 8,
      selectedIconColor: theme.colorScheme.primary,
      unselectedIconColor: theme.colorScheme.onSurface.withOpacity(0.6),
      indicatorColor: theme.textTheme.bodyMedium?.color?.withAlpha(52) ??
          Colors.transparent,
      labelFontSize: 10,
      iconSize: 28,
      iconLabelSpacing: 2,
      quality: GlassQuality.premium,
      interactionBehavior: GlassInteractionBehavior.full,
      settings: LiquidGlassSettings(
        glassColor: isDark
            ? const Color(0xCC1C1C1E)
            : const Color.fromRGBO(255, 255, 255, 0.08),
        thickness: 30,
        blur: 2,
        chromaticAberration: 0.01,
        lightIntensity: 0.5,
        ambientStrength: 0,
        refractiveIndex: 1.2,
        saturation: 1.2,
        specularSharpness: GlassSpecularSharpness.medium,
      ),
      searchConfig: GlassSearchBarConfig(
        searchIcon: const SFIcon(SFIcons.sf_magnifyingglass),
        controller: _searchController,
        focusNode: _searchFocusNode,
        autoFocusOnExpand: false,
        showsCancelButton: false,
        expandWhenActive: _isSearching.value,
        hintText: '搜索应用...',
        searchIconColor: theme.colorScheme.onSurface.withOpacity(0.6),
        textColor: theme.textTheme.bodyLarge?.color,
        hintStyle: TextStyle(color: theme.colorScheme.onSurfaceVariant),
        onSearchToggle: (active) {
          if (active) {
            // 先跳转首页，再展开搜索框
            _onTabSelected(0);
            _isSearching.value = true;
          } else {
            // 退出搜索模式，清空内容
            _isSearching.value = false;
            _searchController.clear();
            _searchFocusNode.unfocus();
            _loadDefaultApps();
          }
        },
        onSearchFocusChanged: (focused) {
          if (focused) {
            _onTabSelected(0);
            _isSearching.value = true;
          } else {
            _isSearching.value = false;
          }
        },
        textInputAction: TextInputAction.search,
        onSubmitted: (value) {
          _searchFocusNode.unfocus();
          if (value.isNotEmpty) {
            _searchApps(value);
          }
        },
        collapsedLogoBuilder: (context) {
          final tab = tabs[_currentTab];

          return Center(
            child: IconTheme(
              data: IconThemeData(color: theme.colorScheme.primary, size: 28),
              child: tab.activeIcon ?? tab.icon,
            ),
          );
        },
      ),
      tabs: tabs,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final themeScope = ThemeScope.of(context);

    return AnimatedGradient(
      key: ValueKey(isDark),
      colors: isDark
          ? const [Color(0xFF000000), Color(0xFF1A1A1A), Color(0xFF000000)]
          : const [Color(0xFFF2F3F5), Color(0xFFE8E8EA), Color(0xFFF2F3F5)],
      child: PageWrapper(
        centerTitle: false,
        titleWidget: Text(
          'Package Repo',
          style: theme.textTheme.titleLarge,
        ),
        showBackButton: false,
        backgroundColor: Colors.transparent,
        edgeSize: 120,
        extendBody: true,
        builder: () => _buildCurrentTab(theme, themeScope),
        bottomBar: Watch((context) => _buildBottomBar(theme)),
      ),
    );
  }

  List<Widget> _buildCurrentTab(ThemeData theme, ThemeScope themeScope) {
    return [
      Watch((context) {
        switch (_currentTab) {
          case 0:
            return SliverToBoxAdapter(
              child: SearchPage(
                apps: _apps.value,
                isLoading: _isLoading.value,
                hasMore: _hasMore.value,
                onLoadMore: _loadMore,
              ),
            );
          case 1:
            return SliverToBoxAdapter(
              child: RankingPage(
                selectedTab: _selectedRankingTab,
                downloadFuture: _downloadRankingFuture,
                ratingFuture: _ratingRankingFuture,
                recentFuture: _recentRankingFuture,
              ),
            );
          case 2:
            return SliverToBoxAdapter(
              child: SettingsScreen(
                themeType: themeScope.themeType,
                onThemeChanged: themeScope.onThemeChanged,
              ),
            );
          default:
            return const SliverToBoxAdapter(child: SizedBox.shrink());
        }
      }),
    ];
  }
}
