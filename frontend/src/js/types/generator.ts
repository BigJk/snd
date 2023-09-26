import { pickBy } from 'lodash-es';

import BasicInfo, { buildId } from 'js/types/basic-info';
import { ConfigValue } from 'js/types/config';

type Generator = BasicInfo & {
	printTemplate: string;
	passEntriesToJS: boolean;
	config: ConfigValue[];
	images: Record<string, string>;
	dataSources: string[];
	count?: number;
};

const sanitizeConfig = (g: Generator, configs: any) => {
	let id = buildId('generator', g);

	// create base config
	if (configs === undefined) {
		configs = {
			seed: 'TEST_SEED',
		};
	}

	// set seed if uninitialized
	if (configs.seed === undefined) {
		configs.seed = 'TEST_SEED';
	}

	// set default values for initialized fields
	g.config.forEach((conf) => {
		if (configs[conf.key] === undefined) {
			configs[conf.key] = conf.default;
		}
	});

	// remove old fields that are not present in the config anymore.
	return pickBy(configs, (val, key) => key === 'seed' || g.config.some((conf) => conf.key === key));
};

function createEmptyGenerator(): Generator {
	return {
		name: 'Your Generator Name',
		description: '',
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
export { sanitizeConfig, createEmptyGenerator };
