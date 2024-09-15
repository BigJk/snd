// Package usb provides printing for Sales & Dungeons via USB.
// The printer commands will be written directly to a
// endpoint of a USB device.
package usb

import (
	"errors"
	"fmt"
	"image"
	"runtime"
	"strconv"
	"strings"
	"sync"

	"github.com/google/gousb"
	"github.com/google/gousb/usbid"
)

type USB struct {
	sync.Mutex
	vendor    int64
	product   int64
	endpoint  int
	ctx       *gousb.Context
	device    *gousb.Device
	iface     *gousb.Interface
	ifaceDone func()
	out       *gousb.OutEndpoint
}

func (c *USB) Name() string {
	return "Raw USB Printing"
}

func (c *USB) Description() string {
	return "Print directly to a USB attached printer. Use {vendor_id}:{product_id}:{endpoint_address} like 0416:5011:03 as endpoint. To find out how to get these values please take a look at the S&D documentation."
}

func (c *USB) AvailableEndpoints() (map[string]string, error) {
	if c.ctx == nil {
		c.ctx = gousb.NewContext()
	}

	available := map[string]string{}
	if _, err := c.ctx.OpenDevices(func(desc *gousb.DeviceDesc) bool {
		for _, cfg := range desc.Configs {
			if len(cfg.Interfaces) > 0 && len(cfg.Interfaces[0].AltSettings) > 0 {
				set := cfg.Interfaces[0].AltSettings[0]
				if set.Class == gousb.ClassPrinter {
					for _, end := range set.Endpoints {
						if end.Direction == gousb.EndpointDirectionOut {
							available[fmt.Sprintf("#%d #%d %s", desc.Port, desc.Bus, usbid.Describe(desc))] = fmt.Sprintf("%v:%v:%02x", desc.Vendor, desc.Product, uint8(end.Address))
						}
					}
				}
			}

			// Only check the first config for now as most
			// thermal printer are simple virtual com port
			// devices with a single config.
			break
		}
		return false
	}); err != nil && err != gousb.ErrorNotFound {
		return nil, err
	}

	return available, nil
}

func (c *USB) reset() {
	if c.ifaceDone != nil {
		c.ifaceDone()
	}

	if c.device != nil {
		_ = c.device.Close()
	}

	c.device = nil
	c.iface = nil
	c.ifaceDone = nil
	c.out = nil
}

func (c *USB) openDevice(vendor int64, product int64, endpoint int) error {
	device, err := c.ctx.OpenDeviceWithVIDPID(gousb.ID(vendor), gousb.ID(product))
	if err != nil {
		return err
	}

	if runtime.GOOS != "darwin" {
		if err := device.SetAutoDetach(true); err != nil {
			return err
		}
	}

	iface, done, err := device.DefaultInterface()
	if err != nil {
		return err
	}

	out, err := iface.OutEndpoint(endpoint)
	if err != nil {
		return err
	}

	c.device = device
	c.iface = iface
	c.ifaceDone = done
	c.out = out

	c.product = product
	c.vendor = vendor
	c.endpoint = endpoint

	return nil
}

func (c *USB) Print(printerEndpoint string, image image.Image, data []byte) error {
	// Parse endpoint format vendor_id:product_id:endpoint_address
	usbConn := strings.Split(printerEndpoint, ":")

	if len(usbConn) != 3 {
		return errors.New("wrong endpoint format")
	}

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

	// Open the device if not opened already
	// or if the target device changed.
	if c.device == nil || vendor != c.vendor || product != c.product || int(endpoint) != c.endpoint {
		c.reset()

		if err := c.openDevice(vendor, product, int(endpoint)); err != nil {
			c.reset()
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
					c.reset()
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
