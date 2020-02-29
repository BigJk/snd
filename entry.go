package snd

// Entry represents one data entry in a template.
type Entry struct {
	ID        int    `json:"id" storm:"id,increment"`
	Name      string `json:"name" storm:"unique"`
	ForeignID string `json:"foreignId" mapstructure:"foreignId" storm:"index"`
	Data      string `json:"data"`
}
