import m from 'mithril';

// @ts-ignore
import { inElectron, shell } from 'src/js/electron';

import { isGridLinearExecution, SessionGrid } from 'js/types/session-grid';
import * as API from 'js/core/api';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Select from 'js/ui/shoelace/select';

import Icon from 'js/ui/components/atomic/icon';
import InfoIcon from 'js/ui/components/atomic/info-icon';
import Title from 'js/ui/components/atomic/title';
import Tooltip from 'js/ui/components/atomic/tooltip';
import CenterContainer from 'js/ui/components/layout/center-container';
import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';
import { openPromptModal } from 'js/ui/components/modals/prompt';
import { createEditGridButtonModal } from 'js/ui/components/modals/session-grid/create-edit-grid-button';
import GridEdit from 'js/ui/components/session-grid/grid-edit';
import Base from 'js/ui/components/view-layout/base';

import { dialogWarning, error } from 'js/ui/toast';

const infoText = `
  The session grid is a tool to help you organize your sessions.
  Put the Templates and Generators you need in the grid for quick access.
`;

const breakPoints = [400, 600, 800];

type SessionGridProps = {
	gridName?: string;
};

type SessionGridState = {
	selectedGrid: string;
	playMode: boolean;
	minimalMode: boolean;
	grids: Record<string, SessionGrid[]>;
	width: number;
};

