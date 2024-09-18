export type ConfigValue = {
	key: string;
	name: string;
	description: string;
	type: string;
	default: any;

	/**
	 * Whether the config value is dynamic and should not be saved to the generator.
	 */
	isDynamic?: boolean;
};

/**
 * Fill in default values for a config object.
 * @param config Config object to fill in.
 * @param configValues Config values that should be filled in.
 */
export const fillConfigValues = (config: any, configValues: ConfigValue[]) => {
	const result: any = {};
	for (const { key, default: defaultValue } of configValues) {
		result[key] = config[key] ?? defaultValue;
	}
	return result;
};

/**
 * Merge two config value arrays. If a value is present in both arrays, the value from the main array is used.
 * @param main Main config value array.
 * @param merge Config value array to merge into the main array.
 */
export const mergeConfigValues = (main: ConfigValue[], merge: ConfigValue[]) => {
	main = filterValidConfigValues(main);
	merge = filterValidConfigValues(merge);

	const result: ConfigValue[] = [];
	const mainKeys = main.map((c) => c.key);
	for (const config of merge) {
		if (!mainKeys.includes(config.key)) {
			result.push(config);
		}
	}
	return [...main, ...result];
};

/**
 * Filter out invalid config values. A check for all values is performed.
 */
export const filterValidConfigValues = (configValues: ConfigValue[]) =>
	configValues.filter((config) => !!config.key && !!config.name && !!config.description && !!config.type && config.default != undefined);

/**
 * Filter out dynamic config values.
 */
export const filterOutDynamicConfigValues = (configValues: ConfigValue[]) => configValues.filter((config) => !config.isDynamic);
