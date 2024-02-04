/**
 * Slugify a string. A slug only contains lowercase letters, numbers and the dash character.
 * @param input The string to slugify
 */
export const slug = (input: string): string =>
	input
		.toLowerCase()
		.replace(/[^a-z0-9\-]/g, '')
		.replace(/-+/g, '-');

/**
 * Authorify a string. An author only contains lowercase letters, numbers and the dash character.
 * @param input The string to nameify
 */
export const author = (input: string): string => input.replace(/[^a-zA-Z0-9\-]/g, '').replace(/-+/g, '-');
