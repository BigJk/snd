import BasicInfo from 'js/types/basic-info';

type TemplateConfig = {
	key: string;
	name: string;
	description: string;
	type: string;
	default: any;
};

type Template = BasicInfo & {
	printTemplate: string;
	listTemplate: string;
	skeletonData: Record<string, any>;
	images: Record<string, string>;
	config: TemplateConfig[];
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
export { TemplateConfig, createEmptyTemplate };
