// Package usb provides printing for Sales & Dungeons via USB.
// The printer commands will be written directly to a
// endpoint of a USB device.
package usb

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"

	"github.com/google/gousb"
	"github.com/google/gousb/usbid"
)

type USB struct {
	sync.Mutex
	vendor   int64
	product  int64
	endpoint int
	ctx      *gousb.Context
	device   *gousb.Device
	iface    *gousb.Interface
	out      *gousb.OutEndpoint
}

func (c *USB) Name() string {
	return "Raw USB Printing"
}

func (c *USB) Description() string {
	return "Print directly to a USB attached printer. Use {vendor_id}:{product_id}:{endpoint_address} like 0416:5011:03. To find out how to get these values please take a look at the S&D documentation."
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
	if c.device != nil {
		_ = c.device.Close()
	}

	c.device = nil
	c.iface = nil
	c.out = nil
}

func (c *USB) openDevice(vendor int64, product int64, endpoint int) error {
	vid := gousb.ID(vendor)
	pid := gousb.ID(product)
	devices, err := c.ctx.OpenDevices(func(desc *gousb.DeviceDesc) bool {
		return desc.Product == pid && desc.Vendor == vid
	})

	// On windows there will be a error thrown even
	// if the device is opened and len(devices) > 0.
	// That's why the error is only checked if no
	// device is found.
	if len(devices) == 0 {
		if err != nil {
			return err
		}

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

	c.product = product
	c.vendor = vendor
	c.endpoint = endpoint

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

	// Open the device if not opened already
	// or if the target device changed.
	if c.device == nil || vendor != c.vendor || product != c.product || int(endpoint) != c.endpoint {
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
