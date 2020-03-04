// Package usb provides printing for Sales & Dungeons via USB.
// The printer commands will be written directly to a
// endpoint of a USB device.
package usb

import (
	"errors"
	"fmt"
	"github.com/google/gousb"
	"strconv"
	"strings"
	"sync"
)

type USB struct {
	sync.Mutex
	ctx    *gousb.Context
	device *gousb.Device
	iface  *gousb.Interface
	out    *gousb.OutEndpoint
}

func (c *USB) Name() string {
	return "Raw USB Printing"
}

func (c *USB) Description() string {
	return "Print directly to a USB attached printer. Use {vendor_id}:{product_id}:{endpoint_address} like 0416:5011:03. To find out how to get these values please take a look at the S&D documentation."
}

func (c *USB) openDevice(vendor int64, product int64, endpoint int) error {
	vid := gousb.ID(vendor)
	pid := gousb.ID(product)
	devices, err := c.ctx.OpenDevices(func(desc *gousb.DeviceDesc) bool {
		return desc.Product == pid && desc.Vendor == vid
	})

	if err != nil {
		return err
	}

	if len(devices) == 0 {
		return fmt.Errorf("usb printer not found")
	}

	if err := devices[0].SetAutoDetach(true); err != nil {
		return err
	}

	// close rest of the devices if there were multiple found.
	for i := 1; i < len(devices); i++ {
		_ = devices[i].Close()
	}

	iface, _, err := devices[0].DefaultInterface()
	if err != nil {
		return err
	}

	out, err := iface.OutEndpoint(endpoint)
	if err != nil {
		return err
	}

	c.device = devices[0]
	c.iface = iface
	c.out = out

	return nil
}

func (c *USB) Print(printerEndpoint string, data []byte) error {
	// Parse endpoint format vendor_id:product_id:endpoint_address
	usbConn := strings.Split(printerEndpoint, ":")

	vendor, err := strconv.ParseInt(usbConn[0], 16, 32)
	if err != nil {
		return errors.New("couldn't parse vendor id")
	}

	product, err := strconv.ParseInt(usbConn[1], 16, 32)
	if err != nil {
		return errors.New("couldn't parse product id")
	}

	endpoint, err := strconv.ParseInt(usbConn[2], 16, 32)
	if err != nil {
		return errors.New("couldn't parse endpoint address")
	}

	c.Lock()
	defer c.Unlock()

	if c.ctx == nil {
		c.ctx = gousb.NewContext()
	}

	if c.device == nil {
		if err := c.openDevice(vendor, product, int(endpoint)); err != nil {
			return err
		}
	}

	if c.out == nil {
		return errors.New("no open usb endpoint")
	}

	for i := 0; i < 2; i++ {
		written, err := c.out.Write(data)
		if err != nil {
			// Try to reopen the device. This error can occur
			// when the device was replugged.
			if err == gousb.ErrorNoDevice {
				if err := c.openDevice(vendor, product, int(endpoint)); err != nil {
					return err
				}

				continue
			}
			return err
		}

		if written != len(data) {
			return errors.New("not everything got written")
		}

		break
	}

	return nil
}
