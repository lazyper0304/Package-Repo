import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' hide GlassCard;

class HeaderAppBarAction {
  final IconData? icon;
  final VoidCallback? onTap;
  final Widget? widget;

  const HeaderAppBarAction({this.icon, this.onTap, this.widget})
      : assert(
          widget != null || (icon != null && onTap != null),
          'Either widget or icon+onTap must be provided',
        );
}

class GlassPage extends StatelessWidget {
  final String title;
  final bool centerTitle;
  final List<Widget> Function() builder;
  final List<HeaderAppBarAction>? action;
  final VoidCallback? onBack;
  final Color? backgroundColor;
  final VoidCallback? onTap;
  final double edgeSize;
  final ScrollController? scrollController;
  final Widget? bottomBar;
  final bool extendBody;

  const GlassPage({
    super.key,
    required this.title,
    this.centerTitle = true,
    required this.builder,
    this.action,
    this.onBack,
    this.backgroundColor,
    this.onTap,
    this.edgeSize = 120,
    this.scrollController,
    this.bottomBar,
    this.extendBody = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final paddingTop = MediaQuery.of(context).viewPadding.top;
    final double appbarHeight = max(91, kToolbarHeight + paddingTop + 16);

    final appBar = GlassAppBar(
      centerTitle: centerTitle,
      leading: onBack != null
          ? IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: onBack,
            )
          : (context.canPop()
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () => context.pop(),
                )
              : null),
      title: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Text(
          title,
          style: theme.textTheme.titleLarge,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
        ),
      ),
      actions: action
          ?.map(
            (e) =>
                e.widget ??
                IconButton(
                  onPressed: e.onTap,
                  icon: Icon(e.icon, size: 20),
                  color: theme.textTheme.titleLarge?.color,
                ),
          )
          .toList(),
    );

    return GlassScaffold(
      appBar: appBar,
      appBarHeight: 44.0,
      backgroundColor: backgroundColor,
      topEdgeFadeExtent: edgeSize,
      bottomEdgeFadeExtent: edgeSize,
      edgeFade: true,
      edgeStyle: GlassScrollEdgeStyle.hard,
      bottomBar: bottomBar,
      extendBody: extendBody,
      body: CustomScrollView(
        controller: scrollController,
        slivers: [
          SliverToBoxAdapter(child: SizedBox(height: appbarHeight)),
          ...builder(),
        ],
      ),
    );
  }
}
