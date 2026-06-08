import 'package:flutter/material.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' as lg;

class AppGlassSettings {
  static const standard = lg.LiquidGlassSettings(
    blur: 20,
    thickness: 10,
    glassColor: Color(0x1AFFFFFF),
    lightAngle: 135,
    lightIntensity: 0.6,
    ambientStrength: 0.4,
    saturation: 1.2,
    refractiveIndex: 1.5,
    chromaticAberration: 0.5,
  );

  static const surface = lg.LiquidGlassSettings(
    blur: 15,
    thickness: 6,
    glassColor: Color(0x14FFFFFF),
    lightAngle: 135,
    lightIntensity: 0.4,
    ambientStrength: 0.3,
    saturation: 1.0,
    refractiveIndex: 1.2,
    chromaticAberration: 0.3,
  );

  static const bar = lg.LiquidGlassSettings(
    blur: 25,
    thickness: 12,
    glassColor: Color(0x22FFFFFF),
    lightAngle: 135,
    lightIntensity: 0.5,
    ambientStrength: 0.4,
    saturation: 1.1,
    refractiveIndex: 1.4,
    chromaticAberration: 0.4,
  );
}

/// 自定义 GlassCard，支持 color 属性
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final lg.LiquidGlassSettings? settings;
  final double borderRadius;
  final Color? color;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.settings,
    this.borderRadius = 16,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: color != null
          ? BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(borderRadius),
            )
          : null,
      child: lg.GlassCard(
        padding: padding ?? const EdgeInsets.all(16),
        shape: lg.LiquidRoundedSuperellipse(borderRadius: borderRadius),
        useOwnLayer: settings != null,
        settings: settings,
        child: child,
      ),
    );
  }
}
