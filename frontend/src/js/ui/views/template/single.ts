import m from 'mithril';

import { debounce } from 'lodash-es';

import Entry from 'js/types/entry';
import Template from 'js/types/template';

import * as API from 'js/core/api';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import Button from 'js/ui/spectre/button';
import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import PrintPreviewTemplate from 'js/ui/components/print-preview-template';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

const PER_PAGE = 10;

type SingleTemplateProps = {
	id: string;
};

type SingleTemplateState = {
	template: Template | null;
	entries: Entry[];
	selectedEntry: Entry | null;
	tab: 'entries' | 'config' | 'advanced-filter';
	renderCache: Record<string, string>;
	page: number;
};

export default (): m.Component<SingleTemplateProps> => {
	let state: SingleTemplateState = {
		template: null,
		entries: [],
		selectedEntry: null,
		tab: 'entries',
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

	const leftElement = (icon: string, label: string, active: boolean, onClick: () => void) => {
		return m(Tooltip, { content: label, placement: 'right' }, [m(Icon, { icon, size: 5, onClick, className: active ? '.text-primary' : '' })]);
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
						m(`div${state.renderCache[entry.id] ? '.mt2' : ''}`, m.trust(state.renderCache[entry.id] ?? '')),
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

	const tabContent = () => {
		switch (state.tab) {
			case 'entries':
				return getPage(state.page).map(entryElement);
			case 'config':
				return m('div', 'config');
			case 'advanced-filter':
				return m('div', 'advanced-filter');
		}
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
					rightElement: [
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/template/${attrs.id}/edit`) }, 'Edit'),
					],
				},
				m(Flex, { className: '.flex-gap-3.h-100' }, [
					m(
						'div.flex-shrink-0',
						m(Flex, { direction: 'column', className: '.pa2.bg-white.ba.b--black-10.br2.flex-gap-3' }, [
							leftElement('filing', 'Entries', state.tab === 'entries', () => (state.tab = 'entries')),
							leftElement('options', 'Config', state.tab === 'config', () => (state.tab = 'config')),
							leftElement('search', 'Advanced Filter', state.tab === 'advanced-filter', () => (state.tab = 'advanced-filter')),
						])
					), //
					m(Flex, { className: '.bg-white.ba.b--black-10.br2.flex-grow-1.overflow-auto', direction: 'column' }, tabContent()),
					state.template
						? m(PrintPreviewTemplate, {
								template: state.template,
								it: state.selectedEntry ? state.selectedEntry.data : null,
								width: 380,
								className: '.bg-black-05.ph1.ba.b--black-10',
						  })
						: m('div'),
				])
			);
		},
	};
};
