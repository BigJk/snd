import BasicInfo from 'js/types/basic-info';

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

export default Generator;
export { GeneratorConfig };
