package app.salesanddungeons

import android.app.Activity
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import java.io.File
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import mobile.FilePickerBridge

class AndroidFilePickerBridge(private val activity: Activity) : FilePickerBridge {
    private val lock = Any()
    private var pending: PendingPick? = null

    override fun pickFile(fileEndingsJSON: String): String = pick(PickType.FILE)

    override fun pickFolder(): String = pick(PickType.FOLDER)

    override fun saveFile(
        fileName: String,
        mimeType: String,
        data: ByteArray,
    ) {
        pick(PickType.SAVE, fileName, mimeType, data)
    }

    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?): Boolean {
        val active =
            synchronized(lock) {
                if (pending?.requestCode == requestCode) {
                    pending
                } else {
                    null
                }
            } ?: return false

        try {
            if (resultCode != Activity.RESULT_OK || data?.data == null) {
                active.result.set(Result.failure(IllegalStateException("No file or folder selected")))
                return true
            }

            val uri = data.data!!
            takeReadPermission(uri, data.flags)
            val copied =
                when (active.type) {
                    PickType.FILE -> copyFile(uri, File(activity.filesDir, "native-picker/files"))
                    PickType.FOLDER -> copyTree(uri, File(activity.filesDir, "native-picker/folders/${UUID.randomUUID()}"))
                    PickType.SAVE -> {
                        saveToUri(uri, active.data ?: ByteArray(0))
                        null
                    }
                }
            active.result.set(Result.success(copied?.absolutePath.orEmpty()))
            return true
        } catch (err: Throwable) {
            active.result.set(Result.failure(err))
            return true
        } finally {
            synchronized(lock) {
                if (pending === active) {
                    pending = null
                }
            }
            active.latch.countDown()
        }
    }

    private fun pick(
        type: PickType,
        fileName: String = "file",
        mimeType: String = "application/octet-stream",
        data: ByteArray? = null,
    ): String {
        val active =
            synchronized(lock) {
                if (pending != null) {
                    throw IllegalStateException("Another file picker request is already running")
                }

                PendingPick(type = type, requestCode = nextRequestCode(), latch = CountDownLatch(1), result = AtomicReference(), data = data).also {
                    pending = it
                }
            }

        activity.runOnUiThread {
            val intent =
                when (type) {
                    PickType.FILE ->
                        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            this.type = "*/*"
                        }
                    PickType.FOLDER ->
                        Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
                        }
                    PickType.SAVE ->
                        Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                            addCategory(Intent.CATEGORY_OPENABLE)
                            this.type = mimeType
                            putExtra(Intent.EXTRA_TITLE, sanitizeName(fileName))
                            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                        }
                }

            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            activity.startActivityForResult(intent, active.requestCode)
        }

        if (!active.latch.await(120, TimeUnit.SECONDS)) {
            synchronized(lock) {
                if (pending === active) {
                    pending = null
                }
            }
            throw IllegalStateException("Timed out waiting for Android file picker")
        }

        return active.result.get().getOrThrow()
    }

    private fun copyFile(uri: Uri, targetDir: File): File {
        targetDir.mkdirs()
        val target = uniqueFile(targetDir, displayName(uri))
        activity.contentResolver.openInputStream(uri).use { input ->
            if (input == null) {
                throw IllegalStateException("Unable to open selected file")
            }
            target.outputStream().use { output -> input.copyTo(output) }
        }
        return target
    }

    private fun saveToUri(uri: Uri, data: ByteArray) {
        activity.contentResolver.openOutputStream(uri).use { output ->
            if (output == null) {
                throw IllegalStateException("Unable to open selected save location")
            }
            output.write(data)
        }
    }

    private fun copyTree(treeUri: Uri, targetDir: File): File {
        targetDir.deleteRecursively()
        targetDir.mkdirs()

        val treeDocumentId = DocumentsContract.getTreeDocumentId(treeUri)
        val rootDocumentUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, treeDocumentId)
        copyDocumentChildren(treeUri, rootDocumentUri, targetDir)
        return targetDir
    }

    private fun copyDocumentChildren(treeUri: Uri, documentUri: Uri, targetDir: File) {
        val documentId = DocumentsContract.getDocumentId(documentUri)
        val childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, documentId)

        activity.contentResolver.query(
            childrenUri,
            arrayOf(
                DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE,
            ),
            null,
            null,
            null,
        ).use { cursor ->
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    val childId = cursor.getString(0)
                    val childName = sanitizeName(cursor.getString(1) ?: childId.substringAfterLast(":"))
                    val mimeType = cursor.getString(2)
                    val childUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, childId)
                    val childTarget = uniqueFile(targetDir, childName)

                    if (mimeType == DocumentsContract.Document.MIME_TYPE_DIR) {
                        childTarget.mkdirs()
                        copyDocumentChildren(treeUri, childUri, childTarget)
                    } else {
                        activity.contentResolver.openInputStream(childUri).use { input ->
                            if (input != null) {
                                childTarget.outputStream().use { output -> input.copyTo(output) }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun displayName(uri: Uri): String {
        activity.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null).use { cursor ->
            if (cursor == null) {
                return sanitizeName(uri.lastPathSegment ?: "selected-file")
            }

            val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (index >= 0 && cursor.moveToFirst()) {
                return sanitizeName(cursor.getString(index))
            }
        }

        return sanitizeName(uri.lastPathSegment ?: "selected-file")
    }

    private fun uniqueFile(dir: File, name: String): File {
        var candidate = File(dir, name)
        if (!candidate.exists()) {
            return candidate
        }

        val base = candidate.nameWithoutExtension.ifEmpty { "file" }
        val ext = candidate.extension.let { if (it.isEmpty()) "" else ".$it" }
        var index = 1
        while (candidate.exists()) {
            candidate = File(dir, "$base-$index$ext")
            index++
        }
        return candidate
    }

    private fun sanitizeName(name: String): String =
        name
            .replace(Regex("""[\\/:*?"<>|]"""), "_")
            .trim()
            .ifEmpty { "selected-file" }

    private fun takeReadPermission(uri: Uri, flags: Int) {
        val takeFlags = flags and Intent.FLAG_GRANT_READ_URI_PERMISSION
        if (takeFlags == 0) {
            return
        }

        try {
            activity.contentResolver.takePersistableUriPermission(uri, takeFlags)
        } catch (_: SecurityException) {
            // Some providers grant temporary access only. We copy immediately, so that is enough.
        }
    }

    private fun nextRequestCode(): Int = (10_000..20_000).random()

    private enum class PickType {
        FILE,
        FOLDER,
        SAVE,
    }

    private data class PendingPick(
        val type: PickType,
        val requestCode: Int,
        val latch: CountDownLatch,
        val result: AtomicReference<Result<String>>,
        val data: ByteArray? = null,
    )
}
