package snd

// Settings represents the basic settings for S&D.
type Settings struct {
	PrinterType     string `json:"printer_type" mapstructure:"printer_type"`
	PrinterEndpoint string `json:"printer_endpoint" mapstructure:"printer_endpoint"`
	PrinterWidth    int    `json:"printer_width" mapstructure:"printer_width"`
	Commands        struct {
		ExplicitInit      bool `json:"explicit_init" mapstructure:"explicit_init"`
		Cut               bool `json:"cut"`
		ForceStandardMode bool `json:"force_standard_mode" mapstructure:"force_standard_mode"`
		LinesBefore       int  `json:"lines_before" mapstructure:"lines_before"`
		LinesAfter        int  `json:"lines_after" mapstructure:"lines_after"`
	} `json:"commands"`
	Stylesheets []string `json:"stylesheets"`
}
