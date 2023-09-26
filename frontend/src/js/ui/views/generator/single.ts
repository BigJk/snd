import m from 'mithril';

import Generator, { sanitizeConfig } from 'js/types/generator';

import * as API from 'js/core/api';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

import Editor from 'js/ui/components/config/editor';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

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
			});
		},
		onupdate({ attrs }) {},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						items: [
							{ link: '/generator', label: 'Generators' },
							{ label: state.generator ? state.generator.name : m(Loader, { className: '.mh2' }) },
						],
					}),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: m('div.flex', [
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/generator/${attrs.id}/edit`) }, 'Edit'),
					]),
				},
				// @ts-ignore
				m(SidebarPrintPage, {
					generator: state.generator,
					config: state.config,
					tabs: [
						{ icon: 'options', label: 'Config' },
						{ icon: 'clipboard', label: 'Information' },
						{ icon: 'save', label: 'Saved' },
					],
					content: {
						Config: () =>
							m(Editor, {
								current: state.config,
								definition: [
									{
										key: 'seed',
										name: 'Seed',
										description: 'The seed used to generate the template',
										type: 'Seed',
										default: 'TEST_SEED',
									},
									...(state.generator ? state.generator.config : []),
								],
								onChange: (config) => {
									state.config = config;
									m.redraw();
								},
							}),
						Information: () => m('div.ph3.pv2.lh-copy', [m('div.f5.mb2.b', 'Description'), state.generator?.description ?? '']),
						Saved: () => m('div', 'advanced-filter'),
					},
				})
			);
		},
	};
};
