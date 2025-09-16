#!/usr/bin/env bash
set -euo pipefail

# Build signed Android artifacts with a consistent JDK.
# Usage: scripts/android-release.sh [apk|aab|both]

MODE=${1:-both}

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
ANDROID_DIR="$ROOT_DIR/android"

# Prefer Android Studio's embedded JDK 17
AS_JAVA="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [ -d "$AS_JAVA" ]; then
  export JAVA_HOME="$AS_JAVA"
else
  echo "[warn] Android Studio JDK not found at $AS_JAVA"
  echo "[warn] Falling back to current JAVA_HOME=${JAVA_HOME:-unset}. Ensure it's JDK 17."
fi

cd "$ANDROID_DIR"

./gradlew --no-daemon clean

case "$MODE" in
  apk)
    ./gradlew --no-daemon assembleRelease
    echo "APK: $ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
    ;;
  aab)
    ./gradlew --no-daemon bundleRelease
    echo "AAB: $ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
    ;;
  both)
    ./gradlew --no-daemon assembleRelease
    ./gradlew --no-daemon bundleRelease
    echo "APK: $ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
    echo "AAB: $ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
    ;;
  *)
    echo "Unknown mode: $MODE (use apk|aab|both)" >&2
    exit 1
    ;;
esac

