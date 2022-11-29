import { transform } from 'lodash-es';

import api from '/js/core/api';
import store from '/js/core/store';

import { Base, GeneratorEdit, Header, Loading } from '/js/ui/components';

import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		id: null,
		generator: null,
		testConfig: {},
		lastRender: '',
	};

	let loadTemplate = () => {
		api.getGenerator(state.id).then((generator) => {
			state.generator = generator;
		});
	};

	let breadcrumbs = () => {
		return [
			{
				name: 'Generators',
				link: '/generators',
			},
			{
				name: state.generator?.name ?? '...',
				link: state.id ? '/generators/' + state.id : undefined,
			},
			{
				name: 'Editing',
			},
		];
	};

	let body = (vnode) => {
		if (!state.generator) {
			return <Loading />;
		}

		return (
			<div className='flex-grow-1 overflow-auto'>
				<GeneratorEdit target={state.generator} editmode={true} onrender={(r) => (state.lastRender = r)} />
			</div>
		);
	};

	return {
		oninit(vnode) {
			state.id = vnode.attrs.id;
			loadTemplate();
		},
		view(vnode) {
			return (
				<Base active='generators'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} subtitle='Edit this Template' pt={2}>
							<div
								className='btn btn-primary mr2'
								onclick={() => api.print(state.lastRender).then(() => success('Printing send'), error)}
							>
								Test Print
							</div>
							<div
								className='btn btn-success'
								onclick={() =>
									api
										.saveGenerator(state.generator)
										.then(() => {
											success('Generator saved');
											store.pub('reload_generators');
											m.route.set('/generators');
										})
										.catch(error)
								}
							>
								Save
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		},
	};
};
