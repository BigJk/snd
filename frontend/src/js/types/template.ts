import { pickBy } from 'lodash-es';

import BasicInfo, { buildId } from 'js/types/basic-info';
import { ConfigValue } from 'js/types/config';

type Template = BasicInfo & {
	printTemplate: string;
	listTemplate: string;
	skeletonData: Record<string, any>;
	images: Record<string, string>;
	config: ConfigValue[];
	dataSources: string[];
	count?: number;
};

const sanitizeConfig = (t: Template, configs: any) => {
	// create base config
	if (configs === undefined) {
		configs = {};
	}

	// set default values for initialized fields
	t.config.forEach((conf) => {
		if (configs[conf.key] === undefined) {
			configs[conf.key] = conf.default;
		}
	});

	// remove old fields that are not present in the config anymore.
	return pickBy(configs, (val, key) => key === 'seed' || t.config.some((conf) => conf.key === key));
};

function createEmptyTemplate(): Template {
	return {
		name: 'Your Template Name',
		description: '',
		author: 'username',
		slug: 'your-template-name',
		version: '',
		printTemplate: '',
		listTemplate: '',
		skeletonData: {},
		images: {},
		config: [],
		dataSources: [],
	};
}

export default Template;
export { createEmptyTemplate, sanitizeConfig };
