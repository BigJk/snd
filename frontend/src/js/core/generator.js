import { render as renderTemplate } from './templating';

// Add a seedable rng + dice roller to the template
// PRNG: https://github.com/davidbau/seedrandom
// Dice Roller: https://dice-roller.github.io/documentation/
//
// TODO: include it locally
const rngScript = (seed) => {
	return `
		<script src="//cdnjs.cloudflare.com/ajax/libs/seedrandom/3.0.5/seedrandom.min.js"></script>
		<script src="https://unpkg.com/mathjs@9.3.2/lib/browser/math.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/random-js@2.1.0/dist/random-js.umd.min.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/@dice-roller/rpg-dice-roller@5.2.1/lib/umd/bundle.min.js"></script>
		<script>
			window.random = new Math.seedrandom('${seed}');
			
			rpgDiceRoller.NumberGenerator.generator.engine = {
			  next () {
				return Math.abs(window.random.int32());
			  },
			};
			
			window.dice = new rpgDiceRoller.DiceRoller();
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
