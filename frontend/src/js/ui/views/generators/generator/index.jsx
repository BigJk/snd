import { clone, pickBy } from 'lodash-es';

import { inElectron, openFolderDialog } from '/js/electron';

import { ModalInfo } from './modals';

import api from '/js/core/api';
import * as fileApi from '/js/core/file-api';
import { render } from '/js/core/generator';
import store from '/js/core/store';

import { Base, GeneratorConfig, Header, Input, Loading, LoadingFullscreen, ModalExport, SplitView, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default function () {
	let state = {
		gen: null,
		entries: null,
		config: {
			seed: 'TEST_SEED',
		},
		printing: false,
		rendered: '',
		amount: 1,
		showExport: false,
		showInfo: false,
	};

	let breadcrumbs = () => [
		{
			name: 'Generators',
			link: '/generators',
		},
		{
			name: state.gen?.name ?? '...',
		},
	];

	let sanitizeConfig = () => {
		if (!state.gen) {
			return;
		}

		// set seed if uninitialized
		if (state.config.seed === undefined) {
			state.config.seed = 'TEST_SEED';
		}

		// set default values for initialized fields
		state.gen.config.forEach((conf) => {
			if (state.config[conf.key] === undefined) {
				state.config[conf.key] = conf.default;
			}
		});

		// remove old fields that are not present in the config anymore.
		state.config = pickBy(state.config, (val, key) => key === 'seed' || state.gen.config.some((conf) => conf.key === key));
	};

	let onexport = (type) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFolderDialog().then((folder) => {
							api
								.exportGeneratorZip(state.id, folder)
								.then((file) => success('Wrote ' + file))
								.catch(error)
								.finally(() => (state.showExport = false));
						});
					} else {
						window.open('/api/export/generator/zip/' + state.id, '_blank');
						state.showExport = false;
					}
				}
				break;
			case 'folder':
				if (inElectron) {
					openFolderDialog()
						.then((folder) => api.exportGeneratorFolder(state.id, folder))
						.then((file) => success('Wrote ' + file))
						.catch(error)
						.finally(() => (state.showExport = false));
				} else if (fileApi.hasFileApi) {
					Promise.all([fileApi.openFolderDialog(true), api.exportGeneratorJSON(state.id)])
						.then(([folder, json]) => fileApi.writeJSONToFolder(folder, json))
						.catch(error)
						.finally(() => (state.showExport = false));
				} else {
					error('Browser does not support File API');
				}
				break;
		}
	};

	let updateRender = () => render(state.gen, state.entries, state.config).then((res) => (state.rendered = res));

	let print = () => {
		if (state.printing || state.amount <= 0) return;

		state.printing = true;
		for (let j = 0; j < state.amount; j++) {
			let config = clone(state.config);
			let last = j === state.amount - 1;

			if (j > 0) {
				config.seed += '_' + j;
			}

			render(state.gen, state.entries, config)
				.then((res) => {
					api
						.print(res)
						.then(() => success('Printing send'))
						.catch(error)
						.finally(() => {
							if (last) {
								state.printing = false;
							}
						});
				})
				.catch(error);
		}

		state.config.seed = Math.ceil(Math.random() * 1000000000);
		updateRender().then(m.redraw);
	};

	let screenshot = () => {
		openFolderDialog().then((folder) => {
			let file = folder + '/' + state.config.seed + '.png';
			api.screenshot(state.rendered, folder + '/' + state.config.seed + '.png').then(() => success(`Screenshot '${file}' created`), error);
		});
	};

	let body = (vnode) => {
		if (!state.gen || !store.data.settings) {
			return <Loading />;
		}

		return (
			<SplitView width={340} scale={340.0 / store.data.settings.printerWidth} stylesheets={store.data.settings.stylesheets} content={state.rendered}>
				<div className='h-100 flex flex-column overflow-auto'>
					<div className='flex-grow-1 overflow-auto ph3 pv2'>
						<GeneratorConfig
							config={state.gen.config}
							value={state.config}
							onchange={(key, val) => {
								state.config[key] = val;
								updateRender().then(m.redraw);
							}}
						/>
					</div>
					<div className='flex-shrink-0 pa3 bt b--black-05'>
						<div className='flex'>
							<div className='flex-grow-1 mr2'>
								<Input value={state.amount} oninput={binder.inputNumber(state, 'amount')} />
							</div>
							<div className='w-70 btn btn-success mr2' onclick={print}>
								<i className='ion ion-md-print mr1' /> Print
							</div>
							<Tooltip content='Screenshot the currently generated template.'>
								<div className='w-10 btn btn-primary' onclick={screenshot}>
									<i className='ion ion-md-camera' />
								</div>
							</Tooltip>
						</div>
					</div>
				</div>
			</SplitView>
		);
	};

	return {
		oninit(vnode) {
			state.id = vnode.attrs.id;

			api.getGenerator(vnode.attrs.id).then((gen) => {
				state.gen = gen;
				api.getEntriesWithSources(vnode.attrs.id).then((entries) => {
					state.entries = entries ?? [];
					updateRender();
				});
				sanitizeConfig();
			});
		},
		onupdate(vnode) {
			sanitizeConfig();
			updateRender();
		},
		view(vnode) {
			return (
				<Base active='generators'>
					<div className='h-100 flex flex-column'>
						<Header breadcrumbs={breadcrumbs()} pt={2} subtitle='Configure and print this generator.'>
							<div className='btn btn-primary mr2' onclick={() => m.route.set(`/generators/${vnode.attrs.id}/edit`)}>
								Edit
							</div>
							<Tooltip content='Duplicate'>
								<div className='btn btn-primary mr2' onclick={() => m.route.set(`/generators/dupe/${state.id}`)}>
									<i className='ion ion-md-copy' />
								</div>
							</Tooltip>
							<Tooltip content='Export Options'>
								<div className='btn btn-primary w2 mr2' onclick={() => (state.showExport = true)}>
									<i className='ion ion-md-open' />
								</div>
							</Tooltip>
							<Tooltip content='API Information'>
								<div className='btn btn-primary w2' onclick={() => (state.showInfo = true)}>
									<i className='ion ion-md-information' />
								</div>
							</Tooltip>
							<div className='divider-vert' />
							<Tooltip content='Delete'>
								<div
									className='btn btn-error w2'
									onclick={() => {
										dialogWarning(`Do you really want to delete the '${state.gen.name}' generator?`).then(() =>
											api.deleteGenerator(vnode.attrs.id).then(() => {
												store.pub('reload_generators');
												m.route.set('/generators');
											})
										);
									}}
								>
									<i className='ion ion-md-close-circle' />
								</div>
							</Tooltip>
						</Header>
						{body()}
						<LoadingFullscreen show={state.printing} />
						<ModalExport
							type='generator'
							prefix='gen_'
							show={state.showExport}
							value={state.gen}
							onexport={onexport}
							onclose={() => (state.showExport = false)}
						/>
						<ModalInfo show={state.showInfo} id={vnode.attrs.id} config={state.config} onclose={() => (state.showInfo = false)} />
					</div>
				</Base>
			);
		},
	};
}
