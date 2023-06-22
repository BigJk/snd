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
	syncKey: string;
	enableSync: boolean;
};

export function createEmptySettings() {
	return {
		printerType: 'unknown',
		printerEndpoint: '',
		printerWidth: 384,
		commands: {
			explicitInit: false,
			cut: false,
			forceStandardMode: false,
			linesBefore: 0,
			linesAfter: 0,
			splitPrinting: false,
			splitHeight: 0,
			splitDelay: 0,
		},
		stylesheets: [],
		spellcheckerLanguages: [],
		packageRepos: [],
		syncKey: '',
		enableSync: false,
	};
}

export default Settings;
export { Commands };
