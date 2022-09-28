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
