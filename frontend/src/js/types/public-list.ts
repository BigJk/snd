type PublicEntry = {
	author: string;
	contact: string;
	repos: string[];
};

type PublicList = {
	name: string;
	author: string;
	description: string;
	entries: PublicEntry[];
};

export default PublicList;
export { PublicEntry };
