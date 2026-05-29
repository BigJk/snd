import m from 'mithril';

import BasicInfo, { buildId } from 'js/types/basic-info';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';

import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import { openDevTools } from 'js/ui/components/print-preview';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';

import { error } from 'js/ui/toast';

export type EntityCreateConfig<T extends BasicInfo> = {
	/** Singular lower-case kind used in routes and IDs, e.g. 'template' */
	kind: 'template' | 'generator';
	/** Plural display label for the list breadcrumb, e.g. 'Templates' */
	listLabel: string;
	/** Route prefix for the list, e.g. '/template' */
	listRoute: string;
	/** Active nav item for the sidebar */
	active: string;
	/** Factory that returns a blank entity */
	createEmpty: () => T;
	/** Fetch an existing entity by ID (used when duplicating) */
	fetchEntity: (id: string) => Promise<T>;
	/** Persist a new entity */
	saveEntity: (entity: T) => Promise<string | void>;
	/** Copy entries from one entity to another after duplication */
	copyEntries?: (fromId: string, toId: string) => Promise<void>;
	/** Render the editor component */
	renderEditor: (entity: T, onChange: (updated: T) => void) => m.Vnode<any>;
	/** Optional: validate before saving; returning a string blocks the save */
	validate?: (entity: T, isDuplicate: boolean, sourceId: string | undefined) => string | null;
	/** Whether to show the Dev Tools button */
	showDevTools?: boolean;
};

type CreateEntityProps = {
	/** When set the view acts as a duplicate-from view */
	id?: string;
};

/**
 * Generic create/duplicate view shared by the template and generator flows.
 */
export default <T extends BasicInfo>(config: EntityCreateConfig<T>): m.Component<CreateEntityProps> => {
	let state: T = config.createEmpty();

	return {
		oninit({ attrs }) {
			if (attrs.id) {
				config.fetchEntity(attrs.id).then((entity) => {
					state = entity;
					m.redraw();
				});
			}
		},
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						confirmText: 'Are you sure you want to leave this page? Changes are not saved.',
						items: [{ link: config.listRoute, label: config.listLabel }, { label: `Create ${config.listLabel.slice(0, -1)}` }],
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
									const validationError = config.validate?.(state, !!attrs.id, attrs.id);
									if (validationError) {
										error(validationError);
										return;
									}
									config
										.saveEntity(state)
										.then(() => {
											if (!state) return;
											const newId = buildId(config.kind, state);
											if (attrs.id && config.copyEntries) {
												config.copyEntries(attrs.id, newId).then(() => {
													m.route.set(`${config.listRoute}/${newId}`);
												});
											} else {
												m.route.set(`${config.listRoute}/${newId}`);
											}
										})
										.catch(error);
								},
							},
							'Save',
						),
						...(config.showDevTools
							? [
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
								]
							: []),
					]),
					active: config.active,
					classNameContainer: '',
				},
				config.renderEditor(state, (updated) => {
					state = updated;
					m.redraw();
				}),
			);
		},
	};
};
