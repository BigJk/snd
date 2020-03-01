import m from 'mithril';

import Base from '../../components/base';
import Header from '../../components/header';
import ScriptEdit from '../../components/script-edit';

import { newScript } from '../../../core/factory';

import api from '../../../core/api';

import { success, error } from '../../toast';

export default () => {
	let state = {
		script: newScript()
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
			link: '/scripts'
		},
		{
			name: 'New'
		}
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
		}
	};
};
