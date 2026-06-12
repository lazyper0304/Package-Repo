import 'dart:ui';
import 'package:flutter/material.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius = 16,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Widget card = Container(
      margin: margin,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            padding: padding ?? const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.08)
                  : Colors.white.withOpacity(0.6),
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(
                color: isDark
                    ? Colors.white.withOpacity(0.1)
                    : Colors.white.withOpacity(0.3),
              ),
            ),
            child: child,
          ),
        ),
      ),
    );

    if (onTap != null) {
      card = GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: card,
      );
    }

    return card;
  }
}
