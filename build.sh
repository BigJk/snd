#!/usr/bin/env bash
set -e

BUILD_TIME=$(date -Iseconds)
GO_VERSION=$(go version)
GIT_COMMIT=$(git rev-list -1 HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_DIR=${SND_RELEASE_DIR:='build/release/'}
APP_NAME=${SND_APP_NAME:='Sales & Dungeons'}

echo "Build Time : ${BUILD_TIME}"
echo "Branch     : ${GIT_BRANCH}"
echo "Commit     : ${GIT_COMMIT}"
echo "Go Version : ${GO_VERSION}"
echo "Build OS   : ${GOOS:=$(go env GOOS)}"
echo "Build Arch : ${GOARCH:=$(go env GOARCH)}"
echo "Build Tags : ${SND_TAGS}"

echo "Clearing old data..."
rm -r ${TARGET_DIR}/frontend || true
rm -r ${TARGET_DIR}/data || true
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
