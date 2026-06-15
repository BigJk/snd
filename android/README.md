# Android Host

This directory contains the native Android shell for Sales & Dungeons. It starts
the Go web server on `127.0.0.1:7123`, displays it in a `WebView`, and delegates
raw USB printer writes to Kotlin through Android's USB host APIs.

Build the frontend first:

```sh
cd frontend
bun run build
```

Gradle packages `frontend/dist` as Android assets. On first app launch those
assets are copied into `filesDir/frontend/dist`, which matches the path expected
by the Go server.

Build the gomobile AAR from the repository root:

```sh
go get -tool golang.org/x/mobile/cmd/gobind
gomobile bind -target=android -androidapi 26 -o android/app/libs/sndmobile.aar ./mobile
```

`gomobile bind` needs the Android NDK installed in the SDK. The build script
checks for it before compiling. Install the default NDK version with:

```sh
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager --install "ndk;26.3.11579264"
```

If Android SDK Command-line Tools are not installed yet, install them through
Android Studio first. To let the build script install the NDK, run:

```sh
SND_ANDROID_INSTALL_NDK=true ./build_android.sh
```

Then build or run the Android app:

```sh
cd android
./gradlew assembleDebug
```

If the project does not have a Gradle wrapper yet, install Gradle or point the
build script at a specific binary:

```sh
brew install gradle
# or
SND_GRADLE=/path/to/gradle ./build_android.sh
```

From the repository root, `build_android.sh` runs the frontend build, gomobile
binding, Gradle task, and artifact collection in one step:

```sh
./build_android.sh
```

The script passes `-androidapi 26` to `gomobile bind` by default because modern
NDK versions no longer support gomobile's older API 16 default. Override it with
`SND_ANDROID_API=...` if the app `minSdk` changes.

If `gomobile` reports an empty `go.mod` or `missing module declaration`, the
Android module graph failed before gomobile wrote its temporary module files.
Run the preflight directly to see the real dependency error:

```sh
GOOS=android GOARCH=arm64 go list -m -json -tags=android all >/dev/null
```

The Android printer appears in S&D as `Android USB Printing`. Endpoint values use
the same `vendor_id:product_id:endpoint_address` shape as the desktop raw USB
printer, for example `0416:5011:03`.
