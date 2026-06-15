package app.salesanddungeons

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import mobile.BluetoothBridge
import org.json.JSONObject
import java.util.UUID

class AndroidBluetoothBridge(private val activity: Activity) : BluetoothBridge {
    private val adapter: BluetoothAdapter? =
        (activity.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter

    @SuppressLint("MissingPermission")
    override fun availableEndpointsJSON(): String {
        ensureBluetoothPermission()

        val endpoints = JSONObject()
        val bluetoothAdapter = adapter ?: return endpoints.toString()
        if (!bluetoothAdapter.isEnabled) {
            return endpoints.toString()
        }

        bluetoothAdapter.bondedDevices
            .sortedWith(compareBy({ it.name ?: "" }, { it.address }))
            .forEach { device ->
                val name = device.name?.takeIf { it.isNotBlank() } ?: "Bluetooth Printer"
                endpoints.put("$name (${device.address})", device.address)
            }

        return endpoints.toString()
    }

    @SuppressLint("MissingPermission")
    override fun print(endpoint: String, data: ByteArray) {
        try {
            ensureBluetoothPermission()

            val bluetoothAdapter =
                adapter ?: throw IllegalStateException("Bluetooth is not available on this device")
            if (!bluetoothAdapter.isEnabled) {
                throw IllegalStateException("Bluetooth is disabled")
            }

            val device =
                bluetoothAdapter.bondedDevices.firstOrNull { it.address == endpoint }
                    ?: throw IllegalArgumentException("Bluetooth printer is not paired: $endpoint")

            bluetoothAdapter.cancelDiscovery()
            val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
            try {
                socket.connect()
                socket.outputStream.use { output ->
                    var offset = 0
                    while (offset < data.size) {
                        val length = minOf(data.size - offset, 1024)
                        output.write(data, offset, length)
                        output.flush()
                        offset += length
                        if (offset < data.size) {
                            Thread.sleep(20)
                        }
                    }
                }
            } finally {
                socket.close()
            }
        } catch (err: Throwable) {
            throw IllegalStateException(
                err.message ?: "${err.javaClass.simpleName} while printing to Bluetooth endpoint $endpoint",
                err,
            )
        }
    }

    private fun ensureBluetoothPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return
        }

        if (
            activity.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) ==
                PackageManager.PERMISSION_GRANTED
        ) {
            return
        }

        activity.runOnUiThread {
            activity.requestPermissions(arrayOf(Manifest.permission.BLUETOOTH_CONNECT), BLUETOOTH_PERMISSION_REQUEST)
        }
        throw IllegalStateException("Bluetooth permission requested. Try again after granting access.")
    }

    companion object {
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private const val BLUETOOTH_PERMISSION_REQUEST = 4301
    }
}
