import m from 'mithril';
import { groupBy } from 'lodash-es';

import { css } from 'goober';

import BasicInfo, { buildId } from 'js/types/basic-info';

import DividerVert from 'js/ui/shoelace/divider-vert';
import IconButton from 'js/ui/shoelace/icon-button';

import AuthorTag from 'js/ui/components/atomic/author-tag';
import Title from 'js/ui/components/atomic/title';
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

const entityListStyle = css`
	.entity-list-row {
		display: grid;
		grid-template-columns: 112px minmax(180px, 280px) minmax(0, 1fr) max-content;
		gap: 0.75rem;
		align-items: center;
		background: #fff;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		transition:
			background 120ms ease,
			border-color 120ms ease,
			box-shadow 120ms ease;
	}

	.entity-list-row:hover {
		background: #fbfcfd;
		border-color: rgba(90, 84, 214, 0.35);
		box-shadow: 0 4px 14px rgba(18, 35, 53, 0.08);
	}

	.entity-preview {
		background: #f7f8fa;
		border-radius: 6px;
		height: 56px;
		overflow: hidden;
		position: relative;
		width: 96px;
	}

	.entity-preview-image {
		background-position: center top;
		background-repeat: no-repeat;
		background-size: 100% auto;
		height: 100%;
		width: 100%;
	}

	.entity-preview-fade {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 100%);
		bottom: 0;
		height: 42%;
		left: 0;
		position: absolute;
		right: 0;
	}

	.entity-description {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-height: 1.35;
		overflow: hidden;
	}
`;

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

			const openEntity = (item: T) => m.route.set(`/${config.kind}/${buildId(config.kind, item)}`);

			const preview = (item: T) =>
				m('div.entity-preview.flex-shrink-0', [
					m('div.entity-preview-image', {
						style: {
							backgroundImage: `url("/api/preview-image/${buildId(config.kind, item)}")`,
						},
					}),
					m('div.entity-preview-fade'),
				]);

			const dataTable = () =>
				m(`div.mb3.pr3.${entityListStyle}`, { style: { marginRight: '250px' } }, [
					filteredItems().length === 0
						? m('div.bg-white.ba.b--black-10.br2.pa4.tc.text-muted.f7', `No ${config.countLabel} found.`)
						: m(
								'div.flex.flex-column.flex-gap-2',
								filteredItems().map((item) =>
									m(
										'div.entity-list-row.pointer',
										{
											key: buildId(config.kind, item),
											onclick: () => openEntity(item),
											onmouseover: () => (hovered = item),
											onmouseout: () => (hovered = null),
										},
										[
											preview(item),
											m('div.min-w-0', [
												m('div.f5.b.lh-title.mb2.truncate', item.name),
												m('div.f8.text-muted', [m('span.mr1', 'by'), m(AuthorTag, { author: item.author })]),
											]),
											m('div.entity-description.f7.text-muted', item.description || 'No description provided.'),
											m(
												'div',
												{
													onclick: (event: MouseEvent) => event.stopPropagation(),
												},
												m(IconButton, { intend: 'link', icon: 'arrow-round-forward', onClick: () => openEntity(item) }, 'Open'),
											),
										],
									),
								),
							),
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
