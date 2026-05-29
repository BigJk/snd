import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Generator, { sanitizeConfig, seed } from 'js/types/generator';
import * as API from 'js/core/api';
import { createOnMessage } from 'js/core/generator-ipc';
import store from 'js/core/store';

import Checkbox from 'js/ui/shoelace/checkbox';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Loader from 'js/ui/shoelace/loader';

import Tooltip from 'js/ui/components/atomic/tooltip';
import Editor from 'js/ui/components/config/editor';
import Flex from 'js/ui/components/layout/flex';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPage from 'js/ui/components/view-layout/sidebar-page';

import {
	deleteSavedConfigAction,
	loadSavedConfigAction,
	loadSavedConfigs,
	printAction,
	renderInformationTab,
	renderSavedTab,
	saveConfigAction,
	screenshotAction,
	showAdditionalInfoAction,
	showExportAction,
	type SavedConfigsState,
} from 'js/ui/views/shared/entity-single-helpers';

import { dialogWarning, error, success } from 'js/ui/toast';

type SingleGeneratorProps = {
	id: string;
};

type SingleGeneratorState = SavedConfigsState & {
	generator: Generator | null;
	config: any;
	printCount: number;
	lastRendered: string;
	hidePreview: boolean;
};

export default (): m.Component<SingleGeneratorProps> => {
	let state: SingleGeneratorState = {
		generator: null,
		config: {},
		printCount: 1,
		lastRendered: '',
		hidePreview: false,
		savedConfigs: {},
	};

	const deleteGenerator = () => {
		if (!state.generator) return;
		dialogWarning('Are you sure you want to delete this generator?').then(() => {
			if (!state.generator) return;
			API.exec<void>(API.DELETE_TEMPLATE, buildId('generator', state.generator))
				.then(() => {
					success('Deleted generator');
					store.actions.loadGenerators().catch(error);
					m.route.set('/generator');
				})
				.catch(error);
		});
	};

	const buttonBar = () =>
		m(Flex, { className: '.bt.b--black-10.pv2.ph3', justify: 'between', items: 'center', gap: 2 }, [
			m(Flex, { gap: 2 }, [
				m(
					IconButton,
					{
						icon: 'save',
						intend: 'primary',
						onClick: () =>
							saveConfigAction(
								'generator',
								() => state.generator,
								() => state.config,
								state,
							),
					},
					'Save Config',
				),
				m(
					IconButton,
					{ icon: 'camera', intend: 'primary', onClick: () => screenshotAction(() => state.lastRendered, state.config['seed'] ?? 'screenshot') },
					'Screenshot',
				),
			]),
			m(Flex, { gap: 2, items: 'center' }, [
				m(Tooltip, { content: 'Hide Preview' }, m(Checkbox, { checked: state.hidePreview, onChange: (val) => (state.hidePreview = val) })),
				m(IconButton, { icon: 'print', intend: 'success', onClick: () => printAction(() => state.lastRendered) }, 'Print'),
			]),
		]);

	return {
		oninit({ attrs }) {
			API.exec<Generator>(API.GET_GENERATOR, attrs.id).then((generator) => {
				state.generator = generator;
				state.config = sanitizeConfig(generator, {});
			});
			loadSavedConfigs(attrs.id, state);
		},
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
					active: 'generators',
					classNameContainer: '.pa3',
					rightElement: m('div.flex', [
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/generator/${attrs.id}/edit`) }, 'Edit'),
						m(DividerVert),
						m(
							Tooltip,
							{ content: 'Export' },
							m(IconButton, {
								icon: 'download',
								size: 'sm',
								intend: 'primary',
								className: '.mr2',
								onClick: () => state.generator && showExportAction('generator', state.generator, API.EXPORT_GENERATOR, 'Export Generator'),
							}),
						),
						m(
							Tooltip,
							{ content: 'Additional Information' },
							m(IconButton, {
								icon: 'information-circle-outline',
								size: 'sm',
								intend: 'primary',
								className: '.mr2',
								onClick: () => state.generator && showAdditionalInfoAction('generator', state.generator, state.config),
							}),
						),
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(IconButton, {
								intend: 'primary',
								icon: 'bug',
								size: 'sm',
								className: '.mr2',
								onClick: () => openDevTools(document.body),
							}),
						),
						m(
							Tooltip,
							{ content: 'Duplicate' },
							m(IconButton, {
								icon: 'copy',
								size: 'sm',
								intend: 'primary',
								className: '.mr2',
								onClick: () => m.route.set(`/generator/create/${buildId('generator', state.generator!)}`),
							}),
						),
						m(Tooltip, { content: 'Delete' }, m(IconButton, { icon: 'trash', size: 'sm', intend: 'error', onClick: deleteGenerator })),
					]),
				},
				// @ts-ignore
				m(SidebarPage, {
					generator: state.generator,
					config: state.config,
					onRendered: (html) => (state.lastRendered = html),
					onMessage: createOnMessage(state.generator, state),
					hidePreview: state.hidePreview,
					tabs: [
						{ icon: 'options', label: 'Config' },
						{ icon: 'clipboard', label: 'Information' },
						{ icon: 'save', label: 'Saved' },
					],
					content: {
						Config: () =>
							m(Flex, { className: '.h-100', direction: 'column' }, [
								m(Editor, {
									className: '.flex-grow-1.overflow-auto.h-100',
									current: state.config,
									definition: [
										{
											key: 'seed',
											name: 'Seed',
											description: 'The seed used to generate the template',
											type: 'Seed',
											default: seed(),
										},
										...(state.generator ? state.generator.config : []),
									],
									onChange: (config) => {
										state.config = config;
										m.redraw();
									},
								}),
								buttonBar(),
							]),
						Information: () => renderInformationTab(state.generator),
						Saved: () =>
							renderSavedTab({
								state,
								onDelete: (key) => deleteSavedConfigAction('generator', () => state.generator, key, state),
								onLoad: (key) => loadSavedConfigAction(key, state, (c) => (state.config = c)),
								extraActions: (key) => [
									m(
										IconButton,
										{
											icon: 'cloud-upload',
											intend: 'primary',
											onClick: () => {
												loadSavedConfigAction(key, state, (c) => (state.config = c));
												state.config.seed = seed();
											},
										},
										'Load + New Seed',
									),
								],
								buttonBar,
							}),
					},
				}),
			);
		},
	};
};
