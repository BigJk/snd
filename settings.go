package snd

// Settings represents the basic settings for S&D.
type Settings struct {
	PrinterType     string `json:"printerType" mapstructure:"printerType"`
	PrinterEndpoint string `json:"printerEndpoint" mapstructure:"printerEndpoint"`
	PrinterWidth    int    `json:"printerWidth" mapstructure:"printerWidth"`
	Commands        struct {
		ExplicitInit      bool `json:"explicitInit" mapstructure:"explicitInit"`
		Cut               bool `json:"cut"`
		ForceStandardMode bool `json:"forceStandardMode" mapstructure:"forceStandardMode"`
		LinesBefore       int  `json:"linesBefore" mapstructure:"linesBefore"`
		LinesAfter        int  `json:"linesAfter" mapstructure:"linesAfter"`
	} `json:"commands"`
	Stylesheets []string `json:"stylesheets"`
}
