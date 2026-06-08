import 'package:flutter/material.dart';

/// GlassPage 内容顶部的间距组件
/// 用于在 CustomScrollView 的第一个 sliver 位置添加 appbar 高度的间距
class GlassPageSpacer extends StatelessWidget {
  final double height;

  const GlassPageSpacer({super.key, this.height = 0});

  @override
  Widget build(BuildContext context) {
    final paddingTop = MediaQuery.of(context).viewPadding.top;
    // GlassAppBar 默认高度约 44px + 状态栏高度
    final spacerHeight = height > 0 ? height : paddingTop + 44 + 16;
    return SliverToBoxAdapter(
      child: SizedBox(height: spacerHeight),
    );
  }
}
