type Commands = {
	explicitInit: boolean;
	cut: boolean;
	forceStandardMode: boolean;
	linesBefore: number;
	linesAfter: number;
	splitPrinting: boolean;
	splitHeight: number;
	splitDelay: number;
	useEscStar: boolean;
};

type Settings = {
	printerType: string;
	printerEndpoint: string;
	printerWidth: number;
	commands: Commands;
	spellcheckerLanguages: string[];
	packageRepos: string[];
	syncKey: string;
	syncEnabled: boolean;
	aiEnabled: boolean;
	aiAlwaysAllow: boolean;
	aiApiKey: string;
	aiProvider: string;
	aiModel: string;
	aiContextWindow: number;
	aiMaxTokens: number;
	aiUrl: string;
};

/**
 * Create an empty settings object.
 */
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
		spellcheckerLanguages: [],
		packageRepos: [],
		syncKey: '',
		syncEnabled: false,
		aiEnabled: false,
		aiAlwaysAllow: false,
		aiApiKey: '',
		aiProvider: '',
		aiModel: '',
		aiContextWindow: 0,
		aiMaxTokens: 0,
		aiUrl: '',
	};
}

export default Settings;
export { Commands };
