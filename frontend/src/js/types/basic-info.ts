type BasicInfo = {
	name: string;
	slug: string;
	author: string;
	description: string;
	version: string;
};

export default BasicInfo;

/**
 * Builds an ID for a template, generator or data source.
 * @param type The type of the item.
 * @param info The basic info of the item.
 */
export function buildId(type: 'template' | 'generator' | 'source', info: BasicInfo): string {
	return `${{ template: 'tmpl', generator: 'gen', source: 'ds' }[type]}:${info.author}+${info.slug}`;
}
