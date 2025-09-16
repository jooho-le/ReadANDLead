Android Release Workflow (Capacitor)

1) Update API/env if needed
- Edit `react-frontend/.env.production` (e.g., `REACT_APP_API_URL`).
- Build web and sync: `npm run build:android` from `react-frontend`.

2) Bump versionCode (required for every store upload)
- `cd react-frontend`
- `npm run android:bump`
- Optionally set versionName: `VERSION_NAME=1.0.1 npm run android:bump`.

3) Build signed artifacts with the right JDK
- `npm run apk:release` (APK)
- `npm run aab:release` (AAB)
- or both: `npm run android:release`

Notes
- The scripts prefer Android Studio's embedded JDK 17. Ensure keystore signing is configured in Android Studio when generating from the IDE, or sign via Play Signing alternatives if applicable to other stores.
- Output paths:
  - APK: `react-frontend/android/app/build/outputs/apk/release/app-release.apk`
  - AAB: `react-frontend/android/app/build/outputs/bundle/release/app-release.aab`
- Package name is set to `com.oman.readandlead`. Changing it requires `npx cap sync android` and updating Java package paths.

