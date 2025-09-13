#!/usr/bin/env bash
set -euo pipefail

# Builds a release AAB and APK for the Capacitor Android app.
# Ensure signing is configured in gradle.properties and app/build.gradle.

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT/react-frontend"

echo "[1/3] Building web bundle..."
npm ci
npm run build
npx cap copy android

echo "[2/3] Building Android AAB..."
cd android
./gradlew clean
./gradlew bundleRelease

echo "[3/3] Building Android APK..."
./gradlew assembleRelease

echo "Artifacts:"
echo " - AAB: $ROOT/react-frontend/android/app/build/outputs/bundle/release/app-release.aab"
echo " - APK: $ROOT/react-frontend/android/app/build/outputs/apk/release/app-release.apk"

