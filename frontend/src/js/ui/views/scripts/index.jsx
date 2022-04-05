import api from '/js/core/api';

import { Base, Header, Loading } from '/js/ui/components';

import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		scripts: null,
	};

	let getScripts = () => {
		api.getScripts().then((scripts) => (state.scripts = scripts));
	};

	let body = () => {
		if (!state.scripts) {
			return <Loading />;
		}

		return (
			<div className="flex-grow-1 flex flex-column ph3 pb3 overflow-auto">
				<div className="h-100 br1 bg-white overflow-auto ba b--black-10">
					{state.scripts.map((s) => {
						return (
							<div
								className="flex justify-between items-center pa2 bb b--black-05 pointer hover-bg-secondary"
								onclick={(e) => {
									if (e.target.className.indexOf('btn') >= 0 || e.target.className.indexOf('ion') >= 0) return;
									m.route.set(`/scripts/${s.id}`);
								}}
							>
								<div className="lh-solid mw5">
									<div className="f6 fw7 mb1">{s.name}</div>
									<div className="f7 black-50">{s.description ?? 'This script has no description...'}</div>
								</div>
								<div className="h2 flex justify-between items-center">
									<div className="btn btn-success mr2" onclick={() => api.runScript(s.id).then(() => success('Script started'), error)}>
										<i className="ion ion-md-play" />
									</div>
									<div
										className="btn btn-error"
										onclick={() =>
											api.deleteScript(s.id).then(() => {
												success('Script deleted');
												getScripts();
											}, error)
										}
									>
										<i className="ion ion-md-close-circle-outline" />
									</div>
								</div>
							</div>
						);
					})}
				</div>
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
						<Header title="Scripts" subtitle="Create, Edit and Run Scripts">
							<div className="btn btn-success" onclick={() => m.route.set('/scripts/new')}>
								New Script
							</div>
						</Header>
						{body()}
					</div>
				</Base>
			);
		},
	};
};
