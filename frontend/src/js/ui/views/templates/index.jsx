import { groupBy, map } from 'lodash-es';

import { inElectron, openFileDialog, openFolderDialog } from '/js/electron';
import { readFile } from '/js/file';

import api from '/js/core/api';
import store from '/js/core/store';
import { render } from '/js/core/templating';

import { Base, Header, Input, Loading, ModalImport, PreviewBox, Tooltip } from '/js/ui/components';

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
							api
								.importTemplateZip(file)
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
							api
								.importTemplateZip(res)
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
						api
							.importTemplateFolder(folder)
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
					api
						.importTemplateUrl(url)
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
						store.data.templates?.filter(
							(t) =>
								state.search.length === 0 ||
								t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0 ||
								t.name.toLowerCase().indexOf(state.search.toLowerCase()) >= 0
						),
						'author'
					),
					(val, key) => (
						<div className='w-100 mb3'>
							<div className='mb2 f5'>
								Templates by <b>{key}</b>
							</div>
							<div className='flex flex-wrap'>
								{val.map((t, i) => (
									<PreviewBox
										className={`w-50 ${(i & 1) === 0 ? 'pr2' : ''}`}
										value={t}
										previewContent={state.templates['tmpl:' + t.author + '+' + t.name] ?? 'Rendering...'}
										bottomLeft={
											<div className='lh-solid'>
												<div className='f4 b'>{t.count}</div>
												<span className='fw4 f6 black-50'>Entries</span>
											</div>
										}
										bottomRight={
											<div className='btn' onclick={() => m.route.set(`/templates/tmpl:${t.author}+${t.slug}`)}>
												Open Template
											</div>
										}
										loading={state.templates['tmpl:' + t.author + '+' + t.name] === undefined}
									/>
								))}
							</div>
						</div>
					)
				)}
			</div>
		);
	};

	let updater = null;

	let updateTemplates = () => {
		Promise.all(
			store.data.templates.map(
				(t) =>
					new Promise((resolve) => {
						let id = 'tmpl:' + t.author + '+' + t.name;
						render(t.printTemplate, { it: t.skeletonData, images: t.images })
							.then((res) => {
								resolve({
									id,
									template: res,
								});
							})
							.catch(() => {
								resolve({
									id,
									template: 'Template Error',
								});
							});
					})
			)
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
				<Base active='templates'>
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
							type='template'
							show={state.importing.show}
							loading={state.importing.loading}
							onimport={onimport}
							onclose={() => {
								state.importing.show = false;
								state.importing.loading = false;
							}}
						/>
					</div>
				</Base>
			);
		},
	};
};
