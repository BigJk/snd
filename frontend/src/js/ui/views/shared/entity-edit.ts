import m from 'mithril';

import BasicInfo, { buildId } from 'js/types/basic-info';
import * as API from 'js/core/api';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';
import Loader from 'js/ui/shoelace/loader';

import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error, success } from 'js/ui/toast';

export type EntityEditConfig<T extends BasicInfo> = {
	/** Singular lower-case kind used in routes and IDs, e.g. 'template' */
	kind: 'template' | 'generator';
	/** Plural display label for the list breadcrumb, e.g. 'Templates' */
	listLabel: string;
	/** Route prefix for the list, e.g. '/template' */
	listRoute: string;
	/** Active nav item for the sidebar */
	active: string;
	/** Fetch the entity by ID */
	fetchEntity: (id: string) => Promise<T>;
	/** Persist the entity */
	saveEntity: (entity: T) => Promise<void>;
	/** Render the editor component given the entity and onChange/onRendered callbacks */
	renderEditor: (entity: T, onChange: (updated: T) => void, onRendered: (html: string) => void) => m.Vnode<any>;
	/** Optional: validate before saving; returning a string blocks the save with that error message */
	validate?: (entity: T) => string | null;
};

type EditEntityProps = {
	id: string;
};

/**
 * Generic edit view shared by the template and generator flows.
 */
export default <T extends BasicInfo>(config: EntityEditConfig<T>): m.Component<EditEntityProps> => {
	let state: T | null = null;
	let lastRenderedHTML = '';

	return {
		oninit({ attrs }) {
			config.fetchEntity(attrs.id).then((entity) => {
				state = entity;
				m.redraw();
			});
		},
		view() {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [
							{ link: config.listRoute, label: config.listLabel },
							{
								link: state ? `${config.listRoute}/${buildId(config.kind, state)}` : '',
								label: state ? state.name : m(Loader, { className: '.mh2' }),
							},
							{ label: 'Edit' },
						],
					}),
					rightElement: m(Flex, { items: 'center' }, [
						m(
							IconButton,
							{
								icon: 'add',
								size: 'sm',
								intend: 'success',
								onClick: () => {
									if (!state) return;
									const validationError = config.validate?.(state);
									if (validationError) {
										error(validationError);
										return;
									}
									config
										.saveEntity(state)
										.then(() => {
											if (!state) return;
											m.route.set(`${config.listRoute}/${buildId(config.kind, state)}`);
										})
										.catch(error);
								},
							},
							'Save',
						),
						m(DividerVert),
						m(
							Tooltip,
							{ content: 'Open Dev Tools' },
							m(IconButton, {
								className: '.mr2',
								intend: 'primary',
								icon: 'bug',
								size: 'sm',
								onClick: () => openDevTools(document.body),
							}),
						),
						m(
							Tooltip,
							{ content: 'Test Print' },
							m(IconButton, {
								intend: 'primary',
								icon: 'print',
								size: 'sm',
								onClick: () => {
									API.exec(API.PRINT, lastRenderedHTML)
										.then(() => success('Test print sent!'))
										.catch(error);
								},
							}),
						),
					]),
					active: config.active,
				},
				state
					? config.renderEditor(
							state,
							(updated) => {
								state = updated;
								m.redraw();
							},
							(html) => {
								lastRenderedHTML = html;
							},
						)
					: m(Loader),
			);
		},
	};
};
