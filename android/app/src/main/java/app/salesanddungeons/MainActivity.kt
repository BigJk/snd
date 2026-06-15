package app.salesanddungeons

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import mobile.Mobile
import mobile.Server

class MainActivity : Activity() {
    private var sndServer: Server? = null
    private lateinit var filePickerBridge: AndroidFilePickerBridge
    private lateinit var webView: WebView
    private val serverUrl = "http://127.0.0.1:7123"
    private val viewportWidth = 1280

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        copyFrontendAssets()

        val usbBridge = AndroidUsbBridge(this)
        val bluetoothBridge = AndroidBluetoothBridge(this)
        val renderBridge = AndroidRenderBridge(this)
        filePickerBridge = AndroidFilePickerBridge(this)
        sndServer =
            Mobile.newServerWithAndroidBridges(
                filesDir.absolutePath,
                usbBridge,
                bluetoothBridge,
                renderBridge,
                filePickerBridge,
            ).also {
                it.start("127.0.0.1:7123", false)
            }

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.useWideViewPort = true
        webView.settings.loadWithOverviewMode = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = true
        webView.settings.setSupportMultipleWindows(false)
        webView.settings.textZoom = 90
        webView.setInitialScale(75)
        webView.webViewClient =
            object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest,
                ): Boolean = openExternalUrlIfNeeded(request.url)

                override fun onPageFinished(view: WebView, url: String) {
                    view.evaluateJavascript(
                        """
                        document.querySelector('meta[name="viewport"]')
                          ?.setAttribute('content', 'width=$viewportWidth, initial-scale=1');
                        window.open = function(url) {
                          if (url) window.location.href = url;
                          return null;
                        };
                        """.trimIndent(),
                        null,
                    )
                }
            }
        setContentView(webView)

        loadWhenServerIsReady()
    }

    override fun onDestroy() {
        sndServer?.stop()
        webView.destroy()
        super.onDestroy()
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
            return
        }

        AlertDialog.Builder(this)
            .setTitle("Close Sales & Dungeons?")
            .setMessage("Are you sure you want to close the app?")
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Close") { _, _ -> finish() }
            .show()
    }

    private fun copyFrontendAssets() {
        val target = File(filesDir, "frontend/dist")
        if (target.exists()) {
            target.deleteRecursively()
        }

        target.mkdirs()
        copyAssetDirectory("", target)
    }

    private fun copyAssetDirectory(assetPath: String, target: File) {
        val entries = assets.list(assetPath).orEmpty()
        if (entries.isEmpty()) {
            target.outputStream().use { output ->
                assets.open(assetPath).use { input -> input.copyTo(output) }
            }
            return
        }

        target.mkdirs()
        entries.forEach { entry ->
            val childAssetPath = if (assetPath.isEmpty()) entry else "$assetPath/$entry"
            copyAssetDirectory(childAssetPath, File(target, entry))
        }
    }

    private fun loadWhenServerIsReady(attempt: Int = 0) {
        Thread {
            if (isServerReady()) {
                runOnUiThread { webView.loadUrl(serverUrl) }
            } else if (attempt < 40) {
                webView.postDelayed({ loadWhenServerIsReady(attempt + 1) }, 250)
            } else {
                runOnUiThread {
                    webView.loadData(
                        "Sales & Dungeons server did not start.",
                        "text/plain",
                        "UTF-8",
                    )
                }
            }
        }.start()
    }

    private fun isServerReady(): Boolean =
        try {
            val connection = URL(serverUrl).openConnection() as HttpURLConnection
            connection.connectTimeout = 500
            connection.readTimeout = 500
            connection.requestMethod = "GET"
            connection.responseCode in 200..499
        } catch (_: Exception) {
            false
        }

    private fun openExternalUrlIfNeeded(uri: Uri): Boolean {
        if (uri.scheme == "http" && (uri.host == "127.0.0.1" || uri.host == "localhost")) {
            return false
        }

        if (uri.scheme == "http" || uri.scheme == "https") {
            return try {
                startActivity(Intent(Intent.ACTION_VIEW, uri))
                true
            } catch (_: Exception) {
                false
            }
        }

        return false
    }

    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        if (::filePickerBridge.isInitialized && filePickerBridge.onActivityResult(requestCode, resultCode, data)) {
            return
        }

        super.onActivityResult(requestCode, resultCode, data)
    }
}