export default (): m.Component<SessionGridProps> => {
	const state: SessionGridState = {
		selectedGrid: '',
		playMode: false,
		minimalMode: false,
		grids: {},
		width: 0,
	};

	const getSelectedGrid = () => state.grids[state.selectedGrid];

	const gridsExist = () => Object.keys(state.grids).length > 0;

	const fetchGrids = async () =>
		API.exec<string>(API.GET_KEY, 'session_grids')
			.then((res) => {
				state.grids = JSON.parse(res);
			})
			.catch((err) => {
				console.log(err);
			});

	const saveGrids = async () => API.exec<string>(API.SET_KEY, 'session_grids', JSON.stringify(state.grids)).catch(error);

	const createNew = () => {
		openPromptModal({
			title: 'Create New Session',
			label: 'Grid Name',
			description: 'Name of the new session grid',
			onSuccess: (name: string) => {
				if (state.grids[name]) {
					error('Grid already exists');
					return;
				}

				if (!name) {
					error('Name cannot be empty');
					return;
				}

				if (name.trim().length < 2) {
					error('Name must be at least 2 characters');
					return;
				}

				state.grids[name] = [{ name: name, elements: [] }];
				saveGrids();
			},
		});
	};

	const createNewSection = () => {
		if (state.selectedGrid === '') {
			error('Select a grid first');
			return;
		}

		openPromptModal({
			title: 'Create New Section',
			label: 'Section Name',
			description: 'Name of the new section',
			onSuccess: (name: string) => {
				if (!name) {
					error('Name cannot be empty');
					return;
				}

				if (name.trim().length < 2) {
					error('Name must be at least 2 characters');
					return;
				}

				getSelectedGrid()?.push({ name: name, elements: [] });
				saveGrids();
			},
		});
	};

	const header = () => {
		if (state.selectedGrid.length === 0 || !state.grids[state.selectedGrid]) {
			return '';
		}

		return m(Flex, { justify: 'between', items: 'center', className: '.pa2.bg-white.mb3.ba.b--black-10.br2' }, [
			m('div', [m('div.ttu.text-muted.f8.fw5.mb2', 'selected grid'), m('div.f6', state.selectedGrid)]), //
			m(Flex, { gap: 2 }, [
				m(
					IconButton,
					{
						icon: 'play',
						intend: 'success',
						size: 'sm',
						onClick: () => (state.playMode = true),
					},
					'Play-Mode',
				), //
				m(
					Tooltip,
					{ content: 'Open as window' },
					m(IconButton, {
						icon: 'exit',
						intend: 'primary',
						size: 'sm',
						onClick: () => window.open(`${location.href}?gridName=${encodeURIComponent(state.selectedGrid)}`, '_blank'),
					}),
				),
				m(
					Tooltip,
					{ content: 'Open link in browser' },
					m(IconButton, {
						icon: 'link',
						intend: 'primary',
						size: 'sm',
						onClick: () => {
							API.exec<string>(API.GET_LOCAL_URL, `/${location.hash}?gridName=${encodeURIComponent(state.selectedGrid)}`).then((url) => {
								console.log(url);
								if (inElectron) {
									shell.openExternal(url);
								} else {
									window.open(url, '_blank');
								}
							});
						},
					}),
				),
				m(DividerVert, { noSpacing: true }),
				m(IconButton, {
					icon: 'create',
					intend: 'primary',
					size: 'sm',
					onClick: () => {
						openPromptModal({
							title: 'Edit Grid Name',
							label: 'Grid Name',
							description: 'Name of the grid',
							value: state.selectedGrid,
							onSuccess: (name: string) => {
								if (state.grids[name]) {
									error('Grid already exists');
									return;
								}

								if (!name) {
									error('Name cannot be empty');
									return;
								}

								if (name.trim().length < 2) {
									error('Name must be at least 2 characters');
									return;
								}

								state.grids[name] = state.grids[state.selectedGrid];
								delete state.grids[state.selectedGrid];
								state.selectedGrid = name;
								saveGrids();
							},
						});
					},
				}),
				m(IconButton, {
					icon: 'trash',
					intend: 'error',
					size: 'sm',
					onClick: () => {
						dialogWarning('Are you sure you want to delete this grid?').then(() => {
							delete state.grids[state.selectedGrid];
							state.selectedGrid = '';
						});
					},
				}),
			]),
		]);
	};

	const content = () => {
		if (state.selectedGrid.length === 0 || !state.grids[state.selectedGrid]) {
			return m(Flex, { justify: 'center', items: 'center', className: '.pa4.o-30', direction: 'column', gap: 2 }, [
				m(Icon, { icon: 'information-circle-outline', size: 3 }),
				m('div', 'Select a grid to start or create a new one'),
			]);
		}

		let columns = 4;
		if (!!state.width) {
			for (let i = 0; i < breakPoints.length; i++) {
				if (state.width < breakPoints[i]) {
					columns = i + 1;
					break;
				}
			}
		}

		return [
			state.minimalMode || state.playMode ? null : header(),

			// Sections
			...getSelectedGrid()?.map((section, i) => [
				m(Flex, { className: '.f7.b.pb2.bb.b--black-10.mb2.text-muted', justify: 'between', items: 'center' }, [
					section.name,
					state.playMode
						? null
						: m(Flex, { gap: 2 }, [
								m(Icon, {
									icon: 'create',
									onClick: () => {
										openPromptModal({
											title: 'Edit Section Name',
											label: 'Section Name',
											description: 'Name of the section',
											value: section.name,
											onSuccess: (name: string) => {
												if (!name) {
													error('Name cannot be empty');
													return;
												}

												if (name.trim().length < 2) {
													error('Name must be at least 2 characters');
													return;
												}

												section.name = name;
												saveGrids();
												m.redraw();
											},
										});
									},
								}), //
								m(Icon, {
									icon: 'trash',
									className: '.col-error',
									onClick: () => {
										dialogWarning('Are you sure you want to delete this section?').then(() => {
											getSelectedGrid()?.splice(i, 1);
											saveGrids();
										});
									},
								}),
						  ]),
				]),
				m(
					Grid,
					{
						columns: 'minmax(0, 1fr)'.repeat(columns),
						gap: -1,
						className: '.mb4',
					},
					[
						...section.elements.map((element, i) => {
							if (isGridLinearExecution(element)) {
								return;
							}
							return m(GridEdit, {
								inEdit: !(state.minimalMode || state.playMode),
								element: element,
								onDelete: () => {
									section.elements = section.elements.filter((el) => el !== element);
									saveGrids();
								},
								onEdit: () => {
									createEditGridButtonModal({
										element: element,
										onSuccess: (newElement) => {
											section.elements = section.elements.map((el) => (el === element ? newElement : el));
											saveGrids();
										},
									});
								},
								onMoveLeft: () => {
									if (i === 0 || i >= section.elements.length) {
										return;
									}
									const temp = section.elements[i - 1];
									section.elements[i - 1] = section.elements[i];
									section.elements[i] = temp;
									saveGrids();
								},
								onMoveRight: () => {
									if (i === section.elements.length - 1 || i >= section.elements.length) {
										return;
									}
									const temp = section.elements[i + 1];
									section.elements[i + 1] = section.elements[i];
									section.elements[i] = temp;
									saveGrids();
								},
							});
						}),

						state.playMode || state.minimalMode
							? null
							: m(
									'div.flex.items-center.justify-center.o-50',
									{
										onclick: () => {
											createEditGridButtonModal({
												onSuccess: (element) => {
													section.elements.push(element);
													saveGrids();
												},
											});
										},
										style: { aspectRatio: '1 / 1', padding: 0 },
									},
									[
										m(
											'div.bg-black-05.br3.flex.items-center.justify-center.pointer.grow',
											{ style: { height: '90%', width: '90%' } },
											m(Icon, { icon: 'add-circle-outline', size: 3, className: '.o-30' }),
										), //
									],
							  ), //
					],
				),
			]),

			// New Section
			!(state.playMode || state.minimalMode)
				? m('div.flex.gap-2.items-center.mb6', { onclick: createNewSection }, [
						m('div.flex-grow-1.bb.b--black-10'),
						m(Icon, { icon: 'add-circle-outline', size: 6, className: '.o-30.pointer.grow' }),
						m('div.flex-grow-1.bb.b--black-10'),
				  ])
				: null,
		];
	};

	return {
		oninit({ attrs }) {
			fetchGrids();

			if (attrs.gridName) {
				window.addEventListener('resize', () => {
					m.redraw();
				});
			}
		},
		onupdate() {
			state.width = window.innerWidth;
		},
		view({ attrs }) {
			if (attrs.gridName) {
				state.selectedGrid = decodeURIComponent(attrs.gridName);
				state.minimalMode = true;
				state.playMode = true;

				document.title = `${state.selectedGrid} - Session Grid`;
			}

			if (state.minimalMode) {
				return m(CenterContainer, m('div.pa3', [content()]));
			}

			return m(
				Base,
				{
					title: m(Title, ['Session Grid', m(InfoIcon, { className: '.ml2', size: 7 }, infoText)]),
					active: 'session-grid',
					classNameContainer: '.pa3',
					rightElement: m(Flex, { justify: 'center', items: 'center' }, [
						gridsExist()
							? [
									m(Select, {
										keys: Object.keys(state.grids),
										selected: state.selectedGrid,
										onInput: (sel) => {
											state.selectedGrid = sel.target.value;
										},
									}),
									m(DividerVert, { noSpacing: true, className: '.ml3.mr2' }),
							  ]
							: null,
						m(IconButton, { icon: 'add-circle-outline', intend: 'link', onClick: () => createNew() }, 'Create'),
						state.playMode
							? [
									m(DividerVert, { noSpacing: true, className: '.mr3' }),
									m(IconButton, { icon: 'close', onClick: () => (state.playMode = false) }, 'End Play-Mode'),
							  ]
							: null,
					]),
				},
				m(CenterContainer, [content()]),
			);
		},
	};
};
