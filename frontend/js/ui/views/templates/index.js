import m from 'mithril';

import * as nunjucks from 'nunjucks';

import store from '../../../core/store';
import binder from '../../binder';

import Base from '../../components/base';
import Preview from '../../components/preview';
import Header from '../../components/header';
import Loading from '../../components/loading';
import Input from '../../components/input';

import map from 'lodash-es/map';

let tryParse = data => {
	try {
		return JSON.parse(data);
	} catch (e) {}
	return {};
};

export default () => {
	let state = { search: '' };

	let body = () => {
		if (!store.there('templates')) {
			return <Loading />;
		}

		return (
			<div className="">
				<div className="w-100 pr3">
					{map(store.data.templates, (v, k) => {
						return (
							<div className="w-25-l w-50 fl">
								<div className="pl3 pt3 flex flex-column">
									<Preview className="no-input h4 br2 br--top bg-secondary" overflow="hidden" width={'100%'} scale={0.5} content={nunjucks.renderString(v.printTemplate, { it: tryParse(v.skeletonData) })} stylesheets={store.data.settings.stylesheets} />
									<div className="pa2 bg-dark hover-bg-dark-lighten lh-solid pointer" onclick={() => m.route.set('/templates/' + v.id)}>
										<div className="f6 fw7 mb1 white">{v.name}</div>
										<div className="f7 white-80 cut-text">{v.description}</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	let updater = null;

	return {
		oninit() {
			store.pub('reload_templates');
			updater = setInterval(() => {
				store.pub('reload_templates');
			}, 5000);
		},
		onremove() {
			clearInterval(updater);
		},
		view(vnode) {
			return (
				<Base active={'templates'}>
					<div className="w-100 h-100">
						<Header title="Templates" subtitle="List all your awesome Templates">
							<div className="btn btn-success" onclick={() => m.route.set('/templates/new')}>
								Create New
							</div>
							<div className="divider-vert" />
							<Input placeholder="Search..." value={state.search} oninput={binder.inputString(state, 'search')} />
						</Header>
						<div className="ph3">
							{store.data.templates
								?.filter(t => {
									return state.search.length === 0 || t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0;
								})
								.map(t => {
									return (
										<div className="w-100 flex ba b--black-10 h4 mb2 bg-white">
											<div className="flex-shrink-0 ph1 mr2 br b--black-05 bg-black-05">
												<Preview className="h-100" content={nunjucks.renderString(t.printTemplate, { it: tryParse(t.skeletonData) })} stylesheets={store.data.settings.stylesheets} width={150} scale={0.3} />
											</div>
											<div className="flex-grow-1 pv2 pr2 lh-solid flex flex-column justify-between">
												<div>
													<div className="f5 mb1">{t.name}</div>
													<div className="fw4 f7 black-50">{t.description}</div>
												</div>
												<div className="flex justify-between items-end">
													<div className="lh-solid">
														<div className="f4 b">{t.count}</div>
														<span className="fw4 f6 black-50">Entries</span>
													</div>
													<div className="btn" onclick={() => m.route.set(`/templates/${t.id}`)}>
														Open Template
													</div>
												</div>
											</div>
										</div>
									);
								})}
						</div>
					</div>
				</Base>
			);

			return (
				<Base active={'templates'} subtitle="List all existing Templates">
					<div className="h-100 flex justify-between overflow-auto">
						<div className="h-100 flex flex-column">
							<Header title={'Templates'}>
								<div className="btn btn-success btn-sm" onclick={() => m.route.set('/templates/new')}>
									Create New
								</div>
							</Header>
							{body()}
						</div>
					</div>
				</Base>
			);
		}
	};
};
