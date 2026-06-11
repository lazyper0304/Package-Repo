import { FlutterAbility, FlutterEngine, MethodChannel, MethodCall, MethodResult } from '@ohos/flutter_ohos';
import { GeneratedPluginRegistrant } from '../plugins/GeneratedPluginRegistrant';

const CHANNEL = "com.repo.hos/storage";

export default class EntryAbility extends FlutterAbility {
  configureFlutterEngine(flutterEngine: FlutterEngine) {
    super.configureFlutterEngine(flutterEngine)
    GeneratedPluginRegistrant.registerWith(flutterEngine)

    const context = this.context;
    new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL)
      .setMethodCallHandler({
        onMethodCall(call: MethodCall, result: MethodResult) {
          if (call.method === "getFilesDir") {
            const dir = context.filesDir;
            result.success(dir);
          } else {
            result.notImplemented();
          }
        }
      });
  }
}
