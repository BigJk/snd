package snd

// Template represents one S&D template
type Template struct {
	ID            int    `json:"id" storm:"id,increment"`
	Name          string `json:"name" storm:"unique"`
	ForeignName   string `json:"foreignName" storm:"index"`
	Description   string `json:"description"`
	PrintTemplate string `json:"printTemplate"`
	ListTemplate  string `json:"listTemplate"`
	SkeletonData  string `json:"skeletonData"`
}
