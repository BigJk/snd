import { render as renderTemplate } from './templating';

// Add a seedable rng to the template
// https://github.com/davidbau/seedrandom
//
// TODO: include it locally
const rngScript = (seed) => {
	return `
		<script src="//cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js"></script>
		<script>
			window.random = new Math.seedrandom('${seed}');
		</script>
`;
};

export function render(generator, entries, config) {
	return renderTemplate(
		(generator.passEntriesToJS ? `<script> let entries = ${JSON.stringify(state.entries)};</script>` : '') +
			rngScript(config.seed ?? 'test-seed') +
			generator.printTemplate,
		{ config: config, images: generator.images, entries: entries }
	);
}
