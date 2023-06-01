type Commands = {
	explicitInit: boolean;
	cut: boolean;
	forceStandardMode: boolean;
	linesBefore: number;
	linesAfter: number;
	splitPrinting: boolean;
	splitHeight: number;
	splitDelay: number;
};

type Settings = {
	printerType: string;
	printerEndpoint: string;
	printerWidth: number;
	commands: Commands;
	stylesheets: string[];
	spellcheckerLanguages: string[];
	packageRepos: string[];
};

export default Settings;
export { Commands };
