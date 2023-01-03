import { isPlainObject } from 'lodash-es';

export const DATA_SOURCE_TYPE = 'ds';
export const TEMPLATE_TYPE = 'tmpl';
export const GENERATOR_TYPE = 'gen';

export function idFormat(type, author, slug) {
	return `${type}:${author}+${slug}`;
}

// Returns a data source identifier (e.g. ds:author+slug). Expects either a Data Source object as single argument
// or an author and slug as string arguments.
export function dataSourceId(dsOrAuthor, slug) {
	if (isPlainObject(dsOrAuthor)) {
		return idFormat(DATA_SOURCE_TYPE, dsOrAuthor.author, dsOrAuthor.slug);
	}
	return idFormat(DATA_SOURCE_TYPE, dsOrAuthor, slug);
}

// Returns a template identifier (e.g. tmpl:author+slug). Expects either a Template object as single argument
// or an author and slug as string arguments.
export function templateId(tmplOrAuthor, slug) {
	if (isPlainObject(tmplOrAuthor)) {
		return idFormat(TEMPLATE_TYPE, tmplOrAuthor.author, tmplOrAuthor.slug);
	}
	return idFormat(TEMPLATE_TYPE, tmplOrAuthor, slug);
}

// Returns a generator identifier (e.g. tmpl:author+slug). Expects either a Generator object as single argument
// or an author and slug as string arguments.
export function generatorId(genOrAuthor, slug) {
	if (isPlainObject(genOrAuthor)) {
		return idFormat(GENERATOR_TYPE, genOrAuthor.author, genOrAuthor.slug);
	}
	return idFormat(GENERATOR_TYPE, genOrAuthor, slug);
}

// Checks if the basic information that Data Source, Template and Generator share are valid. Returns a object in the form of:
// { valid: false, reason: 'error message' }
export function validBaseInformation(data) {
	if (data.name.length === 0) {
		return {
			valid: false,
			reason: 'Please insert a name',
		};
	}

	if (data.author.length === 0) {
		return {
			valid: false,
			reason: 'Please insert a author',
		};
	}

	if (!/[a-z0-9-]+/gi.test(data.author)) {
		return {
			valid: false,
			reason: 'Author should can only contain alphanumerical characters and the - symbol.',
		};
	}

	if (data.slug.length === 0) {
		return {
			valid: false,
			reason: 'Please insert a slug',
		};
	}

	if (!/[a-z0-9-]+/gi.test(data.slug)) {
		return {
			valid: false,
			reason: 'Slug should can only contain alphanumerical characters and the - symbol.',
		};
	}

	return { valid: true };
}
