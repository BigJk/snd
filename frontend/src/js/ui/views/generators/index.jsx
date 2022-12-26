import { groupBy, map, pickBy } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import { render } from '/js/core/generator';
import store from '/js/core/store';

import { Header, Input, ModalImport, PreviewBox, Tooltip } from '/js/ui/components';
import Base from '/js/ui/components/base';

import binder from '/js/ui/binder';
import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		importing: {
			show: false,
			loading: false,
		},
		configs: {},
		rendered: {},
		entries: {},
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
		state.configs[id] = pickBy(state.configs[id], (val, key) => key === 'seed' || g.config.some((conf) => conf.key === key));
	};

	let rerender = (g) => {
		let id = `gen:${g.author}+${g.slug}`;

		return render(g, state.entries[id], state.configs[id])
			.then((res) => {
				state.rendered[id] = res;
			})
			.catch((err) => {
				state.rendered[id] = `Error: ${err}`;
			});
	};

	let onimport = (type, url) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api
								.importGeneratorZip(file)
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
							api
								.importGeneratorZip(res)
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
						api
							.importGeneratorFolder(folder)
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
					api
						.importGeneratorUrl(url)
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
					<div className='ph3 flex flex-wrap'>
						{map(
							groupBy(
								store.data.generators?.filter(
									(t) =>
										state.search.length === 0 ||
										t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
										t.author.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
								),
								'author'
							),
							(val, key) => (
								<div className='w-100 mb3'>
									<div className='mb2 f5'>
										Generators by <b>{key}</b>
									</div>
									<div className='flex flex-wrap'>
										{val.map((g, i) => {
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

											if (state.entries[id] === undefined) {
												api.getEntriesWithSources(`gen:${g.author}+${g.slug}`).then((entries) => {
													state.entries[id] = entries ?? [];
												});
											}

											return (
												<PreviewBox
													className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}
													value={g}
													previewContent={state.rendered[id]}
													loading={state.rendered[id] === undefined}
													bottomRight={
														<div className='btn' onclick={() => m.route.set(`/generators/gen:${g.author}+${g.slug}`)}>
															Open Template
														</div>
													}
												/>
											);
										})}
									</div>
								</div>
							)
						)}
					</div>
					<ModalImport
						type='generator'
						show={state.importing.show}
						loading={state.importing.loading}
						onimport={onimport}
						onclose={() => {
							state.importing.show = false;
							state.importing.loading = false;
						}}
						types={['base']}
					/>
				</Base>
			);
		},
	};
};
