export function buildDefaultConfig(configs) {
	configs = configs || [];
	let defaults = {};
	configs.forEach((c) => (defaults[c.key] = c.default));
	return defaults;
}
