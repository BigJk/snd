import m from 'mithril';

import api from '../../../core/api';
import store from '../../../core/store';

import Base from '../../components/base';
import Header from '../../components/header';
import Loading from '../../components/loading';

import { error, success } from '../../toast';

export default () => {
	let state = {
		scripts: null
	};

	let getScripts = () => {
		api.getScripts().then(scripts => (state.scripts = scripts));
	};

	let body = () => {
		if (!state.scripts) {
			return <Loading />;
		}

		return (
			<div className="flex flex-column pa3">
				{state.scripts.map(s => {
					return (
						<div className="mb3 flex justify-between items-center flex-grow-1 bg-secondary ph3 pv2">
							<div className="lh-solid mw5">
								<div className="f6 fw7 mb1">{s.name}</div>
								<div className="f7">{s.description ?? 'This script has no description...'}</div>
							</div>
							<div className="h2 flex justify-between items-center">
								<div className="w2 h-75 pointer bg-dark hover-bg-dark-lighten flex-centered mr2" onclick={() => m.route.set(`/scripts/${s.id}`)}>
									<i className="ion ion-md-search f6" />
								</div>
								<div className="w2 h-75 pointer bg-success hover-bg-success-lighten flex-centered mr2" onclick={() => api.runScript(s.id).then(() => success('Script started'), error)}>
									<i className="ion ion-md-play f6" />
								</div>
								<div
									className="w2 h-75 pointer bg-error hover-bg-error-lighten flex-centered"
									onclick={() =>
										api.deleteScript(s.id).then(() => {
											success('Script deleted');
											getScripts();
										}, error)
									}
								>
									<i className="ion ion-md-close-circle-outline f6" />
								</div>
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	return {
		oninit(vnode) {
			getScripts();
		},
		view(vnode) {
			return (
				<Base active={'scripts'}>
					<div className="h-100 flex flex-column">
						<Header title={'Scripts'}>
							<div className="btn btn-success btn-sm" onclick={() => m.route.set('/scripts/new')}>
								New Script
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		}
	};
};
