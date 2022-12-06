import { clone, groupBy, map, pickBy } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import { render } from '/js/core/generator';
import store from '/js/core/store';

import { GeneratorConfig, Header, Input, Modal, Preview, Switch, Tooltip } from '/js/ui/components';
import Base from '/js/ui/components/base';

import binder from '/js/ui/binder';
import { dialogWarning, error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
			url: '',
		},
		export: {
			id: '',
			g: null,
			show: false,
		},
		configs: {},
		rendered: {},
		entries: {},
		settings: {},
	};

	let sanitizeConfig = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		if (state.configs[id] === undefined) {
			state.configs[id] = {
				seed: 'TEST_SEED',
			};
		}

		g.config.forEach((conf) => {
			if (state.configs[id][conf.key] === undefined) {
				state.configs[id][conf.key] = conf.default;
			}
		});

		state.configs[id] = pickBy(state.configs[id], (val, key) => {
			return g.config.some((conf) => {
				return conf.key === key || key === 'seed';
			});
		});
	};

	let rerender = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		return render(g, state.entries[id], state.configs[id])
			.then((res) => {
				state.rendered[id] = res;
			})
			.catch(error);
	};

	let modal = () => {
		if (!state.importing.show) return null;

		if (state.importing.loading)
			return (
				<Modal title='Import' noclose={true}>
					<div className='flex flex-column justify-center items-center'>
						<div className='loading loading-lg mb2' />
						Fetching data...
					</div>
				</Modal>
			);

		return (
			<Modal
				title='Import'
				onclose={() => {
					state.importing.show = false;
					state.importing.url = '';
					state.importing.loading = false;
				}}
			>
				<div className='mb3 lh-copy'>
					<div className='mb2'>
						<b>Import generator either locally (e.g. .zip, folder) or from the internet via a URL</b>
					</div>
					<div>
						<b>Warning:</b> A generator with the same author and identification name will overwrite any previous imported version!
					</div>
				</div>
				<div className='mb3'>
					<div
						className='btn btn-primary mr2'
						onclick={() => {
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
						}}
					>
						Import .zip
					</div>
					<div
						className='btn btn-primary'
						onclick={() => {
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
						}}
					>
						Import Folder
					</div>
				</div>
				<div className='divider' />
				<div>
					<Input
						label='Import URL'
						placeholder='http://example.com/cool_generator.zip'
						oninput={binder.inputString(state.importing, 'url')}
					/>
					<div
						className='btn btn-primary'
						onclick={() => {
							state.importing.loading = true;
							api.importGeneratorUrl(state.importing.url)
								.then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_generators');
								})
								.catch(error)
								.then(() => {
									state.importing.show = false;
									state.importing.loading = false;
								});
						}}
					>
						Import
					</div>
				</div>
			</Modal>
		);
	};

	let modalExport = () => {
		if (!state.export.show) return null;

		return (
			<Modal title='Export' onclose={() => (state.export.show = null)}>
				<div className='mb3'>
					You can export this generator in multiple formats. This will only export the generator itself and no entries in any associated
					data sources!
				</div>
				<div
					className='btn btn-primary mr2'
					onclick={() => {
						if (inElectron) {
							openFolderDialog().then((folder) => {
								api.exportGeneratorZip(state.export.id, folder)
									.then((file) => {
										success('Wrote ' + file);
									})
									.catch((err) => {
										error(err);
									})
									.then(() => (state.export.show = false));
							});
						} else {
							window.open('/api/export/generator/zip/' + state.export.id, '_blank');
							state.export.show = false;
						}
					}}
				>
					Export as{' '}
					<b>
						gen_{state.export.g.author}_{state.export.g.slug}.zip
					</b>
				</div>
				<div
					className='btn btn-primary'
					onclick={() => {
						openFolderDialog().then((folder) => {
							api.exportGeneratorFolder(state.export.id, folder)
								.then((file) => {
									success('Wrote ' + file);
								})
								.catch((err) => {
									error(err);
								})
								.then(() => (state.export.show = false));
						});
					}}
				>
					Export to{' '}
					<b>
						gen_{state.export.g.author}_{state.export.g.slug}
					</b>{' '}
					folder
				</div>
			</Modal>
		);
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
								store.data.generators?.filter((t) => {
									return (
										state.search.length === 0 ||
										t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
										t.author.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
									);
								}),
								'author'
							),
							(val, key) => {
								return (
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
																				<div
																					className='btn btn-primary mr2'
																					onclick={() =>
																						m.route.set(`/generators/gen:${g.author}+${g.slug}/edit`)
																					}
																				>
																					<i className='ion ion-md-settings mr1' /> Edit
																				</div>
																				<div
																					className='btn btn-primary mr2'
																					onclick={() => (state.export = { show: true, g: g, id: id })}
																				>
																					<i className='ion ion-md-open mr1' /> Export
																				</div>
																				<div
																					className='btn btn-error'
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
																					<i className='ion ion-md-close-circle mr1' /> Delete
																				</div>
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
								);
							}
						)}
					</div>
					{modal()}
					{modalExport()}
				</Base>
			);
		},
	};
};
