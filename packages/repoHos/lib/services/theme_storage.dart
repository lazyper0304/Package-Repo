import 'package:flutter/services.dart';
import 'package:hive/hive.dart';

class ThemeStorage {
  static const _channel = MethodChannel('com.repo.hos/storage');
  static const _boxName = 'settings';
  static const _themeKey = 'themeMode';
  static bool _initialized = false;
  static Box? _box;
  static String _fallback = 'system';

  static Future<void> init() async {
    if (_initialized) return;
    try {
      final dir = await _channel.invokeMethod('getFilesDir') as String;
      Hive.init(dir);
      _box = await Hive.openBox(_boxName);
      _initialized = true;
    } catch (_) {
      _initialized = false;
    }
  }

  static String getThemeMode() {
    if (!_initialized || _box == null) return _fallback;
    return (_box!.get(_themeKey) as String?) ?? 'system';
  }

  static Future<void> setThemeMode(String mode) async {
    _fallback = mode;
    if (!_initialized || _box == null) return;
    await _box!.put(_themeKey, mode);
  }
}
