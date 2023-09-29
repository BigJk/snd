import { get } from 'lodash';

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

	console.log(merged);
	return merged;
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
						// We assume that an empty array is a array of strings
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
								default: [],
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

				console.log('BLEEP');
				console.log(val);
				console.log(Object.keys(val).map((key) => buildNode([key], val)));

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
