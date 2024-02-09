import m from 'mithril';
import { get, set } from 'lodash-es';

import { buildId } from 'js/types/basic-info';
import Entry from 'js/types/entry';
import Template from 'js/types/template';
import * as API from 'js/core/api';
import { buildSchema, initialData, objectPathToSchema, readableName, SchemaNode, SchemaRoot } from 'js/core/schema';

import IconButton from 'js/ui/spectre/icon-button';
import Input from 'js/ui/spectre/input';
import Loader from 'js/ui/spectre/loader';
import Icon from 'js/ui/components/atomic/icon';
import types from 'js/ui/components/config/types';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import EditorHeader from 'js/ui/components/view-layout/property-header';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';
import SidebarPrintPage from 'js/ui/components/view-layout/sidebar-print-page';
import { error } from 'js/ui/toast';

type CreateTemplateEntityProps = {
	id: string;
	eid?: string;
};

type CreateTemplateEntityState = {
	template: Template | null;
	name: string;
	id: string;
	data: any;
	schema: SchemaRoot | null;
	edit: boolean;
	selected: string;
};

export default (): m.Component<CreateTemplateEntityProps> => {
	const state: CreateTemplateEntityState = {
		template: null,
		name: 'new entry',
		id: 'new-entry',
		data: {},
		schema: null,
		edit: false,
		selected: 'Global',
	};

	const getGlobal = () => {
		if (state.schema === null) {
			return [];
		}

		return state.schema.nodes.filter((n) => n.type !== 'object' && n.type !== 'array');
	};

	const getCategories = () => ({
		Global: getGlobal(),
		...state.schema?.nodes
			.filter((n) => n.type === 'object' || n.type === 'array')
			.reduce((acc: any, cur) => {
				acc[cur.readableName ?? readableName(cur.key)] = [cur];
				return acc;
			}, {}),
	});

	const renderObject = (obj: any, path: string[]) => {
		if (!state.schema) {
			return;
		}

		const elem = get(obj, path);

		const node = objectPathToSchema(state.schema!, path);
		if (!node) {
			return;
		}

		if (node.type === 'object') {
			return m('div', [
				m(EditorHeader, {
					title: node.readableName ?? readableName(node.key),
					description: node.description,
				}),
				Object.keys(elem).map((k: any) => renderObject(obj, [...path, k])),
			]);
		} else if (node.type === 'array') {
			return m('div', [
				m(Flex, { justify: 'between', items: 'end', className: '.mb3' }, [
					m(EditorHeader, {
						title: node.readableName ?? readableName(node.key),
						description: node.description,
					}),
					m(
						IconButton,
						{
							icon: 'add',
							intend: 'primary',
							onClick: () => elem.push(initialData(node.children ?? [])),
						},
						'Add',
					),
				]),
				elem.map((e: any, i: number) =>
					m('div.ba.b--black-10.br2.mb3', [
						m(Flex, { justify: 'between', className: '.pv2.ph3.bg-black-05' }, [
							m('div.f6.b', `Item #${i + 1}`),
							m(Icon, {
								icon: 'trash',
								className: '.col-error',
								onClick: () => elem.splice(i, 1),
							}),
						]),
						m(
							'div.pa3',
							Object.keys(e).map((k) => renderObject(obj, [...path, i.toString(), k])),
						),
					]),
				),
			]);
		} else {
			return m(
				HorizontalProperty,
				{ label: node.readableName ?? readableName(node.key), description: node.description, bottomBorder: true, centered: true },
				m(types[node.inputType].view, {
					value: elem,
					onChange: (value: any) => {
						set(obj, path, value);
						m.redraw();
					},
				}),
			);
		}
	};

	return {
		oninit({ attrs }) {
			API.exec<Template>(API.GET_TEMPLATE, attrs.id).then((template) => {
				state.template = template;
				state.schema = buildSchema(template.skeletonData);
				state.data = initialData(state.schema);

				if (attrs.eid) {
					API.exec<Entry>(API.GET_ENTRY, attrs.id, attrs.eid)
						.then((entry) => {
							state.data = entry.data;
							state.name = entry.name;
							state.id = entry.id;
							state.edit = true;
						})
						.catch(error);
				}

				// Testing stuff
				// console.log(state.schema);
				// console.log(getCategories());
				// console.log(initialData(state.schema));
			});
		},
		view({ attrs }) {
			const cats = getCategories();

			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: '/template', label: 'Templates' },
							{
								link: `/template/${state.template ? buildId('template', state.template) : ''}`,
								label: state.template ? state.template.name : m(Loader, { className: '.mh2' }),
							},
							{ label: state.edit ? `Edit '${state.name}' Entry` : 'Create Entry' },
						],
					}),
					rightElement: [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {
									API.exec<void>(API.SAVE_ENTRY, attrs.id, {
										id: state.id,
										name: state.name,
										data: state.data,
									})
										.then(() => {
											m.route.set(`/template/${attrs.id}`);
										})
										.catch(error);
								},
							},
							'Save',
						), //
					],
					active: 'templates',
					classNameContainer: '.pa3',
				},
				m(SidebarPrintPage, {
					template: state.template,
					it: state.data,
					tabs: [{ icon: 'filing', label: 'Entry' }],
					content: {
						Entry: () =>
							m(SideMenuPager, {
								value: state.selected,
								onChange: (value: string) => (state.selected = value),
								items: [
									{
										id: 'basic-info',
										title: 'Basic Info',
										icon: 'list',
										centerContainer: true,
										render: () =>
											m('div.ph3', [
												m(
													HorizontalProperty,
													{
														label: 'Name',
														description: 'The name of the entry.',
														bottomBorder: true,
														centered: true,
													},
													m(Input, {
														value: state.name,
														onChange: (val) => (state.name = val),
													}),
												),
												state.edit
													? null
													: m(
															HorizontalProperty,
															{
																label: 'ID',
																description: 'Unique identifier of the entry.',
																bottomBorder: true,
																centered: true,
															},
															m(Input, {
																value: state.id,
																onChange: (val) => (state.id = val),
															}),
													  ),
											]),
									},
									...Object.keys(cats).map((c) => ({
										id: c,
										title: c,
										icon: 'list',
										centerContainer: true,
										render: () =>
											m('div.ph3', [
												c === 'Global'
													? m(EditorHeader, {
															title: c,
													  })
													: null,
												cats[c].map((n: SchemaNode) => renderObject(state.data, [n.key])),
											]),
									})),
								],
							}),
					},
				}),
			);
		},
	};
};
