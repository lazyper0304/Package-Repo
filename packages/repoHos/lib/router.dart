import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'screens/home_screen.dart';
import 'screens/app_detail_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final router = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return HomeScreen(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const SizedBox.shrink(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/ranking',
              builder: (context, state) => const SizedBox.shrink(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/settings',
              builder: (context, state) => const SizedBox.shrink(),
            ),
          ],
        ),
      ],
    ),
    GoRoute(
      path: '/app/:appId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final appId = state.pathParameters['appId']!;
        final iconUrl = state.uri.queryParameters['icon'];
        return AppDetailScreen(appId: appId, iconUrl: iconUrl);
      },
    ),
  ],
);
