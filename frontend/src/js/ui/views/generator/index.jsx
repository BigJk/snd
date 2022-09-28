import { Header, Input, Tooltip } from '/js/ui/components';
import Base from '/js/ui/components/base';

import binder from '/js/ui/binder';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
			url: '',
		},
	};

	return {
		view() {
			return (
				<Base active='generators'>
					<Header title='Generators' subtitle='Generators create unique content that you can use to spice up your session.' classes='pt2'>
						<div className='btn btn-success mr2' onclick={() => m.route.set('/generators/new')}>
							Create New
						</div>
						<Tooltip content='Import'>
							<div className='btn btn-primary' onclick={() => (state.importing.show = true)}>
								<i className='ion ion-md-log-in' />
							</div>
						</Tooltip>
						<div className='divider-vert' />
						<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search')} />
					</Header>
				</Base>
			);
		},
	};
};
