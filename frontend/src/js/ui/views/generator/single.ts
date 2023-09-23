import m from 'mithril';

import { debounce } from 'lodash-es';

import Entry from 'js/types/entry';
import Generator, { sanitizeConfig } from 'js/types/generator';
import Template from 'js/types/template';

import * as API from 'js/core/api';
import { settings } from 'js/core/store';
import { render } from 'js/core/templating';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

const PER_PAGE = 10;

type SingleGeneratorProps = {
	id: string;
};

type SingleGeneratorState = {
	generator: Generator | null;
	config: any;
};

export default (): m.Component<SingleGeneratorProps> => {
	let state: SingleGeneratorState = {
		generator: null,
		config: {},
	};

	return {
		oninit({ attrs }) {
			API.exec<Generator>(API.GET_GENERATOR, attrs.id).then((generator) => {
				state.generator = generator;
				state.config = sanitizeConfig(generator, {});
				console.log(state);
			});
		},
		onupdate({ attrs }) {},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [{ link: '/template', label: 'Templates' }, { label: state.generator ? state.generator.name : m(Loader, { className: '.mh2' }) }],
					}),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m('div.flex', [
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/generator/${attrs.id}/edit`) }, 'Edit'),
					]),
				},
				m(SidebarPrintPage, {
					generator: state.generator,
					config: state.config,
					tabs: [
						{ icon: 'filing', label: 'Entries' },
						{ icon: 'options', label: 'Config' },
						{ icon: 'search', label: 'Advanced Filter' },
					],
					content: {
						Entries: () => m(Flex, { direction: 'column', className: '.overflow-auto.h-100' }, 'test'),
						Config: () => m('div', 'config'),
						'Advanced Filter': () => m('div', 'advanced-filter'),
					},
				})
			);
		},
	};
};
