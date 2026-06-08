import 'package:go_router/go_router.dart';
import 'screens/home_screen.dart';
import 'screens/app_detail_screen.dart';
import 'screens/ranking_screen.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/app/:appId',
      builder: (context, state) {
        final appId = state.pathParameters['appId']!;
        return AppDetailScreen(appId: appId);
      },
    ),
    GoRoute(
      path: '/ranking',
      builder: (context, state) => const RankingScreen(),
    ),
  ],
);
