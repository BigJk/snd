package snd

// Settings represents the basic settings for S&D
type Settings struct {
	PrinterEndpoint string   `json:"printer_endpoint" mapstructure:"printer_endpoint"`
	Stylesheets     []string `json:"stylesheets"`
}
