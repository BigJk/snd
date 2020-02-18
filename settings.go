package snd

// Settings represents the basic settings for S&D.
type Settings struct {
	PrinterType     string   `json:"printer_type" mapstructure:"printer_type"`
	PrinterEndpoint string   `json:"printer_endpoint" mapstructure:"printer_endpoint"`
	Stylesheets     []string `json:"stylesheets"`
}
