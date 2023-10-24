import m from 'mithril';

import Generator, { sanitizeConfig } from 'js/types/generator';

import * as API from 'js/core/api';

import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';
import Editor from 'js/ui/components/config/editor';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';
import Tooltip from 'js/ui/components/atomic/tooltip';
import { dialogWarning, success, error } from 'js/ui/toast';
import { buildId } from 'js/types/basic-info';

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

	const print = () => {
		// TODO: implement
	};

	const showExport = () => {
		// TODO: implement
	};

	const showAdditionalInfo = () => {
		// TODO: implement
	};

	const deleteGenerator = () => {
		if (!state.generator) return;

		dialogWarning('Are you sure you want to delete this generator?').then(() => {
			if (!state.generator) return;
			API.exec<void>(API.DELETE_TEMPLATE, buildId('generator', state.generator))
				.then(() => {
					success('Deleted generator');
					m.route.set('/generator');
				})
				.catch(error);
		});
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
						m('div.divider-vert'),
						m(
							Tooltip,
							{ content: 'Export' },
							m(IconButton, { icon: 'download', size: 'sm', intend: 'primary', className: '.mr2', onClick: showExport }),
						),
						m(
							Tooltip,
							{ content: 'Additional Information' },
							m(IconButton, { icon: 'information-circle-outline', size: 'sm', intend: 'primary', className: '.mr2', onClick: showAdditionalInfo }),
						),
						m(Tooltip, { content: 'Delete' }, m(IconButton, { icon: 'trash', size: 'sm', intend: 'error', onClick: deleteGenerator })),
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
						Saved: () => m('div.ph3.pv2', 'coming soon...'),
					},
				}),
			);
		},
	};
};
