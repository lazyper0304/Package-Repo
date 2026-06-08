import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' hide GlassCard;

class GlassPage extends StatelessWidget {
  final String title;
  final bool centerTitle;
  final Widget Function(double appbarHeight) builder;
  final List<Widget>? actions;
  final VoidCallback? onBack;
  final Color? backgroundColor;
  final double edgeSize;

  const GlassPage({
    super.key,
    required this.title,
    this.centerTitle = true,
    required this.builder,
    this.actions,
    this.onBack,
    this.backgroundColor,
    this.edgeSize = 120,
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
      title: Text(
        title,
        style: theme.textTheme.titleLarge,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      actions: actions,
    );

    return GlassScaffold(
      appBar: appBar,
      appBarHeight: 44.0,
      backgroundColor: backgroundColor,
      topEdgeFadeExtent: edgeSize,
      bottomEdgeFadeExtent: edgeSize,
      edgeFade: true,
      edgeStyle: GlassScrollEdgeStyle.hard,
      body: Builder(builder: (context) => builder(appbarHeight)),
    );
  }
}
