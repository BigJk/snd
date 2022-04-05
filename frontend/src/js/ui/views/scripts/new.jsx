import { Base, Header, ScriptEdit } from '/js/ui/components';

import { newScript } from '/js/core/factory';

import api from '/js/core/api';

import { success, error } from '/js/ui/toast';

export default () => {
	let state = {
		script: newScript(),
	};

	let saveScript = () => {
		if (state.script.name.length === 0) {
			error('Please insert a name');
			return;
		}

		api.saveScript(state.script).then(() => {
			success('Script saved');
			m.route.set('/scripts');
		}, error);
	};

	let breadcrumbs = [
		{
			name: 'Scripts',
			link: '/scripts',
		},
		{
			name: 'New',
		},
	];

	return {
		view(vnode) {
			return (
				<Base active={'scripts'}>
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs} subtitle="Create a new Script">
							<div className="btn btn-success" onclick={saveScript}>
								Save
							</div>
						</Header>
						<ScriptEdit target={state.script} />
					</div>
				</Base>
			);
		},
	};
};
