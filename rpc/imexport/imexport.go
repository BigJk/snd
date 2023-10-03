package imexport

// Argument represents a function argument for import and export functions.
type Argument struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Default     any    `json:"default"`
}

func Arg(name, description, t string, def any) Argument {
	return Argument{
		Name:        name,
		Description: description,
		Type:        t,
		Default:     def,
	}
}

// ImExport represents a import or export function.
type ImExport struct {
	Name        string     `json:"name"`
	RPCName     string     `json:"rpcName"`
	Description string     `json:"description"`
	Arguments   []Argument `json:"arguments"`
}

func NewImExport(name, rpcName, description string, arguments ...Argument) ImExport {
	return ImExport{
		Name:        name,
		RPCName:     rpcName,
		Description: description,
		Arguments:   arguments,
	}
}
