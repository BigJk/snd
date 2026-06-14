package app.salesanddungeons

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.webkit.WebView
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebViewClient
import java.io.ByteArrayOutputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import kotlin.math.ceil
import mobile.RendererBridge
import org.json.JSONObject

class AndroidRenderBridge(private val activity: Activity) : RendererBridge {
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun renderURL(url: String, width: Int): ByteArray {
        val result = AtomicReference<Result<ByteArray>>()
        val latch = CountDownLatch(1)

        mainHandler.post {
            val density = activity.resources.displayMetrics.density.coerceAtLeast(1f)
            val layoutWidth = ceil(width * density).toInt()
            val webView = createWebView(layoutWidth)
            webView.webViewClient =
                object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView,
                        request: WebResourceRequest,
                        error: WebResourceError,
                    ) {
                        if (request.isForMainFrame) {
                            result.set(Result.failure(IllegalStateException("WebView render failed: ${error.description}")))
                            destroyWebView(view)
                            latch.countDown()
                        }
                    }

                    override fun onPageFinished(view: WebView, loadedUrl: String) {
                        waitForSelector(
                            webView = view,
                            selector = "#content",
                            ready = { capturePng(view, width, density, result, latch) },
                            failed = { err ->
                                result.set(Result.failure(err))
                                destroyWebView(view)
                                latch.countDown()
                            },
                        )
                    }
                }
            webView.loadUrl(url)
        }

        if (!latch.await(20, TimeUnit.SECONDS)) {
            throw IllegalStateException("Timed out while rendering URL")
        }

        return result.get().getOrThrow()
    }

    override fun extractHTML(url: String, selector: String): String {
        val result = AtomicReference<Result<String>>()
        val latch = CountDownLatch(1)

        mainHandler.post {
            val webView = createWebView(1280)
            webView.webViewClient =
                object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView,
                        request: WebResourceRequest,
                        error: WebResourceError,
                    ) {
                        if (request.isForMainFrame) {
                            result.set(Result.failure(IllegalStateException("WebView HTML extraction failed: ${error.description}")))
                            destroyWebView(view)
                            latch.countDown()
                        }
                    }

                    override fun onPageFinished(view: WebView, loadedUrl: String) {
                        waitForSelector(
                            webView = view,
                            selector = selector,
                            ready = {
                                val selectorJson = JSONObject.quote(selector)
                                view.evaluateJavascript(
                                    "document.querySelector($selectorJson)?.outerHTML || ''",
                                ) { htmlJson ->
                                    val html = htmlJson?.let { JSONObject("{" + "\"value\":" + it + "}").getString("value") }.orEmpty()
                                    result.set(Result.success(html))
                                    destroyWebView(view)
                                    latch.countDown()
                                }
                            },
                            failed = { err ->
                                result.set(Result.failure(err))
                                destroyWebView(view)
                                latch.countDown()
                            },
                        )
                    }
                }
            webView.loadUrl(url)
        }

        if (!latch.await(20, TimeUnit.SECONDS)) {
            throw IllegalStateException("Timed out while extracting HTML")
        }

        return result.get().getOrThrow()
    }

    private fun createWebView(width: Int): WebView {
        val webView = WebView(activity)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.allowContentAccess = true
        webView.settings.useWideViewPort = false
        webView.settings.loadWithOverviewMode = false
        webView.isHorizontalScrollBarEnabled = false
        webView.isVerticalScrollBarEnabled = false
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.setBackgroundColor(Color.WHITE)
        webView.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        webView.alpha = 0.01f
        webView.translationX = -100_000f

        val params = FrameLayout.LayoutParams(width, 10_000)
        activity.addContentView(webView, params)
        webView.measure(
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(10_000, View.MeasureSpec.EXACTLY),
        )
        webView.layout(0, 0, width, 10_000)
        return webView
    }

    private fun destroyWebView(webView: WebView) {
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
    }

    private fun waitForSelector(
        webView: WebView,
        selector: String,
        attempts: Int = 0,
        ready: () -> Unit,
        failed: (Throwable) -> Unit,
    ) {
        val selectorJson = JSONObject.quote(selector)
        webView.evaluateJavascript("document.querySelector($selectorJson) !== null") { value ->
            if (value == "true") {
                ready()
            } else if (attempts < 40) {
                webView.postDelayed({ waitForSelector(webView, selector, attempts + 1, ready, failed) }, 250)
            } else {
                failed(IllegalStateException("Timed out waiting for selector: $selector"))
            }
        }
    }

    private fun capturePng(
        webView: WebView,
        width: Int,
        density: Float,
        result: AtomicReference<Result<ByteArray>>,
        latch: CountDownLatch,
    ) {
        webView.evaluateJavascript(
            """
            (() => {
              let viewport = document.querySelector('meta[name="viewport"]');
              if (!viewport) {
                viewport = document.createElement('meta');
                viewport.setAttribute('name', 'viewport');
                document.head.appendChild(viewport);
              }
              viewport.setAttribute('content', 'width=$width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no');
              document.documentElement.style.width = '${width}px';
              document.body.style.width = '${width}px';
              document.body.style.overflow = 'hidden';
              document.documentElement.style.overflow = 'hidden';
              const content = document.querySelector('#content') || document.body;
              content.style.width = '${width}px';
              content.style.maxWidth = '${width}px';
              content.style.overflow = 'hidden';
              const rect = content.getBoundingClientRect();
              const styles = window.getComputedStyle(content);
              const marginTop = parseFloat(styles.marginTop) || 0;
              const marginBottom = parseFloat(styles.marginBottom) || 0;
              return Math.ceil(Math.max(content.scrollHeight, rect.height) + marginTop + marginBottom);
            })()
            """.trimIndent(),
        ) { heightJson ->
            try {
                val height = heightJson.trim('"').toInt().coerceIn(1, 10_000)
                val layoutWidth = ceil(width * density).toInt()
                val layoutHeight = ceil(height * density).toInt()
                webView.measure(
                    android.view.View.MeasureSpec.makeMeasureSpec(layoutWidth, android.view.View.MeasureSpec.EXACTLY),
                    android.view.View.MeasureSpec.makeMeasureSpec(layoutHeight, android.view.View.MeasureSpec.EXACTLY),
                )
                webView.layout(0, 0, layoutWidth, layoutHeight)
                webView.postDelayed(
                    {
                        try {
                            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                            val canvas = Canvas(bitmap)
                            canvas.drawColor(Color.WHITE)
                            canvas.scale(1f / density, 1f / density)
                            webView.draw(canvas)

                            val output = ByteArrayOutputStream()
                            bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)
                            bitmap.recycle()

                            result.set(Result.success(output.toByteArray()))
                        } catch (err: Throwable) {
                            result.set(Result.failure(err))
                        } finally {
                            destroyWebView(webView)
                            latch.countDown()
                        }
                    },
                    250,
                )
            } catch (err: Throwable) {
                result.set(Result.failure(err))
                destroyWebView(webView)
                latch.countDown()
            }
        }
    }
}
