import 'package:permission_handler/permission_handler.dart';

class PermissionsService {
  static Future<bool> requestCameraPermission() async {
    final PermissionStatus permission = await Permission.camera.request();
    return permission == PermissionStatus.granted;
  }

  static Future<bool> requestMicrophonePermission() async {
    final PermissionStatus permission = await Permission.microphone.request();
    return permission == PermissionStatus.granted;
  }

  static Future<bool> requestStoragePermission() async {
    final PermissionStatus permission = await Permission.storage.request();
    return permission == PermissionStatus.granted;
  }

  static Future<bool> requestPhotosPermission() async {
    final PermissionStatus permission = await Permission.photos.request();
    return permission == PermissionStatus.granted;
  }

  static Future<bool> requestAllVideoPermissions() async {
    final Map<Permission, PermissionStatus> permissions = await [
      Permission.camera,
      Permission.microphone,
      Permission.storage,
      Permission.photos,
    ].request();

    return permissions.values.every((status) => status == PermissionStatus.granted);
  }

  static Future<bool> checkCameraPermission() async {
    return await Permission.camera.isGranted;
  }

  static Future<bool> checkMicrophonePermission() async {
    return await Permission.microphone.isGranted;
  }

  static Future<bool> checkStoragePermission() async {
    return await Permission.storage.isGranted;
  }

  static Future<bool> checkPhotosPermission() async {
    return await Permission.photos.isGranted;
  }

  static Future<void> openAppSettings() async {
    await openAppSettings();
  }
}