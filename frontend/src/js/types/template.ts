type TemplateConfig = {
	key: string;
	name: string;
	description: string;
	type: string;
	default: any;
};

type Template = {
	name: string;
	slug: string;
	author: string;
	description: string;
	printTemplate: string;
	listTemplate: string;
	skeletonData: Record<string, any>;
	images: Record<string, string>;
	config: TemplateConfig[];
	dataSources: string[];
	version: string;
	count?: number;
};

export default Template;
export { TemplateConfig };
