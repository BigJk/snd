#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="${ROOT_DIR}/android"
TARGET_DIR=${SND_RELEASE_DIR:="${ROOT_DIR}/build/android"}
GRADLE_TASK=${SND_ANDROID_GRADLE_TASK:="assembleDebug"}
GRADLE_BIN=${SND_GRADLE:-""}
AAR_PATH=${SND_ANDROID_AAR:="${ANDROID_DIR}/app/libs/sndmobile.aar"}
SKIP_FRONTEND_BUILD=${SND_SKIP_FRONTEND_BUILD:="false"}
ANDROID_NDK_VERSION=${SND_ANDROID_NDK_VERSION:="26.3.11579264"}
ANDROID_API=${SND_ANDROID_API:="26"}
INSTALL_NDK=${SND_ANDROID_INSTALL_NDK:="false"}
ANDROID_SDK_DIR=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-"${HOME}/Library/Android/sdk"}}

BUILD_TIME=$(date -Iseconds)
GO_VERSION=$(go version)
GIT_COMMIT=$(git rev-list -1 HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Build Time   : ${BUILD_TIME}"
echo "Branch       : ${GIT_BRANCH}"
echo "Commit       : ${GIT_COMMIT}"
echo "Go Version   : ${GO_VERSION}"
echo "Target Dir   : ${TARGET_DIR}"
echo "Gradle Task  : ${GRADLE_TASK}"
if [ -n "${GRADLE_BIN}" ]; then
  echo "Gradle Bin   : ${GRADLE_BIN}"
fi
echo "AAR Path     : ${AAR_PATH}"
echo "Android SDK  : ${ANDROID_SDK_DIR}"
echo "Android NDK  : ${ANDROID_NDK_VERSION}"
echo "Android API  : ${ANDROID_API}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1"
    exit 1
  fi
}

require_command go
require_command gomobile

if [ ! -d "${ANDROID_SDK_DIR}" ]; then
  echo "Error: Android SDK not found at ${ANDROID_SDK_DIR}"
  echo "Set ANDROID_HOME or ANDROID_SDK_ROOT to your Android SDK path."
  exit 1
fi

export ANDROID_HOME="${ANDROID_SDK_DIR}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_DIR}"

if [ -n "${SND_ANDROID_NDK_HOME:-}" ]; then
  export ANDROID_NDK_HOME="${SND_ANDROID_NDK_HOME}"
fi

has_ndk() {
  if [ -d "${ANDROID_SDK_DIR}/ndk" ]; then
    return 0
  fi
  if [ -f "${ANDROID_SDK_DIR}/ndk-bundle/meta/platforms.json" ]; then
    return 0
  fi
  if [ -n "${ANDROID_NDK_HOME:-}" ] && [ -d "${ANDROID_NDK_HOME}" ]; then
    return 0
  fi
  return 1
}

if ! has_ndk; then
  SDKMANAGER="${ANDROID_SDK_DIR}/cmdline-tools/latest/bin/sdkmanager"
  if [ "${INSTALL_NDK}" = "true" ]; then
    if [ ! -x "${SDKMANAGER}" ]; then
      echo "Error: sdkmanager not found at ${SDKMANAGER}"
      echo "Install Android SDK Command-line Tools in Android Studio, then rerun this script."
      exit 1
    fi

    echo "Installing Android NDK ${ANDROID_NDK_VERSION}..."
    "${SDKMANAGER}" --install "ndk;${ANDROID_NDK_VERSION}"
  else
    echo "Error: Android NDK not found in ${ANDROID_SDK_DIR}."
    echo "Install it with:"
    echo "  ${SDKMANAGER} --install \"ndk;${ANDROID_NDK_VERSION}\""
    echo "Or rerun this script with SND_ANDROID_INSTALL_NDK=true."
    echo "For a custom NDK path, set SND_ANDROID_NDK_HOME=/path/to/ndk."
    exit 1
  fi
fi

if ! go list -m golang.org/x/mobile >/dev/null 2>&1; then
	echo "Error: gomobile requires golang.org/x/mobile in the module dependency graph."
	echo "Add it once with: go get -tool golang.org/x/mobile/cmd/gobind"
	exit 1
fi

echo "Preparing gomobile module graph..."
if ! GOOS=android GOARCH=arm64 go list -m -json -tags=android all >/dev/null; then
	echo "Error: Android module graph is not ready for gomobile."
	echo "Run this once with network access, then rerun the Android build:"
	echo "  GOOS=android GOARCH=arm64 go list -m -json -tags=android all >/dev/null"
	echo "If gomobile later reports an empty go.mod or missing module declaration, this preflight is the underlying step that failed."
	exit 1
fi

if [ "${SKIP_FRONTEND_BUILD}" != "true" ]; then
  require_command bun

  echo "Building frontend..."
  cd "${ROOT_DIR}/frontend"
  bun run build
fi

if [ ! -d "${ROOT_DIR}/frontend/dist" ]; then
  echo "Error: frontend/dist does not exist. Run frontend build first or unset SND_SKIP_FRONTEND_BUILD."
  exit 1
fi

echo "Building gomobile AAR..."
mkdir -p "$(dirname "${AAR_PATH}")"
cd "${ROOT_DIR}"
gomobile bind -target=android -androidapi "${ANDROID_API}" -o "${AAR_PATH}" ./mobile

echo "Building Android app..."
cd "${ANDROID_DIR}"
if [ -x "./gradlew" ]; then
  ./gradlew "${GRADLE_TASK}"
elif [ -n "${GRADLE_BIN}" ]; then
  "${GRADLE_BIN}" "${GRADLE_TASK}"
elif command -v gradle >/dev/null 2>&1; then
  gradle "${GRADLE_TASK}"
else
  echo "Error: Gradle not found."
  echo "Use one of these options:"
  echo "  1. Install Gradle and make it available on PATH."
  echo "  2. Generate and commit a Gradle wrapper under android/ as ./gradlew."
  echo "  3. Point this script at a Gradle binary with SND_GRADLE=/path/to/gradle."
  echo ""
  echo "On macOS with Homebrew, the quickest local setup is:"
  echo "  brew install gradle"
  exit 1
fi

echo "Collecting artifacts..."
mkdir -p "${TARGET_DIR}"
find "${ANDROID_DIR}/app/build/outputs" -type f \( -name "*.apk" -o -name "*.aab" \) -exec cp {} "${TARGET_DIR}/" \;

echo "Building version.txt..."
echo "Commit: ${GIT_COMMIT}" > "${TARGET_DIR}/version.txt"
echo "Branch: ${GIT_BRANCH}" >> "${TARGET_DIR}/version.txt"
echo "Build Time: ${BUILD_TIME}" >> "${TARGET_DIR}/version.txt"
echo "Gradle Task: ${GRADLE_TASK}" >> "${TARGET_DIR}/version.txt"

echo "Done. Artifacts are in ${TARGET_DIR}"
