import m from 'mithril';
import { startCase } from 'lodash-es';

import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import MarkdownItReplaceLink from 'markdown-it-replace-link';

import { buildId } from 'js/types/basic-info';
import DataSource from 'js/types/data-source';
import Generator from 'js/types/generator';
import Template from 'js/types/template';
import { Package, Repo } from 'src/js/types/public-list';
import * as API from 'js/core/api';
import store from 'js/core/store';

import IconButton from 'js/ui/spectre/icon-button';
import Input from 'js/ui/spectre/input';
import Loader from 'js/ui/spectre/loader';
import Select from 'js/ui/spectre/select';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import { error, success } from 'js/ui/toast';

// @ts-ignore
const markdown = new MarkdownIt({
	html: true,
	linkify: false,
	// Disable links
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

type WorkshopRepoProps = {
	id: string;
	repo: string;
};

type WorkshopRepoState = {
	repo: Repo | null;
	packages: Package[];
	selectedVersion: string;
	search: string;
	selectedType: string | null;
	loading: boolean;
	inDownload: boolean;
};

export default (): m.Component<WorkshopRepoProps> => {
	const state: WorkshopRepoState = {
		repo: null,
		packages: [],
		selectedVersion: 'main',
		search: '',
		selectedType: null,
		loading: false,
		inDownload: false,
	};

	const fetchRepo = (url: string) => {
		API.exec<Repo>(API.GET_REPO, url)
			.then((repo) => {
				state.repo = repo;

				// Select the first version if the current one doesn't exist
				if (!state.repo.versions[state.selectedVersion]) {
					state.selectedVersion = Object.keys(state.repo.versions)[0];
				}

				fetchPackages(url);
			})
			.catch(error);
	};

	const fetchPackages = (url: string) => {
		state.loading = true;
		m.redraw();

		API.exec<Package[]>(API.GET_PACKAGES, url, state.repo?.versions[state.selectedVersion])
			.then((packages) => {
				state.packages = packages;
			})
			.catch(error)
			.finally(() => {
				state.loading = false;
				m.redraw();
			});
	};

	const download = (url: string, p: Package) => {
		if (state.inDownload) return;
		state.inDownload = true;

		API.exec<void>(
			API.IMPORT_PACKAGE,
			url,
			state.repo?.versions[state.selectedVersion],
			buildId(({ 'data source': 'source' }[p.type] ?? p.type) as 'source' | 'template' | 'generator', {
				name: getName(p),
				slug: getSlug(p),
				description: '',
				author: p.author,
				version: p.version,
			}),
		)
			.then(() =>
				store.actions.loadAll(true).then(() => {
					success(`Successfully imported '${getName(p)}'`);
				}),
			)
			.catch(error)
			.finally(() => {
				state.inDownload = false;
				m.redraw();
			});
	};

	/**
	 * Checks if a package already exists in the store
	 * @param p The package to check
	 */
	const exists = (p: Package) => {
		switch (p.type) {
			case 'data source':
				return !!store.value.sources.find((ds: DataSource) => ds.name === p.dataSource!.name && ds.slug === p.dataSource!.slug);
			case 'generator':
				return !!store.value.generators.find((g: Generator) => g.name === p.generator!.name && g.slug === p.generator!.slug);
			case 'template':
				return !!store.value.templates.find((t: Template) => t.name === p.template!.name && t.slug === p.template!.slug);
		}
		return false;
	};

	/**
	 * Gets the name of a package
	 * @param p The package to get the name of
	 */
	const getName = (p: Package) => {
		switch (p.type) {
			case 'data source':
				return p.dataSource!.name;
			case 'generator':
				return p.generator!.name;
			case 'template':
				return p.template!.name;
			default:
				return 'Unknown';
		}
	};

	/**
	 * Gets the slug of a package
	 * @param p The package to get the slug of
	 */
	const getSlug = (p: Package) => {
		switch (p.type) {
			case 'data source':
				return p.dataSource!.slug;
			case 'generator':
				return p.generator!.slug;
			case 'template':
				return p.template!.slug;
			default:
				return 'Unknown';
		}
	};

	/**
	 * Gets the description of a package
	 * @param p The package to get the description of
	 */
	const getDescription = (p: Package) => {
		switch (p.type) {
			case 'data source':
				return p.dataSource!.description;
			case 'generator':
				return p.generator!.description;
			case 'template':
				return p.template!.description;
			default:
				return 'Unknown';
		}
	};

	const leftSide = (attrs: WorkshopRepoProps) => {
		if (!state.repo) return null;

		return m(Flex, { direction: 'column', gap: 2, className: '.w-50.flex-shrink-0' }, [
			m(Flex, { items: 'center', className: '.br2.ba.b--black-10.ph3.bg-white.h3.flex-shrink-0' }, [
				m(
					HorizontalProperty,
					{
						label: 'Version',
						description: 'The currently selected version of this repo.',
						centered: true,
					},
					m(Select, {
						keys: Object.keys(state.repo.versions),
						selected: state.selectedVersion,
						onInput: (e) => {
							state.selectedVersion = e.target.value;
							fetchPackages(atob(attrs.repo));
						},
					}),
				),
			]),
			m('div.br2.flex-grow-1.overflow-auto.ba.b--black-10.ph3.bg-white', m.trust(markdown.render(state.repo.readme))),
		]);
	};

	const rightSide = (attrs: WorkshopRepoProps) =>
		m(Flex, { direction: 'column', gap: 2, className: '.w-50.flex-shrink-0' }, [
			m(Flex, { items: 'center', justify: 'between', gap: 2, className: '.br2.ba.b--black-10.ph3.bg-white.h3.flex-shrink-0' }, [
				m(
					'div.flex-grow-1',
					{ style: { marginTop: '5px' } },
					m(Input, {
						placeholder: 'Search...',
						icon: 'search',
						className: '.w-100',
						value: state.search,
						onChange: (search) => (state.search = search),
					}),
				), //
				m(Select, {
					className: '.w-40',
					keys: ['data source', 'template', 'generator'],
					names: ['Data Sources', 'Templates', 'Generators'],
					selected: state.selectedType,
					onInput: (e) => (state.selectedType = e.value),
				}),
			]),
			m(
				'div.br2.ba.b--black-10.overflow-auto.flex-grow-1.h-100.ph3.bg-white',
				state.loading
					? m(Flex, { justify: 'center', items: 'center', className: '.h-100' }, m(Loader, { big: true }))
					: state.packages
							.filter((p) => {
								if (state.selectedType && p.type !== state.selectedType) {
									return false;
								}
								if (
									state.search &&
									!getName(p).toLowerCase().includes(state.search.toLowerCase()) &&
									!getDescription(p).toLowerCase().includes(state.search.toLowerCase())
								) {
									return false;
								}
								return true;
							})
							.map((p) =>
								m(
									HorizontalProperty,
									{
										label: `${startCase(p.type)}: ${getName(p)}`,
										description: getDescription(p) ?? 'No description available...',
										bottomBorder: true,
										fullSize: true,
									},
									m(
										IconButton,
										{
											intend: exists(p) ? 'success' : 'primary',
											icon: 'download',
											disabled: state.inDownload,
											loading: state.inDownload,
											onClick: () => download(atob(attrs.repo), p),
										},
										exists(p) ? 'Re-Download' : 'Download',
									),
								),
							),
			),
		]);

	return {
		oncreate({ attrs }) {
			fetchRepo(atob(attrs.repo));
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [{ link: '/workshop', label: 'Workshop' }, { link: `/workshop/${attrs.id}`, label: atob(attrs.id) }, { label: atob(attrs.repo) }],
					}),
					active: 'workshop',
					classNameContainer: '.pa3',
				},
				m(
					'div.h-100',
					!state.repo
						? m(Flex, { items: 'center', justify: 'center', className: '.h-100' }, m(Loader, { big: true }))
						: m(Flex, { gap: 2, className: '.h-100' }, [leftSide(attrs), rightSide(attrs)]),
				),
			);
		},
	};
};
