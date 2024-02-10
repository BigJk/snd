package main

import (
	"fmt"
	"github.com/BigJk/snd/rpc/bind"
	"github.com/iancoleman/strcase"
	"strings"
)

const pythonAPIHeader = `import requests


# This class is a simple Python SDK for the Sales & Dungeon API.
# It is automatically generated from the API definition.
#
# Requires the requests library to be installed.
# python -m pip install requests

class SndAPI:

    def __init__(self, base_url):
        """
        Initialize the Sales & Dungeon API class with the base URL of the API.

        Parameters:
        - base_url (str): The base URL of the API. Most likely "http://127.0.0.1:7123"
        """
        self.base_url = base_url

    def _make_request(self, endpoint, method='GET', params=None):
        url = f"{self.base_url}/{endpoint}"
        if method == 'GET':
            response = requests.get(url, params=params)
        elif method == 'POST':
            response = requests.post(url, json=params)
        elif method == 'DELETE':
            response = requests.delete(url, json=params)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
`

func pythonArgType(argType string) string {
	slice := strings.HasSuffix(argType, "[]")
	if slice {
		argType = argType[:len(argType)-2]
	}

	typeName := ""
	switch argType {
	case "string":
		typeName = "str"
	case "int":
		typeName = "int"
	case "float":
		typeName = "float"
	case "bool":
		typeName = "bool"
	case "interface{}":
		typeName = "dict"
	default:
		typeName = strings.Replace(argType, "snd.", "", -1)
	}

	if slice {
		return fmt.Sprintf("list of %s", typeName)
	}
	return typeName
}

func pythonDefineFunction(function bind.Function) string {
	args := make([]string, len(function.Args))
	for i, _ := range function.Args {
		args[i] = fmt.Sprintf("arg%d", i)
	}

	parameters := make([]string, len(function.Args))
	for i, arg := range function.Args {
		parameters[i] = fmt.Sprintf("        - %s (%s): parameter", args[i], pythonArgType(arg))
	}

	snakeName := strcase.ToSnake(function.Name)
	snakeName = strings.Replace(snakeName, "5_e", "5e", -1)

	return fmt.Sprintf(`    def %s(self, %s):
        """
        Perform an action using the %s API endpoint.

        Parameters:
%s
        """
        endpoint = "api/%s"
        return self._make_request(endpoint, method='POST', params=[%s])`, snakeName, strings.Join(args, ", "), function.Name, strings.Join(parameters, "\n"), function.Name, strings.Join(args, ", "))
}

func pythonSDK() string {
	functions := bind.Functions()
	functionsStr := make([]string, len(functions))
	i := 0
	for _, function := range functions {
		functionsStr[i] = pythonDefineFunction(function)
		i++
	}

	return fmt.Sprintf("%s\n%s", pythonAPIHeader, strings.Join(functionsStr, "\n\n"))
}
