package snd

// Template represents one S&D template
type Template struct {
	ID            int    `json:"id" storm:"id,increment"`
	Name          string `json:"name" storm:"unique"`
	ForeignName   string `json:"foreign_name" mapstructure:"foreign_name" storm:"index"`
	Description   string `json:"description" mapstructure:"description"`
	PrintTemplate string `json:"print_template" mapstructure:"print_template"`
	ListTemplate  string `json:"list_template" mapstructure:"list_template"`
	SkeletonData  string `json:"skeleton_data" mapstructure:"skeleton_data"`
}
