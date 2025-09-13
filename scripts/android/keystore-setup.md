# Android Release Signing (Capacitor)

## 1) Generate keystore

```bash
keytool -genkey -v -keystore my-release-key.jks -alias readandlead \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep the file safe and remember both store and key passwords.

## 2) Add Gradle properties

Edit `react-frontend/android/gradle.properties` (create if missing):

```
MYAPP_UPLOAD_STORE_FILE=my-release-key.jks
MYAPP_UPLOAD_KEY_ALIAS=readandlead
MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

Place `my-release-key.jks` under `react-frontend/android/` (or an absolute path, then update `MYAPP_UPLOAD_STORE_FILE`).

## 3) Wire signing in build.gradle

Edit `react-frontend/android/app/build.gradle` inside the `android {}` block:

```
signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## 4) Build

```bash
cd react-frontend/android
./gradlew clean
# Bundle (recommended for stores)
./gradlew bundleRelease
# or APK
./gradlew assembleRelease
```

Artifacts:
- AAB: `react-frontend/android/app/build/outputs/bundle/release/app-release.aab`
- APK: `react-frontend/android/app/build/outputs/apk/release/app-release.apk`

## 5) SHA-1 fingerprint (for provider consoles)

```bash
keytool -list -v -keystore my-release-key.jks -alias readandlead
```

Register this SHA-1 along with your package name `com.readandlead.app` in Kakao/Google if required.

