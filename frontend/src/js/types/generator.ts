type GeneratorConfig = {
	key: string;
	name: string;
	description: string;
	type: string;
	default: any;
};

type Generator = {
	name: string;
	slug: string;
	author: string;
	description: string;
	printTemplate: string;
	passEntriesToJS: boolean;
	config: GeneratorConfig[];
	images: Record<string, string>;
	dataSources: string[];
	version: string;
	count?: number;
};

export default Generator;
export { GeneratorConfig };
