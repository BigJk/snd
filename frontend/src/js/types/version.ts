export type LocalVersion = {
	buildTime: string;
	gitCommitHash: string;
	gitBranch: string;
};

export type GitTag = {
	name: string;
	zipballURL: string;
	tarballURL: string;
	commit: {
		sha: string;
		url: string;
	};
	nodeID: string;
};

export type NewVersion = {
	localVersion: LocalVersion;
	latestVersion: GitTag;
	newest: boolean;
};
