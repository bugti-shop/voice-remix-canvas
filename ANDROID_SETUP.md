# Android Setup Guide for Npd

This guide covers the required Android permissions and setup for push notifications and voice recording.

## Prerequisites

1. Android Studio installed
2. Project exported to GitHub and cloned locally
3. Run `npm install` to install dependencies
4. Run `npx cap add android` to add Android platform
5. Run `npx cap sync` to sync the project

## Android Manifest Permissions

After running `npx cap add android`, you need to add the following permissions to your `android/app/src/main/AndroidManifest.xml` file:

### Required Permissions

Add these permissions inside the `<manifest>` tag, before `<application>`:

```xml
<!-- Push Notifications -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Voice Recording -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

<!-- Local Notifications -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Internet (usually already present) -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Storage for voice recordings -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Full AndroidManifest.xml Example

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Push Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <!-- Voice Recording -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <!-- Local Notifications -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />

    <!-- Internet -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Storage -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <!-- Your activities and other components here -->
        
    </application>

</manifest>
```

## Push Notifications Setup

### Firebase Cloud Messaging (FCM) Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Add an Android app with your package name: `app.lovable.c4920824037c4205bb9ed6cc0d5a0385`
4. Download `google-services.json` and place it in `android/app/`
5. Add Firebase dependencies to `android/app/build.gradle`:

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.0.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

6. Add Google services plugin to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

7. Apply plugin in `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

## Voice Recording Setup

Voice recording uses the Web Audio API on the web and native permissions on Android. The `RECORD_AUDIO` permission is required.

### Runtime Permission Request

Android 6.0+ requires runtime permission requests. The app will automatically request microphone permission when the user tries to record.

## Local Notifications Setup

Local notifications require the following in your `capacitor.config.ts`:

```typescript
plugins: {
  LocalNotifications: {
    smallIcon: "ic_stat_icon_config_sample",
    iconColor: "#488AFF",
  },
}
```

### Notification Icons

Place your notification icon in:
- `android/app/src/main/res/drawable/ic_stat_icon_config_sample.png`

## Building the App

1. Sync your project: `npx cap sync android`
2. Open in Android Studio: `npx cap open android`
3. Build and run from Android Studio

## Troubleshooting

### Notifications not showing
- Ensure `POST_NOTIFICATIONS` permission is granted (Android 13+)
- Check that the app is not in battery optimization mode

### Voice recording not working
- Ensure `RECORD_AUDIO` permission is granted
- Check microphone is not being used by another app

### Push notifications not registering
- Verify `google-services.json` is in the correct location
- Check Firebase project configuration matches your app ID
