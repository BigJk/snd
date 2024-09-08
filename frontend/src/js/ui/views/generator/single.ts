import m from 'mithril';
import { cloneDeep, map } from 'lodash-es';

import HorizontalProperty from '../../components/horizontal-property';
import { openPromptModal } from '../../components/modals/prompt';

import { buildId } from 'js/types/basic-info';
import Generator, { sanitizeConfig, seed } from 'js/types/generator';
import * as API from 'js/core/api';
import store from 'js/core/store';

import Checkbox from 'js/ui/shoelace/checkbox';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Loader from 'js/ui/shoelace/loader';

import Tooltip from 'js/ui/components/atomic/tooltip';
import Editor from 'js/ui/components/config/editor';
import Flex from 'js/ui/components/layout/flex';
import { openAdditionalInfosModal } from 'js/ui/components/modals/additional-infos';
import { openFileModal } from 'js/ui/components/modals/file-browser';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';

import { setPortal } from 'js/ui/portal';
import { dialogWarning, error, success } from 'js/ui/toast';

type SingleGeneratorProps = {
	id: string;
};

type SingleGeneratorState = {
	generator: Generator | null;
	config: any;
	printCount: number;
	lastRendered: string;
	hidePreview: boolean;
	savedConfigs: Record<string, any[]>;
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

	const print = () => {
		if (!state.generator) return;
		API.exec<void>(API.PRINT, state.lastRendered)
			.then(() => success('Printed entry'))
			.catch(error);
	};

	const screenshot = () => {
		if (!state.generator) return;
		openFileModal('Select a save folder', [], true).then((folder) => {
			API.exec<void>(API.SCREENSHOT, state.lastRendered, `${folder}/${state.config['seed']}.png`)
				.then(() => success('Saved screenshot'))
				.catch(error);
		});
	};

	const showExport = () => {
		if (!state.generator) return;

		setPortal(ImportExport, {
			attributes: {
				endpoint: API.EXPORT_GENERATOR,
				title: 'Export Generator',
				loadingMessage: 'Exporting... Please wait',
				verb: 'Export',
				id: buildId('generator', state.generator),
			},
		});
	};

	const showAdditionalInfo = () => {
		if (!state.generator) return;
		openAdditionalInfosModal('generator', buildId('generator', state.generator), state.config);
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

	const saveConfigs = () => {
		if (!state.generator) {
			return;
		}
		return API.exec<void>(API.SET_KEY, `${buildId('generator', state.generator)}_saved_configs`, JSON.stringify(state.savedConfigs));
	};

	const saveConfig = () => {
		openPromptModal({
			title: 'Save Config',
			label: 'Name',
			description: 'Enter a name for the config',
			onSuccess: (name) => {
				if (!state.generator) return;

				if (state.savedConfigs[name]) {
					dialogWarning('This config already exists. Do you want to overwrite it?').then(() => {
						state.savedConfigs[name] = cloneDeep(state.config);
						saveConfigs()?.catch(error);
						success('Overwrote config');
					});
					return;
				}

				state.savedConfigs[name] = cloneDeep(state.config);
				saveConfigs()?.catch(error);
				success('Saved config');
			},
		});
	};

	const deleteSavedConfig = (name: string) => {
		dialogWarning('Are you sure you want to delete this config?').then(() => {
			if (!state.generator) return;
			delete state.savedConfigs[name];
			saveConfigs()?.catch(error);
		});
	};

	const loadSavedConfig = (name: string) => {
		if (!state.generator) return;
		state.config = cloneDeep(state.savedConfigs[name]);
	};

	const buttonBar = () =>
		m(Flex, { className: '.bt.b--black-10.pv2.ph3', justify: 'between', items: 'center', gap: 2 }, [
			m(Flex, { gap: 2 }, [
				m(IconButton, { icon: 'save', intend: 'primary', onClick: saveConfig }, 'Save Config'),
				m(IconButton, { icon: 'camera', intend: 'primary', onClick: screenshot }, 'Screenshot'),
			]),
			m(Flex, { gap: 2, items: 'center' }, [
				m(Tooltip, { content: 'Hide Preview' }, m(Checkbox, { checked: state.hidePreview, onChange: (val) => (state.hidePreview = val) })),
				m(IconButton, { icon: 'print', intend: 'success', onClick: print }, 'Print'),
			]),
		]);

	return {
		oninit({ attrs }) {
			API.exec<Generator>(API.GET_GENERATOR, attrs.id).then((generator) => {
				state.generator = generator;
				state.config = sanitizeConfig(generator, {});
			});
			API.exec<string>(API.GET_KEY, `${attrs.id}_saved_configs`)
				.then((configs) => {
					state.savedConfigs = JSON.parse(configs);
				})
				.catch(console.error);
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
					active: 'generators',
					classNameContainer: '.pa3',
					rightElement: m('div.flex', [
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/generator/${attrs.id}/edit`) }, 'Edit'),
						m(DividerVert),
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
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(IconButton, {
								intend: 'primary',
								icon: 'bug',
								size: 'sm',
								className: '.mr2',
								onClick: () => {
									openDevTools(document.body);
								},
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
				m(SidebarPrintPage, {
					generator: state.generator,
					config: state.config,
					onRendered: (html) => (state.lastRendered = html),
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
						Information: () =>
							m('div.ph3.pv2.lh-copy', [
								m('div.f5.mb2.b', 'Description'),
								m('div', { style: { whiteSpace: 'break-spaces' } }, state.generator?.description ?? ''),
								...(state.generator?.copyrightNotice
									? [m('div.f5.mb2.b.mt3', 'Copyright Notice'), m('div', { style: { whiteSpace: 'break-spaces' } }, state.generator.copyrightNotice)]
									: []),
							]),
						Saved: () =>
							m(Flex, { className: '.h-100', direction: 'column' }, [
								m('div.ph3.pv2.lh-copy.h-100.overflow-auto', [
									m('div.f5.b', 'Saved Configs'),
									Object.keys(state.savedConfigs).length
										? m(Flex, { direction: 'column' }, [
												...map(state.savedConfigs, (config, key) =>
													m(
														HorizontalProperty,
														{
															label: key,
															description: '',
															bottomBorder: true,
															centered: true,
														},
														m(
															Flex,
															{
																justify: 'end',
															},
															[
																m(IconButton, { icon: 'trash', intend: 'error', onClick: () => deleteSavedConfig(key) }),
																m(DividerVert),
																m(
																	IconButton,
																	{ icon: 'cloud-upload', className: '.mr2', intend: 'primary', onClick: () => loadSavedConfig(key) },
																	'Load',
																),
																m(
																	IconButton,
																	{
																		icon: 'cloud-upload',
																		intend: 'primary',
																		onClick: () => {
																			loadSavedConfig(key);
																			state.config.seed = seed();
																		},
																	},
																	'Load + New Seed',
																),
															],
														),
													),
												),
										  ])
										: m('div.pv2.text-muted', 'No saved configs yet...'),
								]),
								buttonBar(),
							]),
					},
				}),
			);
		},
	};
};
