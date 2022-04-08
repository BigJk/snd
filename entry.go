package snd

// Entry represents one data entry in a template or data source.
type Entry struct {
	ID   string                 `json:"id"`
	Name string                 `json:"name"`
	Data map[string]interface{} `json:"data"`
}
