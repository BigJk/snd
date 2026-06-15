fun requiredEnv(name: String): String =
    System.getenv(name)
        ?: error("Missing required environment variable: $name")

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

    signingConfigs {
        create("release") {
            storeFile = file(requiredEnv("ANDROID_KEYSTORE_PATH"))
            storePassword = requiredEnv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias = requiredEnv("ANDROID_KEY_ALIAS")
            keyPassword = requiredEnv("ANDROID_KEY_PASSWORD")
        }
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets["main"].assets.srcDir("../../frontend/dist")
}
