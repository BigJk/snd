package app.salesanddungeons

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import mobile.Mobile
import mobile.Server

class MainActivity : Activity() {
    private var sndServer: Server? = null
    private lateinit var webView: WebView
    private val serverUrl = "http://127.0.0.1:7123"
    private val viewportWidth = 1280

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        copyFrontendAssets()

        val usbBridge = AndroidUsbBridge(this)
        val renderBridge = AndroidRenderBridge(this)
        sndServer = Mobile.newServerWithRenderer(filesDir.absolutePath, usbBridge, renderBridge).also {
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
        webView.settings.textZoom = 90
        webView.setInitialScale(75)
        webView.webViewClient =
            object : WebViewClient() {
                override fun onPageFinished(view: WebView, url: String) {
                    view.evaluateJavascript(
                        """
                        document.querySelector('meta[name="viewport"]')
                          ?.setAttribute('content', 'width=$viewportWidth, initial-scale=1');
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

    private fun copyFrontendAssets() {
        val target = File(filesDir, "frontend/dist")
        if (target.exists()) {
            return
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
}
