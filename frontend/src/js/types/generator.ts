import { pickBy } from 'lodash-es';

import BasicInfo, { buildId } from 'js/types/basic-info';

type GeneratorConfig = {
	key: string;
	name: string;
	description: string;
	type: string;
	default: any;
};

type Generator = BasicInfo & {
	printTemplate: string;
	passEntriesToJS: boolean;
	config: GeneratorConfig[];
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

export default Generator;
export { GeneratorConfig, sanitizeConfig };
