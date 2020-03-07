import m from 'mithril';

import api from 'core/api';

import * as nunjucks from 'nunjucks';
import * as msgpack from 'msgpack-lite';

import store from 'core/store';
import binder from 'ui/binder';

import { Base, Preview, Header, Loading, Input, Modal, TextArea, Select, Switch, Form } from 'components/*';

import transform from 'lodash-es/transform';
import merge from 'lodash-es/merge';

import { error, success } from 'ui/toast';

let tryParse = data => {
	try {
		return JSON.parse(data);
	} catch (e) {}
	return {};
};

let tryRender = (t, v) => {
	try {
		return nunjucks.renderString(t, v);
	} catch (e) {}
	return 'Template error';
};

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			text: '',
			target: 0,
			parsed: null,
			types: {
				printTemplate: true,
				listTemplate: true,
				name: true,
				description: true,
				skeletonData: true
			}
		}
	};

	let modal = () => {
		if (!store.there('templates') || !state.importing.show) return null;

		let parsedTemplate = () => {
			if (!state.importing.parsed) return null;

			return (
				<div>
					<div className="pt1">
						<div className="divider" />
						<div className="flex justify-between">
							<div>
								<div className="f5">{state.importing.parsed.name}</div>
								<div className="f7 pb1 black-50">{state.importing.parsed.description}</div>
							</div>
							<Form horizontal={true} className="w-40 form-no-margin">
								<Switch label="Name" labelCol={9} value={state.importing.types.name} oninput={binder.checkbox(state.importing.types, 'name')} />
								<Switch label="Description" labelCol={9} value={state.importing.types.description} oninput={binder.checkbox(state.importing.types, 'description')} />
								<Switch label="Print Template" labelCol={9} value={state.importing.types.printTemplate} oninput={binder.checkbox(state.importing.types, 'printTemplate')} />
								<Switch label="List Template" labelCol={9} value={state.importing.types.listTemplate} oninput={binder.checkbox(state.importing.types, 'listTemplate')} />
								<Switch label="Data Skeleton" labelCol={9} value={state.importing.types.skeletonData} oninput={binder.checkbox(state.importing.types, 'skeletonData')} />
							</Form>
						</div>
						<div className="divider" />
					</div>

					<Select label="Target" default="New Template..." keys={store.data.templates.map(t => t.id)} names={store.data.templates.map(t => t.name)} selected={state.importing.target} oninput={binder.inputNumber(state.importing, 'target')} />
					<div
						className="btn btn-primary"
						onclick={() => {
							if (!state.importing.parsed) {
								return;
							}

							let temp = transform(state.importing.parsed, (res, val, key) => {
								if (state.importing.types[key]) {
									res[key] = val;
								}
							});

							if (state.importing.target > 0) {
								temp = merge(store.data.templates.filter(t => t.id === state.importing.target)[0], temp);
							}

							if (state.importing.target === 0 && !temp.name) {
								error('New Templates need a Name');
								return;
							}

							api.saveTemplate(temp).then(
								() => {
									success('Template imported');
									store.pub('reload_templates');
									state.importing.show = false;
								},
								e => error(e)
							);
						}}
					>
						Import
					</div>
				</div>
			);
		};

		return (
			<Modal
				title="Import"
				onclose={() => {
					state.importing.text = '';
					state.importing.parsed = null;
					state.importing.show = null;
				}}
			>
				<div className="mb2">Template Code</div>
				<TextArea
					placeholder="dmVyeSBsb25nIGNvZGUuLi4..."
					rows={4}
					oninput={binder.inputString(state.importing, 'text', () => {
						try {
							state.importing.parsed = null;
							state.importing.parsed = JSON.parse(
								msgpack.decode(
									atob(state.importing.text)
										.split('')
										.map(s => s.charCodeAt(0))
								)
							);

							if (!state.importing.parsed.name) {
								state.importing.parsed = null;
							}
						} catch (e) {}
					})}
				/>
				{parsedTemplate()}
			</Modal>
		);
	};

	let body = () => {
		if (!store.there('templates')) {
			return <Loading />;
		}

		return (
			<div className="ph3 pb3 flex flex-wrap">
				{store.data.templates
					?.filter(t => {
						return state.search.length === 0 || t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0;
					})
					.map((t, i) => {
						return (
							<div className={`w-50 ${(i & 1) == 0 ? 'pr2' : ''}`}>
								<div className="flex ba b--black-10 h4 mb2 bg-white">
									<div className="flex-shrink-0 ph1 mr2 br b--black-05 bg-black-05">
										<Preview className="h-100" content={tryRender(t.printTemplate, { it: tryParse(t.skeletonData) })} stylesheets={store.data.settings.stylesheets} width={150} scale={0.3} />
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
							</div>
						);
					})}
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
							<div className="btn btn-success mr2" onclick={() => m.route.set('/templates/new')}>
								Create New
							</div>
							<div className="btn btn-primary" onclick={() => (state.importing.show = true)}>
								<i className="ion ion-md-log-in" />
							</div>
							<div className="divider-vert" />
							<Input placeholder="Search..." value={state.search} oninput={binder.inputString(state, 'search')} />
						</Header>
						{body()}
						{modal()}
					</div>
				</Base>
			);
		}
	};
};
