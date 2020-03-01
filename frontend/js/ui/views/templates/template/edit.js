import m from 'mithril';

import api from '../../../../core/api';
import store from '../../../../core/store';

import Base from '../../../components/base';
import Header from '../../../components/header';
import EntryEdit from '../../../components/entry-edit';
import Loading from '../../../components/loading';

import { success, error } from '../../../toast';

export default () => {
	let state = {
		id: 0,
		entry: null,
		template: null,
		lastRender: ''
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

	let breadcrumbs = () => {
		return [
			{
				name: 'Templates',
				link: '/templates'
			},
			{
				name: state.template?.name ?? '...',
				link: state.template ? '/templates/' + state.template.id : undefined
			},
			{
				name: state.entry?.name ?? '...'
			},
			{
				name: 'Editing'
			}
		];
	};

	let body = vnode => {
		if (!state.entry || !state.template || !store.there(['settings'])) {
			return <Loading />;
		}

		return (
			<div className="flex-grow-1 overflow-auto">
				<EntryEdit target={state.entry} template={state.template} onrender={r => (state.lastRender = r)} />
			</div>
		);
	};

	return {
		oninit(vnode) {
			api.getEntry(parseInt(vnode.attrs.id), parseInt(vnode.attrs.eid)).then(entry => {
				state.entry = entry;
			});

			api.getTemplate(parseInt(vnode.attrs.id)).then(template => {
				state.template = template;
			});

			store.pub('reload_templates');
		},
		view(vnode) {
			return (
				<Base active="templates">
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()} subtitle="Edit this Template">
							<div className="btn btn-primary mr2" onclick={() => api.print(state.lastRender).then(() => success('Print send'), error)}>
								Test Print
							</div>
							<div className="btn btn-success" onclick={saveEntry}>
								Save
							</div>
						</Header>
						{body(vnode)}
					</div>
				</Base>
			);
		}
	};
};
