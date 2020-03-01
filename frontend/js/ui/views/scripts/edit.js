import m from 'mithril';

import Base from '../../components/base';
import Header from '../../components/header';
import ScriptEdit from '../../components/script-edit';
import Loading from '../../components/loading';

import api from '../../../core/api';

import { success, error } from '../../toast';

export default () => {
	let state = {
		script: null
	};

	let saveScript = run => {
		if (state.script.name.length === 0) {
			error('Please insert a name');
			return;
		}

		api.saveScript(state.script).then(() => {
			if (!run) {
				success('Script saved');
			} else {
				api.runScript(state.script.id).then(() => success('Script started'), error);
			}
		}, error);
	};

	let breadcrumbs = () => {
		return [
			{
				name: 'Scripts',
				link: '/scripts'
			},
			{
				name: state.script?.name ?? '...'
			},
			{
				name: 'Edit'
			}
		];
	};

	let body = () => {
		if (!state.script) return <Loading />;

		return (
			<div className="ph3 pb3 flex-grow-1 overflow-auto">
				<ScriptEdit target={state.script} />
			</div>
		);
	};

	return {
		oninit(vnode) {
			api.getScript(parseInt(vnode.attrs.id)).then(script => (state.script = script));
		},
		view(vnode) {
			return (
				<Base active={'scripts'}>
					<div className="h-100 flex flex-column">
						<Header breadcrumbs={breadcrumbs()} subtitle="Edit this Script">
							<div className="btn btn-primary mr2" onclick={saveScript.bind(this, true)}>
								Run
							</div>
							<div className="btn btn-success" onclick={saveScript.bind(this, false)}>
								Save
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		}
	};
};
