import { groupBy, map } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import store from '/js/core/store';
import { render } from '/js/core/templating';

import { Base, Header, Input, Loading, ModalImport, Preview, Tooltip } from '/js/ui/components';

import binder from '/js/ui/binder';
import { error, success } from '/js/ui/toast';

export default () => {
	let state = {
		search: '',
		templates: {},
		importing: {
			show: false,
			loading: false,
			url: '',
		},
	};

	let onimport = (type, url) => {
		switch (type) {
			case 'zip':
				{
					if (inElectron) {
						openFileDialog().then((file) => {
							state.importing.loading = true;
							api.importTemplateZip(file)
								.then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_templates');
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
							api.importTemplateZip(res)
								.then((name) => {
									success(`Imported '${name}' successful`);

									store.pub('reload_templates');
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
						api.importTemplateFolder(folder)
							.then((name) => {
								success(`Imported '${name}' successful`);

								store.pub('reload_templates');
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
					api.importTemplateUrl(url)
						.then((name) => {
							success(`Imported '${name}' successful`);

							store.pub('reload_templates');
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

	let body = () => {
		if (!store.there('templates')) {
			return <Loading />;
		}

		return (
			<div className='ph3 pb3'>
				{map(
					groupBy(
						store.data.templates?.filter((t) => {
							return (
								state.search.length === 0 ||
								t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
								t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
							);
						}),
						'author'
					),
					(val, key) => {
						return (
							<div className='w-100 mb3'>
								<div className='mb2 f5'>
									Templates by <b>{key}</b>
								</div>
								<div className='flex flex-wrap'>
									{val.map((t, i) => {
										return (
											<div className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}>
												<div className='flex ba b--black-10 h4 mb2 bg-white'>
													<div className='flex-shrink-0 ph1 mr2 br b--black-05 bg-black-05'>
														<Preview
															className='h-100'
															content={state.templates['tmpl:' + t.author + '+' + t.name] ?? 'Rendering...'}
															stylesheets={store.data.settings.stylesheets}
															width={150}
															scale={150 / store.data.settings.printerWidth}
														/>
													</div>
													<div className='flex-grow-1 pv2 pr2 lh-solid flex flex-column justify-between'>
														<div>
															<div className='f5 mb2 flex justify-between items-center'>
																{t.name}

																<span className='f8 fw4 text-muted'>
																	{t.author}/{t.slug}
																</span>
															</div>
															<div className='divider' />
															<div className='fw4 f7 black-50 mb1 lh-copy'>{t.description}</div>
														</div>
														<div className='flex justify-between items-end'>
															<div className='lh-solid'>
																<div className='f4 b'>{t.count}</div>
																<span className='fw4 f6 black-50'>Entries</span>
															</div>
															<div className='btn' onclick={() => m.route.set(`/templates/tmpl:${t.author}+${t.slug}`)}>
																Open Template
															</div>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					}
				)}
			</div>
		);
	};

	let updater = null;

	let updateTemplates = () => {
		Promise.all(
			store.data.templates.map((t) => {
				return new Promise((resolve) => {
					let id = 'tmpl:' + t.author + '+' + t.name;
					render(t.printTemplate, { it: t.skeletonData, images: t.images })
						.then((res) => {
							resolve({
								id,
								template: res,
							});
						})
						.catch((err) => {
							resolve({
								id,
								template: 'Template Error',
							});
						});
				});
			})
		).then((res) => {
			state.templates = {};
			res.forEach((res) => {
				state.templates[res.id] = res.template;
			});
		});
	};

	return {
		oninit() {
			store.pub('reload_templates');
			updater = setInterval(() => {
				store.pub('reload_templates');
			}, 5000);

			updateTemplates();
		},
		onremove() {
			clearInterval(updater);
		},
		onupdate(vnode) {
			updateTemplates();
		},
		view(vnode) {
			return (
				<Base active={'templates'}>
					<div className='w-100 h-100'>
						<Header title='Templates' subtitle='List all awesome Templates' classes='pt2'>
							<div className='btn btn-success mr2' onclick={() => m.route.set('/templates/new')}>
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
						{body()}
						<ModalImport
							type={'template'}
							show={state.importing.show}
							loading={state.importing.loading}
							onimport={onimport}
							onclose={() => {
								state.importing.show = false;
								state.importing.loading = false;
							}}
						></ModalImport>
					</div>
				</Base>
			);
		},
	};
};
