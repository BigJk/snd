import DataSource from './data-source';
import Generator from './generator';
import Template from './template';

type PublicEntry = {
	author: string;
	contact: string;
	repos: RepoEntry[];
};

type RepoEntry = {
	name: string;
	description: string;
	url: string;
};

type PublicList = {
	name: string;
	author: string;
	description: string;
	entries: PublicEntry[];
};

type Tag = {
	hash: string;
	name: string;
	date: Date;
};

type Repo = {
	url: string;
	readme: string;
	versions: Record<string, Tag>;
};

type Package = {
	author: string;
	type: string;
	version: string;

	template?: Template;
	dataSource?: DataSource;
	generator?: Generator;
};

export default PublicList;
export { PublicEntry, RepoEntry, Tag, Repo, Package };
