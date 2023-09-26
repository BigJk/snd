import m from 'mithril';

import { debounce } from 'lodash-es';

import Entry from 'js/types/entry';
import Template from 'js/types/template';

import * as API from 'js/core/api';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import Button from 'js/ui/spectre/button';
import IconButton from 'js/ui/spectre/icon-button';
import Input from 'js/ui/spectre/input';
import Loader from 'js/ui/spectre/loader';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

const PER_PAGE = 10;

type SingleTemplateProps = {
	id: string;
};

type SingleTemplateState = {
	template: Template | null;
	entries: Entry[];
	selectedEntry: Entry | null;
	renderCache: Record<string, string>;
	page: number;
};

export default (): m.Component<SingleTemplateProps> => {
	let state: SingleTemplateState = {
		template: null,
		entries: [],
		selectedEntry: null,
		renderCache: {},
		page: 0,
	};

	/**
	 * Generates print templates for the given entries and caches them.
	 */
	const ensureRenderCache = debounce((entries: Entry[]) => {
		Promise.all(
			entries.map((e) =>
				render(
					state.template?.listTemplate!,
					{
						it: e.data,
						config: {},
						settings: settings.value,
						images: {}, // don't need images for list template
					},
					false
				)
			)
		).then((rendered) => {
			let needsUpdate = false;
			rendered.forEach((r, i) => {
				if (state.renderCache[entries[i].id] === r) return;
				state.renderCache[entries[i].id] = r;
				needsUpdate = true;
			});
			if (needsUpdate) m.redraw();
		});
	}, 500);

	/**
	 * Gets the entries for the current page.
	 */
	const getPage = (page: number) => {
		return state.entries.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
	};

	const maxPage = () => {
		return Math.floor(state.entries.length / PER_PAGE);
	};

	const nextPage = () => {
		if (state.page === Math.floor(state.entries.length / PER_PAGE)) return;
		state.page++;
		ensureRenderCache(getPage(state.page));
	};

	const prevPage = () => {
		if (state.page === 0) return;
		state.page--;
		ensureRenderCache(getPage(state.page));
	};

	const entryElement = (entry: Entry) => {
		const selected = state.selectedEntry && entry.id === state.selectedEntry.id;
		return m(
			`div${selected ? '.bl.bw2.b--col-primary.bg-primary-muted' : ''}`,
			m(
				Flex,
				{
					justify: 'between',
					className: `.pa2.bb.b--black-10.pointer${!selected ? '.hover-bg-primary-muted' : ''}`,
					onclick: () => (state.selectedEntry = entry),
				},
				[
					m(`div`, {}, [
						m('div.f8.text-muted', entry.id), //
						m('div.f6.fw5', entry.name),
						m(
							`div${state.renderCache[entry.id] ? '.mt2' : ''}`,
							state.renderCache[entry.id] !== undefined ? m.trust(state.renderCache[entry.id]) : m('div.dib.pl2.mt2', m(Loader))
						),
					]),
					selected
						? m('div', [
								m(Tooltip, { content: 'Screenshot' }, m(Button, { intend: 'primary', size: 'sm', className: '.mr2' }, m(Icon, { icon: 'camera' }))), //
								m(Tooltip, { content: 'Print' }, m(Button, { intend: 'primary', size: 'sm' }, m(Icon, { icon: 'print' }))),
						  ])
						: null,
				]
			)
		);
	};

	return {
		oninit({ attrs }) {
			API.exec<Template>(API.GET_TEMPLATE, attrs.id).then((template) => {
				state.template = template;

				API.exec<Entry[]>(API.GET_ENTRIES_WITH_SOURCES, attrs.id).then((entries) => {
					state.entries = entries;
				});
			});

			ensureRenderCache(getPage(state.page));
		},
		onupdate({ attrs }) {
			ensureRenderCache(getPage(state.page));
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [{ link: '/template', label: 'Templates' }, { label: state.template ? state.template.name : m(Loader, { className: '.mh2' }) }],
					}),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m('div.flex', [
						m(
							IconButton,
							{ icon: 'add', size: 'sm', intend: 'success', className: '.mr2', onClick: () => m.route.set(`/template/${attrs.id}/create`) },
							'New Entry'
						),
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/template/${attrs.id}/edit`) }, 'Edit'),
					]),
				},
				// @ts-ignore
				m(SidebarPrintPage, {
					template: state.template,
					it: state.selectedEntry?.data,
					tabs: [
						{ icon: 'filing', label: 'Entries' },
						{ icon: 'clipboard', label: 'Information' },
						{ icon: 'options', label: 'Config' },
						{ icon: 'search', label: 'Advanced Filter' },
					],
					content: {
						Entries: () =>
							m(Flex, { direction: 'column', className: '.overflow-auto.h-100' }, [
								m(Flex, { direction: 'column', className: '.flex-grow-1.overflow-auto.h-100' }, getPage(state.page).map(entryElement)), //
								m(
									'div.flex-shrink-0.pa3.bt.b--black-10',
									m(Flex, { justify: 'between' }, [
										m('div.w5', m(Input, { placeholder: 'Search...' })), //
										m(Flex, { items: 'center' }, [
											m(Button, { onClick: prevPage }, m(Icon, { icon: 'arrow-round-back' })), //
											m('div.w3.tc', `${state.page + 1} / ${maxPage() + 1}`),
											m(Button, { onClick: nextPage }, m(Icon, { icon: 'arrow-round-forward' })),
										]),
									])
								),
							]),
						Information: () => m('div.ph3.pv2.lh-copy', [m('div.f5.mb2.b', 'Description'), state.template?.description ?? '']),
						Config: () => m('div', 'config'),
						'Advanced Filter': () => m('div', 'advanced-filter'),
					},
				})
			);
		},
	};
};
