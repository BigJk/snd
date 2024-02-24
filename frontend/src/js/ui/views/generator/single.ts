import m from 'mithril';

import { buildId } from 'js/types/basic-info';
import Generator, { sanitizeConfig } from 'js/types/generator';
import * as API from 'js/core/api';
import store from 'js/core/store';

import Checkbox from 'js/ui/spectre/checkbox';
import IconButton from 'js/ui/spectre/icon-button';
import Loader from 'js/ui/spectre/loader';

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
};

export default (): m.Component<SingleGeneratorProps> => {
	let state: SingleGeneratorState = {
		generator: null,
		config: {},
		printCount: 1,
		lastRendered: '',
		hidePreview: false,
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
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(
								IconButton,
								{
									intend: 'primary',
									icon: 'bug',
									size: 'sm',
									className: '.mr2',
									onClick: () => {
										openDevTools(document.body);
									},
								},
								'',
							),
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
											default: 'TEST_SEED',
										},
										...(state.generator ? state.generator.config : []),
									],
									onChange: (config) => {
										state.config = config;
										m.redraw();
									},
								}),
								m(Flex, { className: '.bt.b--black-10.pv2.ph3', justify: 'end', gap: 2 }, [
									/*
									Disabled for now!
									
									m(
										Tooltip,
										{ content: 'Print Count' },
										m(Input, {
											className: '.w2.tc',
											placeholder: '#',
											useBlur: true,
											value: state.printCount,
											onChange: (value: string) => (state.printCount = parseInt(value) ?? 1),
										}),
									),
									*/
									m(Flex, { items: 'center', className: '.mr2' }, [
										m(Checkbox, { checked: state.hidePreview, onChange: (val) => (state.hidePreview = val) }),
										'Hide preview',
									]),
									m(IconButton, { icon: 'camera', intend: 'primary', onClick: screenshot }, 'Screenshot'),
									m(IconButton, { icon: 'print', intend: 'success', onClick: print }, 'Print'),
								]),
							]),
						Information: () => m('div.ph3.pv2.lh-copy', [m('div.f5.mb2.b', 'Description'), state.generator?.description ?? '']),
						Saved: () => m('div.ph3.pv2', 'coming soon...'),
					},
				}),
			);
		},
	};
};
