package snd

// Template represents one S&D template
type Template struct {
	ID            int    `json:"id" storm:"id,increment"`
	Name          string `json:"name" storm:"unique"`
	ForeignName   string `json:"foreignName" mapstructure:"foreignName" storm:"index"`
	Description   string `json:"description" mapstructure:"description"`
	PrintTemplate string `json:"printTemplate" mapstructure:"printTemplate"`
	ListTemplate  string `json:"listTemplate" mapstructure:"listTemplate"`
	SkeletonData  string `json:"skeletonData" mapstructure:"skeletonData"`
}
