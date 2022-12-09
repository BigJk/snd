import { clone, groupBy, map, pickBy } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import { ModalInfo } from './modals';

import api from '/js/core/api';
import { render } from '/js/core/generator';
import store from '/js/core/store';

import { GeneratorConfig, Header, Input, ModalExport, ModalImport, Preview, Switch, Tooltip } from '/js/ui/components';
import Base from '/js/ui/components/base';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
		},
		export: {
			id: '',
			g: null,
			show: false,
		},
		info: {
			show: false,
			id: '',
		},
		configs: {},
		rendered: {},
		entries: {},
		settings: {},
	};

	let sanitizeConfig = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		// create base config
		if (state.configs[id] === undefined) {
			state.configs[id] = {
				seed: 'TEST_SEED',
			};
		}

		// set seed if uninitialized
		if (state.configs[id].seed === undefined) {
			state.configs[id].seed = 'TEST_SEED';
		}

		// set default values for initialized fields
		g.config.forEach((conf) => {
			if (state.configs[id][conf.key] === undefined) {
				state.configs[id][conf.key] = conf.default;
			}
		});

		// remove old fields that are not present in the config anymore.
		state.configs[id] = pickBy(state.configs[id], (val, key) => (
				key === 'seed' ||
				g.config.some((conf) => conf.key === key)
			));
	};

	let rerender = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		return render(g, state.entries[id], state.configs[id])
			.then((res) => {
				state.rendered[id] = res;
			})
			.catch(error);
	};

	let onimport = (type, url) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api.importGeneratorZip(file)
								.then((name) => {
									success(`Imported '${name}' successful`);
									store.pub('reload_generators');
								})
								.catch(error)
								.then(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					} else {
						readFile().then((res) => {
							state.importing.loading = true;
							api.importGeneratorZip(res)
								.then((name) => {
									success(`Imported '${name}' successful`);
									store.pub('reload_generators');
								})
								.catch(error)
								.then(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						});
					}
				}
				break;
			case 'folder':
				{
					openFolderDialog().then((folder) => {
						state.importing.loading = true;
						api.importGeneratorFolder(folder)
							.then((name) => {
								success(`Imported '${name}' successful`);
								store.pub('reload_generators');
							})
							.catch(error)
							.then(() => {
								state.importing.show = false;
								state.importing.loading = false;
							});
					});
				}
				break;
			case 'url':
				{
					state.importing.loading = true;
					api.importGeneratorUrl(url)
						.then((name) => {
							success(`Imported '${name}' successful`);
							store.pub('reload_generators');
						})
						.catch(error)
						.then(() => {
							state.importing.show = false;
							state.importing.loading = false;
						});
				}
				break;
		}
	};

	let onexport = (type) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFolderDialog().then((folder) => {
							api.exportGeneratorZip(state.export.id, folder)
								.then((file) => success('Wrote ' + file))
								.catch(error)
								.then(() => (state.export.show = false));
						});
					} else {
						window.open('/api/export/generator/zip/' + state.export.id, '_blank');
						state.export.show = false;
					}
				}
				break;
			case 'folder':
				{
					openFolderDialog().then((folder) => {
						api.exportGeneratorFolder(state.export.id, folder)
							.then((file) => success('Wrote ' + file))
							.catch(error)
							.then(() => (state.export.show = false));
					});
				}
				break;
		}
	};

	let updater = null;

	return {
		oninit() {
			store.pub('reload_generators');
			updater = setInterval(() => {
				store.pub('reload_generators');
			}, 5000);
		},
		onremove() {
			clearInterval(updater);
		},
		view() {
			return (
				<Base active='generators'>
					<Header title='Generators' subtitle='Generators create unique content that you can use to spice up your session.' classes='pt2'>
						<div className='btn btn-success mr2' onclick={() => m.route.set('/generators/new')}>
							Create New
						</div>
						<Tooltip content='Import'>
							<div className='btn btn-primary' onclick={() => (state.importing.show = true)}>
								<i className='ion ion-md-log-in' />
							</div>
						</Tooltip>
						<div className='divider-vert' />
						<Input placeholder='Search...' value={state.search} oninput={binder.inputString(state, 'search')} />
					</Header>
					<div className='pa3 flex flex-wrap'>
						{map(
							groupBy(
								store.data.generators?.filter((t) => (
										state.search.length === 0 ||
										t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
										t.author.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
									)),
								'author'
							),
							(val, key) => (
									<div className='w-100 mb3'>
										<div className='mb2 f5'>
											Generators by <b>{key}</b>
										</div>
										<div className='flex flex-wrap'>
											{val.map((g) => {
												if (
													g.name.toLowerCase().indexOf(state.search.toLowerCase()) === -1 &&
													g.author.toLowerCase().indexOf(state.search.toLowerCase()) === -1
												) {
													return;
												}

												let id = `gen:${g.author}+${g.slug}`;

												sanitizeConfig(g);

												if (state.rendered[id] === undefined) {
													rerender(g).then(m.redraw);
												}

												if (state.settings[id] === undefined) {
													state.settings[id] = {
														open: false,
														reroll: false,
														amount: 1,
													};
												}

												if (state.entries[id] === undefined) {
													api.getEntriesWithSources(`gen:${g.author}+${g.slug}`).then((entries) => {
														state.entries[id] = entries ?? [];
													});
												}

												return (
													<div className='w-100 flex mb3'>
														<div
															className={`flex-grow-1 ${state.settings[id].open ? 'mr3' : ''} ba b--black-10 bg-white`}
														>
															<div className='flex-grow-1 pv2 ph2 lh-solid flex flex-column justify-between'>
																<div>
																	<div
																		className={`f5 ${
																			state.settings[id].open ? 'mb2' : ''
																		} flex justify-between lh-copy`}
																	>
																		<div className='flex items-center'>
																			<i
																				className={`ion ${
																					state.settings[id].open
																						? 'ion-md-arrow-dropup'
																						: 'ion-md-arrow-dropdown'
																				} f3 mh3 dim pointer`}
																				onclick={() => (state.settings[id].open = !state.settings[id].open)}
																			/>
																			<div>
																				<div className='flex items-center'>{g.name}</div>
																				<div className='fw4 f7 black-50'>{g.description}</div>
																			</div>
																		</div>

																		<span className='f8 fw4 text-muted flex-shrink-0 ml3'>
																			{g.author}/{g.slug}
																		</span>
																	</div>
																	{state.settings[id].open ? <div className='divider' /> : null}
																</div>
																{state.settings[id].open
																	? [
																			<div
																				className='ba br2 b--black-05 mb2 overflow-auto ph3 pv2'
																				style='height: 400px;'
																			>
																				<GeneratorConfig
																					config={g.config}
																					value={state.configs[id]}
																					onchange={(key, val) => {
																						state.configs[id][key] = val;
																						rerender(g).then(m.redraw);
																					}}
																				></GeneratorConfig>
																			</div>,
																			<div className='flex'>
																				<div
																					className='flex-grow-1 btn btn-success'
																					onclick={() => {
																						for (let j = 0; j < state.settings[id].amount; j++) {
																							let config = clone(state.configs[id]);

																							if (j > 0) {
																								config.seed += '_' + j;
																							}

																							render(g, null, config)
																								.then((res) => {
																									api.print(res)
																										.then(() => success('Printing send'))
																										.catch(error);
																								})
																								.catch(error);
																						}

																						if (state.settings[id].reroll) {
																							state.configs[id]['seed'] = Math.ceil(
																								Math.random() * 1000000000
																							);
																							rerender(g).then(m.redraw);
																						}
																					}}
																				>
																					<i className='ion ion-md-print mr1' /> Print
																				</div>
																				<div className='divider-vert' />
																				<Tooltip content={'Edit'}>
																					<div
																						className='btn btn-primary w2 mr2'
																						onclick={() =>
																							m.route.set(`/generators/gen:${g.author}+${g.slug}/edit`)
																						}
																					>
																						<i className='ion ion-md-settings' />
																					</div>
																				</Tooltip>
																				<Tooltip content={'Export Options'}>
																					<div
																						className='btn btn-primary w2 mr2'
																						onclick={() => (state.export = { show: true, g: g, id: id })}
																					>
																						<i className='ion ion-md-open' />
																					</div>
																				</Tooltip>
																				<Tooltip content={'API Information'}>
																					<div
																						className={`btn btn-primary w2 mr2`}
																						onclick={() => {
																							state.info.id = id;
																							state.info.show = true;
																						}}
																					>
																						<i className={`ion ion-md-information`} />
																					</div>
																				</Tooltip>
																				<Tooltip content={'Delete'}>
																					<div
																						className='btn btn-error w2'
																						onclick={() =>
																							dialogWarning(
																								`Do you really want to delete the '${g.name}' generator?`
																							).then(() =>
																								api.deleteGenerator(id).then(() => {
																									delete state.configs[id];
																									delete state.rendered[id];
																									store.pub('reload_generators');
																								})
																							)
																						}
																					>
																						<i className='ion ion-md-close-circle' />
																					</div>
																				</Tooltip>
																			</div>,
																			<div className='flex'>
																				<div className='w5 mr3'>
																					<Input
																						label='Amount to Generate'
																						value={state.settings[id].amount}
																						oninput={binder.inputNumber(state.settings[id], 'amount')}
																					></Input>
																				</div>
																				<Switch
																					label='Reroll Seed'
																					value={state.settings[id].reroll}
																					oninput={binder.checkbox(state.settings[id], 'reroll')}
																				></Switch>
																			</div>,
																		]
																	: null}
															</div>
														</div>
														{state.settings[id].open ? (
															<div className='flex-shrink-0'>
																<Preview
																	className='br1 ba b--black-10 bg-black-05 w-100 h-100'
																	stylesheets={store.data.settings.stylesheets}
																	width={350}
																	scale={350 / store.data.settings.printerWidth}
																	content={state.rendered[id]}
																/>
															</div>
														) : null}
													</div>
												);
											})}
										</div>
									</div>
								)
						)}
					</div>
					<ModalImport
						type={'generator'}
						show={state.importing.show}
						loading={state.importing.loading}
						onimport={onimport}
						onclose={() => {
							state.importing.show = false;
							state.importing.loading = false;
						}}
					></ModalImport>
					<ModalExport
						type={'generator'}
						prefix={'gen_'}
						show={state.export.show}
						value={state.export.g}
						onexport={onexport}
						onclose={() => (state.export.show = false)}
					></ModalExport>
					<ModalInfo id={state.info.id} config={state.configs[state.info.id]} onclose={() => (state.info.show = false)}></ModalInfo>
				</Base>
			);
		},
	};
};
