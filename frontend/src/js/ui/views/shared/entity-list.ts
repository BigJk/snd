import m from 'mithril';
import { groupBy } from 'lodash-es';

import BasicInfo, { buildId } from 'js/types/basic-info';

import Button from 'js/ui/shoelace/button';
import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';

import AuthorTag from 'js/ui/components/atomic/author-tag';
import Title from 'js/ui/components/atomic/title';
import DataTable from 'js/ui/components/data-table/data-table';
import FilterBox from 'js/ui/components/filter-box';
import Flex from 'js/ui/components/layout/flex';
import ImportExport from 'js/ui/components/modals/imexport/import-export';
import PageEmptyState from 'js/ui/components/page-empty-state';
import Base from 'js/ui/components/view-layout/base';

import { setPortal } from 'js/ui/portal';

export type EntityListConfig<T extends BasicInfo> = {
	/** Plural display name, e.g. 'Templates' */
	title: string;
	/** Singular lower-case kind used in routes and IDs, e.g. 'template' */
	kind: 'template' | 'generator';
	/** Singular lower-case label for search placeholder, e.g. 'template' */
	searchLabel: string;
	/** Plural lower-case label for footer count, e.g. 'templates' */
	countLabel: string;
	/** Optional hover text shown in the filter box */
	hoverText?: string;
	/** Active nav item for the sidebar */
	active: string;
	/** Import API endpoint */
	importEndpoint: string;
	/** Import modal title */
	importTitle: string;
	/** Route to navigate to for creating a new entity */
	createRoute: string;
	/** Atom holding the list of entities */
	itemsAtom: { value: T[] };
	/** Store action to load entities */
	loadAction: () => Promise<any>;
};

/**
 * Generic list view shared by the template and generator flows.
 */
export default <T extends BasicInfo>(config: EntityListConfig<T>): m.Component => {
	let searchValue = '';
	let hovered: T | null = null;

	const filteredItems = () =>
		config.itemsAtom.value.filter(
			(item) => item.name.toLowerCase().includes(searchValue.toLowerCase()) || item.author.toLowerCase().includes(searchValue.toLowerCase()),
		);

	return {
		oninit() {
			config.loadAction();
		},
		view() {
			const allAuthors = Object.keys(groupBy(config.itemsAtom.value, 'author'));

			const search = () =>
				m(FilterBox, {
					value: searchValue,
					placeholder: `Search ${config.searchLabel}...`,
					onChange: (value) => {
						searchValue = value;
					},
					authors: allAuthors,
					footer: [filteredItems().length, ` ${config.countLabel}`],
					hoveredId: hovered ? buildId(config.kind, hovered) : undefined,
					hoverText: config.hoverText,
				});

			const dataTable = () =>
				m('div.mb3.pr3', { style: { marginRight: '250px' } }, [
					m(DataTable<T>, {
						data: filteredItems(),
						items: 'center',
						columns: [
							{
								customID: 'action',
								header: ' ',
								width: 'max-content',
								render: (parent) =>
									m(
										'div.relative.dim.pointer',
										{
											style: {
												width: '100px',
												height: '40px',
												backgroundImage: `url("/api/preview-image/${buildId(config.kind, parent)}")`,
												backgroundSize: '100% auto',
												backgroundPosition: 'center top',
												backgroundRepeat: 'no-repeat',
											},
											onclick: () => m.route.set(`/${config.kind}/${buildId(config.kind, parent)}`),
											onmouseover: () => (hovered = parent),
											onmouseout: () => (hovered = null),
										},
										[
											m('div.absolute.bottom-0.right-0.w-100', {
												style: {
													height: '50%',
													background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
												},
											}),
										],
									),
							},
							{
								field: 'name' as keyof T,
								width: '250px',
								render: (parent) =>
									m('div', [m('div.b.f7.mb1', parent.name), m('div.f8.text-muted.', [m('span.mr1', 'by'), m(AuthorTag, { author: parent.author })])]),
							},
							{ field: 'description' as keyof T, width: '1fr', noBorder: true },
							{
								customID: ' ',
								width: 'max-content',
								render: (parent) =>
									m(Button, { intend: 'link', onClick: () => m.route.set(`/${config.kind}/${buildId(config.kind, parent)}`) }, 'Open'),
							},
						],
					}),
				]);

			return m(
				Base,
				{
					title: m(Title, config.title),
					active: config.active,
					classNameContainer: '.pa3',
					rightElement: m(Flex, { items: 'center' }, [
						m(
							IconButton,
							{
								intend: 'link',
								icon: 'cloud-upload',
								onClick: () => {
									setPortal(ImportExport, {
										attributes: {
											endpoint: config.importEndpoint,
											title: config.importTitle,
											loadingMessage: 'Importing... Please wait',
											verb: 'Import',
										},
									});
								},
							},
							'Import',
						),
						m(DividerVert),
						m(IconButton, { link: config.createRoute, intend: 'link', icon: 'add' }, 'Create'),
					]),
				},
				m('div', config.itemsAtom.value.length === 0 ? m(PageEmptyState, { name: config.countLabel, bigMessage: true }) : [search(), dataTable()]),
			);
		},
	};
};
