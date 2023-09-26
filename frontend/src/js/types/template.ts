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
export { createEmptyTemplate };
