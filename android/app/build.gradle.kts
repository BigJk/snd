plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "app.salesanddungeons"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.salesanddungeons"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets["main"].assets.srcDir("../../frontend/dist")
}

dependencies {
    implementation(files("libs/sndmobile.aar"))
}
