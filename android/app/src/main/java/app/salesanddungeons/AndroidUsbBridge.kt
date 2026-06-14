package app.salesanddungeons

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbManager
import android.os.Build
import mobile.USBBridge
import org.json.JSONObject

class AndroidUsbBridge(private val context: Context) : USBBridge {
    private val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
    private val permissionAction = "${context.packageName}.USB_PERMISSION"

    private val permissionIntent: PendingIntent =
        PendingIntent.getBroadcast(
            context,
            0,
            Intent(permissionAction).setPackage(context.packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    private val permissionReceiver =
        object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                // Permission state is read synchronously before printing. The receiver only
                // keeps Android's permission request flow connected to this application.
            }
        }

    init {
        val filter = IntentFilter(permissionAction)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(permissionReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            context.registerReceiver(permissionReceiver, filter)
        }
    }

    override fun availableEndpointsJSON(): String {
        val endpoints = JSONObject()

        usbManager.deviceList.values.forEach { device ->
            device.firstPrinterOutEndpoint()?.let { endpoint ->
                val label = "${device.productName ?: "USB Printer"} ${hex(device.vendorId)}:${hex(device.productId)}"
                endpoints.put(label, "${hex(device.vendorId)}:${hex(device.productId)}:${hex(endpoint.address)}")
            }
        }

        return endpoints.toString()
    }

    override fun print(endpoint: String, data: ByteArray) {
        try {
            val target = parseEndpoint(endpoint)
            val device =
                usbManager.deviceList.values.firstOrNull {
                    it.vendorId == target.vendorId && it.productId == target.productId
                } ?: throw IllegalArgumentException("USB printer is not attached: $endpoint")

            if (!usbManager.hasPermission(device)) {
                usbManager.requestPermission(device, permissionIntent)
                throw IllegalStateException("USB permission requested. Try printing again after granting access.")
            }

            val match =
                device.findOutEndpoint(target.endpointAddress)
                    ?: throw IllegalArgumentException("USB printer endpoint not found: $endpoint")

            val connection = usbManager.openDevice(device) ?: throw IllegalStateException("Could not open USB device")
            try {
                if (!connection.claimInterface(match.usbInterface, true)) {
                    throw IllegalStateException("Could not claim USB printer interface")
                }

                var offset = 0
                while (offset < data.size) {
                    val length = minOf(data.size - offset, 16 * 1024)
                    val written = connection.bulkTransfer(match.endpoint, data, offset, length, 10_000)
                    if (written <= 0) {
                        throw IllegalStateException("USB bulk transfer failed with result $written at byte $offset of ${data.size}")
                    }
                    offset += written
                }
            } finally {
                connection.releaseInterface(match.usbInterface)
                connection.close()
            }
        } catch (err: Throwable) {
            throw IllegalStateException(err.message ?: "${err.javaClass.simpleName} while printing to USB endpoint $endpoint", err)
        }
    }

    private fun UsbDevice.firstPrinterOutEndpoint(): UsbEndpoint? =
        (0 until interfaceCount)
            .asSequence()
            .map { getInterface(it) }
            .filter { it.interfaceClass == UsbConstants.USB_CLASS_PRINTER || it.endpointCount > 0 }
            .flatMap { usbInterface ->
                (0 until usbInterface.endpointCount).asSequence().map { usbInterface.getEndpoint(it) }
            }
            .firstOrNull { it.direction == UsbConstants.USB_DIR_OUT }

    private fun UsbDevice.findOutEndpoint(address: Int): EndpointMatch? =
        (0 until interfaceCount).asSequence().map { getInterface(it) }.flatMap { usbInterface ->
            (0 until usbInterface.endpointCount).asSequence().map { endpoint ->
                EndpointMatch(usbInterface, usbInterface.getEndpoint(endpoint))
            }
        }.firstOrNull {
            it.endpoint.direction == UsbConstants.USB_DIR_OUT && it.endpoint.address == address
        }

    private fun parseEndpoint(endpoint: String): UsbTarget {
        val parts = endpoint.split(":")
        require(parts.size == 3) { "Wrong USB endpoint format: $endpoint" }
        return UsbTarget(
            vendorId = parts[0].toInt(16),
            productId = parts[1].toInt(16),
            endpointAddress = parts[2].toInt(16),
        )
    }

    private fun hex(value: Int): String = value.toString(16).padStart(4, '0')

    private data class UsbTarget(val vendorId: Int, val productId: Int, val endpointAddress: Int)

    private data class EndpointMatch(
        val usbInterface: android.hardware.usb.UsbInterface,
        val endpoint: UsbEndpoint,
    )
}
