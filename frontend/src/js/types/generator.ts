import { pickBy } from 'lodash-es';

import BasicInfo from 'js/types/basic-info';
import { ConfigValue } from 'js/types/config';

type Generator = BasicInfo & {
	printTemplate: string;
	passEntriesToJS: boolean;
	config: ConfigValue[];
	images: Record<string, string>;
	dataSources: string[];
	count?: number;
};

/**
 * Generates a random seed.
 */
function seed() {
	return Math.ceil(Math.random() * 999999999).toString();
}

/**
 * Sanitizes the config object by setting default values for missing fields and removing old fields that are not present in the config anymore.
 * @param g Generator object.
 * @param configs Config object.
 */
const sanitizeConfig = (g: Generator, configs: any) => {
	// Create base config
	if (configs === undefined) {
		configs = {
			seed: seed(),
		};
	}

	// Set seed if uninitialized
	if (configs.seed === undefined) {
		configs.seed = seed();
	}

	// Set default values for initialized fields
	g.config.forEach((conf) => {
		if (configs[conf.key] === undefined) {
			configs[conf.key] = conf.default;
		}
	});

	// Remove old fields that are not present in the config anymore.
	return pickBy(configs, (val, key) => key === 'seed' || g.config.some((conf) => conf.key === key));
};

/**
 * Creates an empty generator object.
 */
function createEmptyGenerator(): Generator {
	return {
		name: 'Your Generator Name',
		description: '',
		copyrightNotice: '',
		author: 'username',
		slug: 'your-generator-name',
		version: '',
		printTemplate: '',
		passEntriesToJS: false,
		config: [],
		images: {},
		dataSources: [],
	};
}

export default Generator;
export { sanitizeConfig, createEmptyGenerator, seed };
