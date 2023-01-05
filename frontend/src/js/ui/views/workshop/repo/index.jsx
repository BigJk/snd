import { capitalize, sortBy, values } from 'lodash-es';

import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import MarkdownItReplaceLink from 'markdown-it-replace-link';

import api from '/js/core/api';
import { dataSourceId, generatorId, templateId } from '/js/core/model-helper';
import store from '/js/core/store';
import { dataSourceById, generatorById, templateById } from '/js/core/store-helper';

import { Base, Header, Input, Select } from '/js/ui/components';

import { dialog, error, success } from '/js/ui/toast';

// Markdown instance with syntax highlighting
let markdown = new MarkdownIt({
	html: true,
	linkify: false,
	replaceLink: function () {
		return location.hash;
	},
	highlight: function (str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return (
					'<pre class="code hljs br1" data-lang="' +
					lang +
					'"><code>' +
					hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
					'</code></pre>'
				);
			} catch (e) {
				console.log(e);
			}
		}

		return '<pre class="code hljs br1" data-lang="' + lang + '"><code>' + markdown.utils.escapeHtml(str) + '</code></pre>';
	},
});
markdown.use(MarkdownItReplaceLink);

export default function () {
	let state = {
		pack: null,
		repo: null,
		loading: [false, false, false],
		selectedAuthor: null,
		selectedRepo: null,
		selectedVersion: null,
		repos: [],
		packages: [],
		filter: {
			type: '',
			search: '',
		},
	};

	let anyLoading = () => state.loading.some((l) => l);

	let breadcrumbs = (vnode) => [
		{
			name: 'Workshop',
			link: '/workshop',
		},
		{
			name: store.data.publicPackages[parseInt(vnode.attrs.id)].name,
		},
	];

	let resetAuthor = () => {
		state.selectedAuthor = null;
		state.selectedRepo = null;
		state.selectedVersion = null;
		state.repos = [];
		state.packages = [];
	};

	let selectAuthor = (i) => {
		if (anyLoading()) return;

		resetAuthor();
		state.selectedAuthor = i;
		state.loading[1] = true;

		Promise.all(state.pack.entries[i].repos.map((repo) => api.getRepo(repo)))
			.then((res) => {
				state.repos = res;
			})
			.catch(error)
			.finally(() => (state.loading[1] = false));
	};

	let openRepo = (rep, i) => {
		if (anyLoading()) return;

		state.selectedRepo = i;
		state.packages = [];

		openRepoVersion(sortBy(values(rep.versions), 'data')[0]);
	};

	let openRepoVersion = (ver) => {
		if (anyLoading()) return;

		state.packages = [];
		state.loading[2] = true;

		state.selectedVersion = ver;
		api
			.getPackages(state.repos[state.selectedRepo].url, state.selectedVersion)
			.then((packages) => {
				state.packages = packages;
			})
			.catch(error)
			.finally(() => (state.loading[2] = false));
	};

	let filteredPackages = () =>
		state.packages.filter((p) => {
			if (state.filter.type.length > 0 && p.type !== state.filter.type) {
				return false;
			}
			if (state.filter.search.length > 0) {
				let name = '';
				switch (p.type) {
					case 'template':
						name = p.template.name;
						break;
					case 'generator':
						name = p.generator.name;
						break;
					case 'data source':
						name = p.dataSource.name;
						break;
				}

				if (name.toLowerCase().indexOf(state.filter.search.toLowerCase()) === -1) {
					return false;
				}
			}
			return true;
		});

	let getIdFromPackage = (p) => {
		switch (p.type) {
			case 'template':
				return templateId(p.template);
			case 'generator':
				return generatorId(p.generator);
			case 'data source':
				return dataSourceId(p.dataSource);
			default:
				return '';
		}
	};

	let selectedRepo = () => {
		let header = (
			<div className='pa2 bg-black-05 bb b--black-10 f5 b flex justify-between'>
				Selected Repo
				{state.loading[2] ? <div className='loading mr2' /> : null}
			</div>
		);

		if (!state.selectedVersion) {
			return header;
		}

		return (
			<div className='flex-grow-1 flex flex-column h-100'>
				{header}
				<div className='pa2 bb b--black-10 flex justify-between items-center flex-shrink-0'>
					<span className='f6'>
						<b>Version:</b> {state.selectedVersion.name}
					</span>
					<Select
						keys={Object.keys(state.repos[state.selectedRepo].versions)}
						oninput={(e) => openRepoVersion(state.repos[state.selectedRepo].versions[e.target.value])}
					/>
				</div>
				{state.repos[state.selectedRepo].readme.length > 0 ? (
					<div className='overflow-auto flex-shrink-0'>
						<div className='bb ph3 b--black-10 overflow-auto'>
							<div style={{ height: '300px' }}>
								{m.trust(markdown.render(state.repos[state.selectedRepo].readme))}
								<div className='pb3' />
							</div>
						</div>
					</div>
				) : null}
				<div className='pa2 bg-black-05 bb b--black-10 f5 b'>Packages</div>
				<div className='pa2 bg-black-05 bb b--black-10 f5 b flex'>
					<Input value={state.filter.search} oninput={(e) => (state.filter.search = e.target.value)} placeholder='Search...' />
					<div className='ml2 w-40'>
						<Select
							selected={state.filter.type}
							keys={['', 'template', 'generator', 'data source']}
							names={['All', 'Template', 'Generator', 'Data Source']}
							oninput={(e) => (state.filter.type = e.target.value)}
							noDefault={true}
						/>
					</div>
					<div
						className='btn btn-primary ml2'
						disabled={state.loading[2]}
						onclick={() => {
							if (state.loading[2]) return;

							state.loading[2] = true;

							let fetching = filteredPackages().map((p) =>
								api.importPackage(state.repos[state.selectedRepo].url, state.selectedVersion, getIdFromPackage(p))
							);

							Promise.all(fetching)
								.then(() => {
									success(`Successfully imported ${fetching.length} packages`);

									store.pub('reload_templates');
									store.pub('reload_generators');
									store.pub('reload_sources');
								})
								.catch(error)
								.finally(() => {
									state.loading[2] = false;
									m.redraw();
								});
						}}
					>
						Import All
					</div>
				</div>
				<div className='flex-grow-1 overflow-auto' style={{ flex: 1 }}>
					{filteredPackages().map((p) => {
						let id = getIdFromPackage(p);
						let data = null;
						let present = false;

						switch (p.type) {
							case 'template':
								data = p.template;
								present = !!templateById(templateId(data));
								break;
							case 'generator':
								data = p.generator;
								present = !!generatorById(generatorId(data));
								break;
							case 'data source':
								data = p.dataSource;
								present = !!dataSourceById(dataSourceId(data));
								break;
							default:
								return null;
						}

						return (
							<div className='pa2 bb b--black-10 flex justify-between items-end lh-copy'>
								<div className='pr3'>
									<div className='f6'>
										{present ? <i className='ion ion-md-checkmark green' /> : null} <b>{capitalize(p.type)}:</b> {data.name}
									</div>
									<div className='text-muted'>{data.description}</div>
								</div>
								<div
									className='btn'
									onclick={() => {
										state.loading[2] = true;

										api
											.importPackage(state.repos[state.selectedRepo].url, state.selectedVersion, id)
											.then(() => {
												success('Import successful');

												// if data sources are referenced try to find them in the same repository.
												if (data.dataSources) {
													let missingSources = data.dataSources.filter(
														(ds) => !store.data.sources.some((ods) => ds.author === ods.author && ds.slug === ods.author)
													);

													if (missingSources.length > 0) {
														dialog(`There are ${missingSources.length} missing Data Sources. Try fetching them?`).then(() => {
															state.loading[2] = true;
															m.redraw();

															let found = missingSources
																.map((missing) => {
																	let foundDs = state.packages.find(
																		(pack) => pack.type === 'data source' && dataSourceId(pack.dataSource) === missing
																	);

																	if (foundDs) {
																		return dataSourceId(foundDs.dataSource);
																	}

																	return null;
																})
																.filter((ds) => ds !== null)
																.map((id) => api.importPackage(state.repos[state.selectedRepo].url, state.selectedVersion, id));

															if (found.length === 0) {
																error('could not find the missing Data Sources.');
																return;
															}

															Promise.all(found)
																.then(() => {
																	if (found.length === missingSources.length) {
																		success('Found and imported all Data Sources');
																	} else {
																		success(`Imported ${found.length} related Data Sources. ${missingSources.length - found.length} missing!`);
																	}

																	store.pub('reload_sources');

																	m.redraw();
																})
																.catch(error)
																.finally(() => (state.loading[2] = false));
														});
													}
												}

												switch (p.type) {
													case 'template':
														store.pub('reload_templates');
														break;
													case 'generator':
														store.pub('reload_generators');
														break;
													case 'data source':
														store.pub('reload_sources');
														break;
												}

												m.redraw();
											})
											.catch(error)
											.finally(() => (state.loading[2] = false));
									}}
								>
									{present ? 'Re-Import' : 'Import'}
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
			state.pack = store.data.publicPackages[parseInt(vnode.attrs.id)];
		},
		view(vnode) {
			return (
				<Base active='workshop'>
					<div className='h-100 flex flex-column overflow-auto'>
						<Header breadcrumbs={breadcrumbs(vnode)} subtitle='Browse and download community made content.' />
						<div className='ph3 pb3 flex-grow-1 overflow-auto'>
							<div className='bg-white b--black-10 ba br1 h-100 flex'>
								<div className='flex-shrink-0 br b--black-10 overflow-auto' style={{ width: '300px' }}>
									<div className='pa2 bg-black-05 bb b--black-10 f5 b flex justify-between'>
										Authors
										{state.loading[0] ? <div className='loading mr2' /> : null}
									</div>
									<div className='overflow-auto'>
										{state.pack.entries.map((p, i) => (
											<div className={`pointer hover-bg-black-05 ${i === state.selectedAuthor ? 'bg-black-05' : ''}`} onclick={() => selectAuthor(i)}>
												<div className='pa2 lh-copy bb br1 b--black-10 flex justify-between'>
													<div>
														<div className='f5 b'>{p.author}</div>
													</div>
													<div>
														<i className='ion ion-md-briefcase f4' />
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
								<div className='flex-shrink-0 h-100 flex flex-column overflow-auto br b--black-10' style={{ width: '350px' }}>
									<div className='pa2 bg-black-05 bb b--black-10 f5 b flex justify-between'>
										Selected Author
										{state.loading[1] ? <div className='loading mr2' /> : null}
									</div>
									{state.selectedAuthor !== null ? (
										<div className='pa2 bb b--black-10 lh-copy'>
											<div className='b'>Contact Info</div>
											<span>{state.pack.entries[state.selectedAuthor].contact}</span>
										</div>
									) : null}
									{state.repos.length > 0
										? [
												<div className='pa2 bg-black-05 bb b--black-10 f5 b flex justify-between'>Repos</div>,
												<div className='overflow-auto' style={{ flex: 1 }}>
													{state.repos.map((rep, j) => (
														<div
															className={`pointer pa2 bb b--black-10 hover-bg-black-05 ${j === state.selectedRepo ? 'bg-black-05' : ''}`}
															onclick={() => openRepo(rep, j)}
														>
															<div className='b mb1'>{rep.url}</div>
															<span className='text-muted'>{Object.keys(rep.versions).length} Versions</span>
														</div>
													))}
												</div>,
										  ]
										: null}
								</div>
								<div className='flex-grow-1 overflow-auto'>{selectedRepo()}</div>
							</div>
						</div>
					</div>
				</Base>
			);
		},
	};
}
