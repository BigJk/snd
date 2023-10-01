export type Argument = {
	name: string;
	description: string;
	type: string;
	default: any;
};

export type DataSourceImport = {
	name: string;
	rpcName: string;
	description: string;
	arguments: Argument[];
};
