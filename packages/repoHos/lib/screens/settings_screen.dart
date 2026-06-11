import 'package:flutter/material.dart';
import 'package:signals_flutter/signals_flutter.dart';
import 'package:liquid_glass_widgets/liquid_glass_widgets.dart' hide GlassCard;
import '../widgets/glass_card.dart';

enum ThemeType {
  system('跟随系统', Icons.brightness_auto),
  light('浅色', Icons.light_mode),
  dark('深色', Icons.dark_mode);

  final String label;
  final IconData icon;
  const ThemeType(this.label, this.icon);
}

class SettingsScreen extends StatelessWidget {
  final Signal<ThemeType> themeType;
  final ValueChanged<ThemeType> onThemeChanged;

  const SettingsScreen({
    super.key,
    required this.themeType,
    required this.onThemeChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(theme, '外观'),
          const SizedBox(height: 12),
          Watch((context) => Row(
            children: ThemeType.values.map((type) {
              final isActive = themeType.value == type;
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: type != ThemeType.values.last ? 8 : 0,
                  ),
                  child: ThemeCard(
                    label: type.label,
                    icon: type.icon,
                    active: isActive,
                    onTap: () => onThemeChanged(type),
                  ),
                ),
              );
            }).toList(),
          )),
          const SizedBox(height: 24),
          _buildSectionHeader(theme, '关于'),
          const SizedBox(height: 12),
          GlassCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _buildSettingTile(
                theme,
                icon: Icons.info_outline,
                title: '应用名称',
                subtitle: 'Package Repo',
              ),
              _buildDivider(),
              _buildSettingTile(
                theme,
                icon: Icons.tag,
                title: '版本',
                subtitle: '1.0.0',
              ),
              _buildDivider(),
              _buildSettingTile(
                theme,
                icon: Icons.dns_outlined,
                title: '数据来源',
                subtitle: 'shenjack',
              ),
            ],
          ),
        ),
      ],
    ),
    );
  }

  Widget _buildSectionHeader(ThemeData theme, String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: theme.textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildSettingTile(
    ThemeData theme, {
    required IconData icon,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: SettingIcon(icon: icon),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      onTap: onTap,
    );
  }

  Widget _buildDivider() {
    return const Divider(
      height: 1,
      indent: 56,
    );
  }
}

class SettingIcon extends StatelessWidget {
  final IconData icon;
  final double size;

  const SettingIcon({
    required this.icon,
    this.size = 32,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        icon,
        size: size * 0.5,
        color: theme.colorScheme.onPrimary,
      ),
    );
  }
}

class ThemeCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;

  const ThemeCard({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      clipBehavior: Clip.antiAlias,
      borderRadius: BorderRadius.circular(20),
      color: active
          ? theme.colorScheme.secondary.withAlpha(33)
          : theme.scaffoldBackgroundColor,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: theme.iconTheme.color),
              const SizedBox(height: 12),
              Text(label, style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
      ),
    );
  }
}
