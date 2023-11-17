export type ConfigValue = {
	key: string;
	name: string;
	description: string;
	type: string;
	default: any;
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
