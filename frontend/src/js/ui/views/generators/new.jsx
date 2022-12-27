import api from '/js/core/api';
import { NewGenerator } from '/js/core/factory';
import store from '/js/core/store';

import { Base, GeneratorEdit, Header } from '/js/ui/components';

import { error, success } from '/js/ui/toast';

const breadcrumbs = [
	{
		name: 'Generators',
		link: '/generators',
	},
	{
		name: 'New',
	},
];

export default () => {
	let state = {
		generator: NewGenerator(),
	};

	return {
		oninit(vnode) {
			if (vnode.attrs.id) {
				let dupeGenerator = store.data.generators.find((tmpl) => `gen:${tmpl.author}+${tmpl.slug}` === vnode.attrs.id);
				if (dupeGenerator) {
					state.generator = dupeGenerator;
					state.generator.name += ' Copy';
					state.generator.slug += '-copy';
				}
			}
		},
		view(vnode) {
			return (
				<Base active='generators'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs} subtitle='Create a new Generator' pt={2}>
							<div
								className='btn btn-success'
								onclick={() => {
									if (state.generator.name.length === 0) {
										error('Please insert a name');
										return;
									}

									if (state.generator.author.length === 0) {
										error('Please insert a author');
										return;
									}

									if (state.generator.slug.length === 0) {
										error('Please insert a slug');
										return;
									}

									if (store.data.generators.find((gen) => `gen:${gen.author}+${gen.slug}` === vnode.attrs.id)) {
										error('This generator already exists');
										return;
									}

									api.saveGenerator(state.generator).then(() => {
										success('Generator saved');
										store.pub('reload_generators');
										m.route.set('/generators');
									}, error);
								}}
							>
								Save
							</div>
						</Header>
						<div className='flex-grow-1 overflow-auto'>
							<GeneratorEdit target={state.generator} />
						</div>
					</div>
				</Base>
			);
		},
	};
};
