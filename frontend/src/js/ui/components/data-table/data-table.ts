import m from 'mithril';

import { DataTableColumn, getHeader, getRenderable } from './data-table-column';

import Flex from 'js/ui/components/layout/flex';
import Grid from 'js/ui/components/layout/grid';

type DataTableProps<T> = {
	data: T[];
	columns: DataTableColumn<T>[];
	items?: 'start' | 'center' | 'end';
	justify?: 'start' | 'center' | 'end' | 'between';
};

const HEADER_CLASSES = '.b.bb.bg-dark-muted-05.b--black-10.pa2.f8';
const ROW_CLASSES = '.pa2.bg-white';

const TOP_RIGHT_BORDER = { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 0 };
const TOP_LEFT_BORDER = { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopRightRadius: 0 };
const BOTTOM_RIGHT_BORDER = { borderBottomLeftRadius: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 };
const BOTTOM_LEFT_BORDER = { borderBottomRightRadius: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 };

export default <T>(): m.Component<DataTableProps<T>> => {
	let state = 0;

	const getBorderRadiusHeader = (columns: DataTableColumn<T>[], columnIndex: number, needEndFix: boolean) => {
		if (columnIndex === 0) {
			return { style: TOP_LEFT_BORDER, className: '.br2' };
		} else if (!needEndFix && columnIndex === columns.length - 1) {
			return { style: TOP_RIGHT_BORDER, className: '.br2' };
		}
		return {};
	};

	const getBorderRadiusLastRow = (columns: DataTableColumn<T>[], columnIndex: number, needEndFix: boolean) => {
		if (columnIndex === 0) {
			return { style: BOTTOM_LEFT_BORDER, className: '.br2' };
		} else if (!needEndFix && columnIndex === columns.length - 1) {
			return { style: BOTTOM_RIGHT_BORDER, className: '.br2' };
		}
		return {};
	};

	const getRightBorder = (columns: DataTableColumn<T>[], columnIndex: number) =>
		columnIndex !== columns.length - 1 && !columns[columnIndex]?.noBorder ? '.br.b--black-10' : '';

	return {
		view: ({ attrs }) => {
			const columns = attrs.columns.map((c) => c.width ?? '1fr');
			const needEndFix = !columns.some((c) => c.endsWith('fr'));
			if (needEndFix) {
				columns.push('1fr');
			}

			return m('div.ba.br2.b--black-10.bg-white', [
				m(Grid, { columns: columns.join(' '), gap: -1 }, [
					// Header
					attrs.columns.map((column, i) => {
						const border = getRightBorder(attrs.columns, i);
						return m(`div${HEADER_CLASSES}${border}`, { style: getBorderRadiusHeader(attrs.columns, i, needEndFix) }, getHeader(column));
					}),
					needEndFix ? m(`div${HEADER_CLASSES}.br2`, { style: TOP_LEFT_BORDER }) : null,

					attrs.data.length === 0
						? m(
								'div.text-muted.f8.pa3.tc',
								{
									style: {
										gridColumn: `1 / ${attrs.columns.length + 1}`,
									},
								},
								'Nothing found...',
							)
						: null,

					// Body
					attrs.data.map((row, rowIndex) => [
						attrs.columns.map((column, i) => {
							const border = getRightBorder(attrs.columns, i);
							const borderBottom = rowIndex !== attrs.data.length - 1 ? '.bb.b--black-10' : '';
							const borderRadius = rowIndex === attrs.data.length - 1 ? getBorderRadiusLastRow(attrs.columns, i, needEndFix) : {};
							return m(
								Flex,
								{
									className: `${ROW_CLASSES}${border}${borderBottom}${borderRadius.className ?? ''}`,
									style: borderRadius.style ?? {},
									justify: attrs.justify,
									items: attrs.items,
								},
								getRenderable(column, row),
							);
						}),
						needEndFix
							? m(`div${ROW_CLASSES}${rowIndex === attrs.data.length - 1 ? '.br2' : ''}`, {
									style: rowIndex === attrs.data.length - 1 ? BOTTOM_RIGHT_BORDER : {},
								})
							: null,
					]),
				]),
			]);
		},
	};
};
