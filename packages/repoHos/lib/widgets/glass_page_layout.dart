import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' hide GlassCard;

/// 通用的 Glass 页面组件
/// 内部自动处理 appbar 高度间距，外部只需传入页面内容
class GlassPageLayout extends StatelessWidget {
  final String title;
  final bool centerTitle;
  final Widget child;
  final List<Widget>? actions;
  final VoidCallback? onBack;
  final Color? backgroundColor;
  final double edgeSize;
  final bool extendBody;

  const GlassPageLayout({
    super.key,
    required this.title,
    this.centerTitle = true,
    required this.child,
    this.actions,
    this.onBack,
    this.backgroundColor,
    this.edgeSize = 120,
    this.extendBody = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
      extendBody: extendBody,
      body: child,
    );
  }
}
