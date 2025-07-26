# Running VIB3 App - Complete Instructions

## Prerequisites
1. Backend server must be running
2. MongoDB must be running (if using local database)
3. Flutter app configured with correct server URL

## Step 1: Start the Backend Server

Open a new terminal in the VIB3 root directory (not vib3_app):

```bash
cd C:\Users\VIBE\Desktop\VIB3
npm start
```

Or for MongoDB version:
```bash
npm run start:mongodb
```

The server should start on port 3000. You should see:
```
🚀 VIB3 Server starting...
🌐 Server running on http://localhost:3000
```

## Step 2: Update Flutter App Configuration (if needed)

If running locally, update `lib/config/app_config.dart`:

```dart
static String get baseUrl => 'http://192.168.1.100:3000'; // Replace with your PC's IP
```

To find your PC's IP address:
- Windows: Run `ipconfig` in Command Prompt
- Look for "IPv4 Address" under your network adapter

## Step 3: Run the Flutter App

In the vib3_app directory:

```bash
cd C:\Users\VIBE\Desktop\VIB3\vib3_app
flutter run
```

## Troubleshooting

### API Timeout Errors
- Ensure backend server is running
- Check your PC's IP address is correct in app_config.dart
- Disable Windows Firewall temporarily for testing
- Make sure both devices are on the same network

### Videos Not Loading
- Check MongoDB is running (if using local DB)
- Ensure DigitalOcean Spaces credentials are set in .env
- Verify video URLs are accessible

### Black Screen Issues
- Videos should now work with the direct initialization fix
- If still black, check console for initialization errors

## Current Status
✅ Video player initialization fixed (bypassed queue)
✅ Buffer overflow protection added
✅ Performance monitoring active
❌ Backend server needs to be running for videos to load

## Quick Test
1. Start backend: `npm start` (in VIB3 root)
2. Run app: `flutter run` (in vib3_app)
3. Login with test credentials or create account
4. Videos should load and play automatically