import 'package:flutter/material.dart';
import 'package:signals_flutter/signals_flutter.dart';
import 'router.dart';
import 'theme/app_theme.dart';
import 'screens/settings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class ThemeScope extends InheritedWidget {
  final Signal<ThemeType> themeType;
  final ValueChanged<ThemeType> onThemeChanged;

  const ThemeScope({
    super.key,
    required this.themeType,
    required this.onThemeChanged,
    required super.child,
  });

  static ThemeScope of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<ThemeScope>()!;
  }

  @override
  bool updateShouldNotify(ThemeScope oldWidget) {
    return themeType != oldWidget.themeType;
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final _themeType = signal(ThemeType.system);

  ThemeMode get _themeMode {
    switch (_themeType.value) {
      case ThemeType.light:
        return ThemeMode.light;
      case ThemeType.dark:
        return ThemeMode.dark;
      case ThemeType.system:
        return ThemeMode.system;
    }
  }

  void _onThemeChanged(ThemeType type) {
    setState(() {
      _themeType.value = type;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ThemeScope(
      themeType: _themeType,
      onThemeChanged: _onThemeChanged,
      child: MaterialApp.router(
        title: 'Package Repo',
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: _themeMode,
        routerConfig: router,
      ),
    );
  }
}
