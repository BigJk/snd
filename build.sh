#!/usr/bin/env bash
set -e

BUILD_TIME=$(date -Iseconds)
GO_VERSION=$(go version)
GIT_COMMIT=$(git rev-list -1 HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_DIR=${SND_RELEASE_DIR:='build/release/'}
APP_NAME=${SND_APP_NAME:='Sales & Dungeons'}
OSX_APP_BUNDLE_ENABLED=${SND_OSX_APP_BUNDLE_ENABLED:='false'}
OSX_APP_BUNDLE_DIR=${TARGET_DIR}

# if OSX_APP_BUNDLE_ENABLED we need to append /bundle to SND_RELEASE_DIR and APP_NAME needs to be snd
if [ "${OSX_APP_BUNDLE_ENABLED}" = "true" ]; then
  TARGET_DIR="${TARGET_DIR}bundle/"
  APP_NAME="snd"
fi

echo "Build Time  : ${BUILD_TIME}"
echo "Branch      : ${GIT_BRANCH}"
echo "Commit      : ${GIT_COMMIT}"
echo "Go Version  : ${GO_VERSION}"
echo "Build OS    : ${GOOS:=$(go env GOOS)}"
echo "Build Arch  : ${GOARCH:=$(go env GOARCH)}"
echo "Build Tags  : ${SND_TAGS}"
echo "CGO Enabled : ${CGO_ENABLED}"
echo "OSX Bundle  : ${OSX_APP_BUNDLE_ENABLED}"

echo "Clearing old data..."
rm -r ${TARGET_DIR}frontend || true
rm -r ${TARGET_DIR}data || true
rm ${TARGET_DIR}/* || true
mkdir -p ${TARGET_DIR}/frontend/dist ${TARGET_DIR}/data

echo "Building App..."
case "${GOOS}" in
  "windows") EXT=".exe" ;;
  *) EXT="" ;;
esac
LD_FLAGS="-X github.com/BigJk/snd.GitCommitHash=${GIT_COMMIT} -X github.com/BigJk/snd.GitBranch=${GIT_BRANCH} -X github.com/BigJk/snd.BuildTime=${BUILD_TIME}"

cd cmd/app
go build -ldflags "${LD_FLAGS}" -o app -tags "${SND_TAGS}"
cd ../..
mv cmd/app/app "${TARGET_DIR}/${APP_NAME}${EXT}"

echo "Copying frontend..."
cp -r frontend/dist ${TARGET_DIR}/frontend

echo "Copying resources..."
cp data/icon.png ${TARGET_DIR}/data/icon.png
cp data/icon.icns ${TARGET_DIR}/data/icon.icns

echo "Building version.txt..."
echo "Commit: ${GIT_COMMIT}" > ${TARGET_DIR}/version.txt
echo "Branch: ${GIT_BRANCH}" >> ${TARGET_DIR}/version.txt
echo "Build Time: ${BUILD_TIME}" >> ${TARGET_DIR}/version.txt

# if OSX_APP_BUNDLE_ENABLED we need to create a .app bundle
if [ "${OSX_APP_BUNDLE_ENABLED}" = "true" ]; then
  echo "Building OSX App Bundle..."

  wget -O ${OSX_APP_BUNDLE_DIR}/macapp.go https://gist.githubusercontent.com/mholt/11008646c95d787c30806d3f24b2c844/raw/53d1d4baeeb7ed8ee7dc89ebfd900e444a298323/macapp.go
  go run ${OSX_APP_BUNDLE_DIR}/macapp.go -assets "${TARGET_DIR}" -bin "snd" -icon "${TARGET_DIR}data/icon.png" -identifier app.sales-and-dungeons -name "Sales & Dungeons" -o ${OSX_APP_BUNDLE_DIR}

  # check if "Sales & Dungeons.app" exists
  if [ -d "${OSX_APP_BUNDLE_DIR}Sales & Dungeons.app" ]; then
    rm -r "${TARGET_DIR}"
    rm "${OSX_APP_BUNDLE_DIR}/macapp.go"
  else
    echo "Error: Failed to create app bundle"
    exit 1
  fi
fi
