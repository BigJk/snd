import { get, toPath } from 'lodash-es';

export type SchemaType = 'string' | 'number' | 'boolean' | 'array' | 'object';

export type SchemaNode = {
	/**
	 * The type of the node.
	 */
	type: SchemaType;
	/**
	 * The type of the elements in the array.
	 */
	elemType?: SchemaType;
	/**
	 * What input type to use for this node.
	 */
	inputType: string;
	/**
	 * The key of the node.
	 */
	key: string;
	/**
	 * Optional description of the node.
	 */
	description?: string;
	/**
	 * Optional readable name of the node.
	 */
	readableName?: string;
	/**
	 * The default value of the node.
	 */
	default?: any;
	/**
	 * The children of the node.
	 */
	children?: SchemaNode[];
};

export type SchemaRoot = {
	nodes: SchemaNode[];
};

/**
 * Merge object merges an array of objects into one. It will overwrite values with the same key.
 * In case of strings it will take the longest string.
 * @param objects
 */
function mergeObjects(objects: any[]): any {
	const merged: Record<string, any> = {};

	for (const obj of objects) {
		if (typeof obj !== 'object') {
			continue;
		}

		for (const key of Object.keys(obj)) {
			if (typeof obj[key] === 'string') {
				if (!merged[key]) {
					merged[key] = obj[key];
				} else {
					merged[key] = obj[key].length > merged[key]?.length ? obj[key] : merged[key];
				}
			} else if (obj[key] !== null && obj[key] !== undefined) {
				merged[key] = obj[key];
			}
		}
	}

	return merged;
}

/**
 * Converts a string to a readable name.
 * @param inputString The string to convert.
 */
export function readableName(inputString: string) {
	const words = inputString.split(/[_A-Z]/).filter(Boolean);
	const transformedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
	const result = transformedWords.join(' ');
	return result;
}

/**
 * Given a path in an object that is based on the schema, it will return the schema node.
 * @param schema The schema to search in.
 * @param pathStrOrArray The path to search for. Can be a string or an array of strings.
 * @returns The schema node or null if not found.
 */
export function objectPathToSchema(schema: SchemaRoot, pathStrOrArray: string | string[]) {
	const path: string[] = typeof pathStrOrArray === 'string' ? toPath(pathStrOrArray) : pathStrOrArray;
	const node = schema.nodes.find((n) => n.key === path[0]);
	if (!node) {
		return null;
	}

	const loop = (nodes: SchemaNode[], path: string[]): SchemaNode | null => {
		if (path.length === 0) {
			return null;
		}

		// Check if the element is a number and skip it.
		if (!isNaN(Number(path[0]))) {
			return loop(nodes, path.slice(1));
		}

		for (const node of nodes) {
			if (node.key === path[0]) {
				if (path.length === 1) {
					return node;
				}
				if (node.type === 'object') {
					return loop(node.children ?? [], path.slice(1));
				} else if (node.type === 'array') {
					if (node.elemType === 'object') {
						return loop(node.children ?? [], path.slice(1));
					}
				}
			}
		}
		return null;
	};

	return loop(schema.nodes, path);
}

/**
 * Creates a default object from the given schema.
 * @param schema The schema to create the object from.
 */
export function initialData(schema: SchemaRoot | SchemaNode[]): any {
	const data: any = {};

	// We need to loop over all the nodes and recursivly set the default value.
	const loop = (nodes: SchemaNode[], data: any) => {
		for (const node of nodes) {
			if (node.type === 'object') {
				data[node.key] = {};
				loop(node.children ?? [], data[node.key]);
			} else if (node.type === 'array') {
				data[node.key] = [];
				if (node.elemType === 'object') {
					data[node.key].push({});
					loop(node.children ?? [], data[node.key][0]);
				} else {
					data[node.key] = node.default;
				}
			} else {
				data[node.key] = node.default;
			}
		}
	};

	loop(Array.isArray(schema) ? schema : schema.nodes, data);

	return data;
}

/**
 * Returns the input type for the given element type.
 * @param elemType The element type to get the input type for.
 */
export function getInputTypeByElemType(elemType: SchemaType) {
	switch (elemType) {
		case 'string':
			return 'Text';
		case 'number':
			return 'Number';
		case 'boolean':
			return 'Checkbox';
		case 'array':
			return 'Array';
		case 'object':
			return 'Object';
	}
}

/**
 * Builds a schema from the given data.
 * @param data
 */
export function buildSchema(data: any): SchemaRoot {
	const root = {
		nodes: [] as SchemaNode[],
	};

	if (typeof data !== 'object') {
		return root;
	}

	const buildNode = (path: string[], data: any): SchemaNode | null => {
		const val = get(data, path);

		if (val === null || val === undefined) {
			return null;
		}

		switch (typeof val) {
			case 'undefined':
				break;
			case 'function':
				break;
			case 'symbol':
				break;
			case 'bigint':
				break;
			case 'string':
				if (val.startsWith('!IMAGE')) {
					return {
						type: 'string',
						inputType: 'Image',
						key: path[path.length - 1],
						default: val,
					};
				}
				return {
					type: 'string',
					inputType: 'Text',
					key: path[path.length - 1],
					default: val,
				};
			case 'number':
				return {
					type: 'number',
					inputType: 'Number',
					key: path[path.length - 1],
					default: val,
				};
			case 'boolean':
				return {
					type: 'boolean',
					inputType: 'Checkbox',
					key: path[path.length - 1],
					default: val,
				};
			case 'object':
				if (Array.isArray(val)) {
					if (val.length === 0) {
						// We assume that an empty array is an array of strings
						return {
							type: 'array',
							inputType: 'Array',
							key: path[path.length - 1],
							elemType: 'string',
							default: [],
						};
					}

					const elemType = typeof val[0];
					switch (elemType) {
						case 'string':
						case 'number':
						case 'boolean':
							return {
								type: 'array',
								inputType: 'Array',
								key: path[path.length - 1],
								elemType,
								default: val,
							};
						case 'object':
							const merged = mergeObjects(val);

							return {
								type: 'array',
								inputType: 'Array',
								key: path[path.length - 1],
								elemType: 'object',
								children: Object.keys(merged)
									.map((key) => buildNode([key], merged))
									.filter((n) => n !== null) as SchemaNode[],
							};
					}
				}

				return {
					type: 'object',
					inputType: 'Object',
					key: path[path.length - 1],
					children: Object.keys(val)
						.map((key) => buildNode([key], val))
						.filter((n) => n !== null) as SchemaNode[],
				};
		}

		return null;
	};

	root.nodes = Object.keys(data)
		.map((key) => buildNode([key], data))
		.filter((n) => n !== null) as SchemaNode[];

	return root;
}
