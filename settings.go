package snd

// Settings represents the basic settings for S&D.
type Settings struct {
	PrinterType     string `json:"printerType"`
	PrinterEndpoint string `json:"printerEndpoint"`
	PrinterWidth    int    `json:"printerWidth"`
	Commands        struct {
		ExplicitInit      bool `json:"explicitInit"`
		Cut               bool `json:"cut"`
		ForceStandardMode bool `json:"forceStandardMode"`
		LinesBefore       int  `json:"linesBefore"`
		LinesAfter        int  `json:"linesAfter"`
		SplitPrinting     bool `json:"splitPrinting"`
		SplitHeight       int  `json:"splitHeight"`
		SplitDelay        int  `json:"splitDelay"`
	} `json:"commands"`
	SpellcheckerLanguages []string `json:"spellcheckerLanguages"`
	PackageRepos          []string `json:"packageRepos"`
	SyncKey               string   `json:"syncKey"`
	SyncEnabled           bool     `json:"syncEnabled"`
	AIEnabled             bool     `json:"aiEnabled"`
	AIAlwaysAllow         bool     `json:"aiAlwaysAllow"`
	AIApiKey              string   `json:"aiApiKey"`
	AIModel               string   `json:"aiModel"`
	AIProvider            string   `json:"aiProvider"`
	AIContextWindow       int      `json:"aiContextWindow"`
	AIMaxTokens           int      `json:"aiMaxTokens"`
	AIURL                 string   `json:"aiUrl"`
}
