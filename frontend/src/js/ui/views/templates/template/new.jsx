import api from '/js/core/api';
import { NewEntry } from '/js/core/factory';
import store from '/js/core/store';

import { Base, EntryEdit, Header, Loading } from '/js/ui/components';

import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		entry: null,
		template: null,
		lastRender: '',
	};

	let saveEntry = () => {
		if (state.entry.name.length === 0) {
			error('Please insert a name');
			return;
		}

		api.saveEntry(state.template.id, state.entry).then(() => {
			success('Entry created');
			store.pub('reload_templates');
			m.route.set('/templates/' + state.template.id);
		}, error);
	};

	let breadcrumbs = () => [
		{
			name: 'Templates',
			link: '/templates',
		},
		{
			name: state.template?.name ?? '...',
			link: state.template ? '/templates/' + state.template.id : undefined,
		},
		{
			name: 'Entries',
		},
		{
			name: 'New',
		},
	];

	let body = (vnode) => {
		if (!state.entry || !state.template || !store.there(['settings'])) {
			return <Loading />;
		}

		return (
			<div className='flex-grow-1 overflow-auto'>
				<EntryEdit target={state.entry} template={state.template} onrender={(r) => (state.lastRender = r)} />
			</div>
		);
	};

	return {
		oninit(vnode) {
			state.entry = NewEntry();

			api.getTemplate(vnode.attrs.id).then((template) => {
				state.template = template;
				state.template.id = vnode.attrs.id;
			});
		},
		view(vnode) {
			return (
				<Base active='templates'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} subtitle='Create a new Entry' pt={2}>
							<div className='btn btn-primary mr2' onclick={() => api.print(state.lastRender).then(success('Print send'), error)}>
								Test Print
							</div>
							<div className='btn btn-success' onclick={saveEntry}>
								Save
							</div>
						</Header>
						{body(vnode)}
					</div>
				</Base>
			);
		},
	};
};
