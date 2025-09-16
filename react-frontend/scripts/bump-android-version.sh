#!/usr/bin/env bash
set -euo pipefail

# Increment versionCode in android/app/build.gradle.
# Optionally set versionName via: VERSION_NAME=1.0.1 scripts/bump-android-version.sh

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
GRADLE_FILE="$ROOT_DIR/android/app/build.gradle"

if [ ! -f "$GRADLE_FILE" ]; then
  echo "build.gradle not found: $GRADLE_FILE" >&2
  exit 1
fi

current_code=$(awk '/versionCode/{print $2; exit}' "$GRADLE_FILE")
if [[ -z "$current_code" ]]; then
  echo "Could not find versionCode in $GRADLE_FILE" >&2
  exit 1
fi
new_code=$((current_code + 1))

echo "Current versionCode: $current_code -> New: $new_code"

uname_s=$(uname -s)
if [[ "$uname_s" == "Darwin" ]]; then
  sed -i '' -E "s/(versionCode )[0-9]+/\\1${new_code}/" "$GRADLE_FILE"
else
  sed -i -E "s/(versionCode )[0-9]+/\\1${new_code}/" "$GRADLE_FILE"
fi

if [[ -n "${VERSION_NAME:-}" ]]; then
  echo "Setting versionName=$VERSION_NAME"
  if [[ "$uname_s" == "Darwin" ]]; then
    sed -i '' -E "s/(versionName \")[^"]+(\")/\\1${VERSION_NAME}\\2/" "$GRADLE_FILE"
  else
    sed -i -E "s/(versionName \")[^"]+(\")/\\1${VERSION_NAME}\\2/" "$GRADLE_FILE"
  fi
fi

echo "Done. Open $GRADLE_FILE to verify."

