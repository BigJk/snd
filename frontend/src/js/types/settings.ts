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
	syncEnabled: boolean;
	aiEnabled: boolean;
	aiApiKey: string;
	aiProvider: string;
	aiModel: string;
	aiContextWindow: number;
	aiMaxTokens: number;
};

export function createEmptySettings(): Settings {
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
		syncEnabled: false,
		aiEnabled: false,
		aiApiKey: '',
		aiProvider: '',
		aiModel: '',
		aiContextWindow: 0,
		aiMaxTokens: 0,
	};
}

export default Settings;
export { Commands };
