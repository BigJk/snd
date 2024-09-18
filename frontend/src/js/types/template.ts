import { pickBy } from 'lodash-es';

import BasicInfo from 'js/types/basic-info';
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

/**
 * Sanitizes the config object by setting default values for missing fields and removing old fields that are not present in the config anymore.
 * @param t Template object.
 * @param configs Config object.
 */
const sanitizeConfig = (t: Template, configs: any) => {
	// Create base config
	if (configs === undefined) {
		configs = {};
	}

	// Set default values for initialized fields
	(t.config ?? []).forEach((conf) => {
		if (configs[conf.key] === undefined) {
			configs[conf.key] = conf.default;
		}
	});

	// Remove old fields that are not present in the config anymore.
	return pickBy(configs, (val, key) => key === 'seed' || t.config.some((conf) => conf.key === key));
};

/**
 * Creates an empty template object.
 */
function createEmptyTemplate(): Template {
	return {
		name: 'Your Template Name',
		description: '',
		copyrightNotice: '',
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
