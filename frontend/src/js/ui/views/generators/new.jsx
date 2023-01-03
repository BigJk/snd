import api from '/js/core/api';
import { NewGenerator } from '/js/core/factory';
import { validBaseInformation } from '/js/core/model-helper';
import store from '/js/core/store';
import { generatorById } from '/js/core/store-helper';

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
				let dupeGenerator = generatorById(vnode.attrs.id);
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
									let { valid, reason } = validBaseInformation(state.generator);

									if (!valid) {
										error(reason);
										return;
									}

									if (generatorById(vnode.attrs.id)) {
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
