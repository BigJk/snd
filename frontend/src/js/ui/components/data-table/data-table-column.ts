import m from 'mithril';
import { capitalize } from 'lodash-es';

export type DataTableColumn<T> = {
	field?: keyof T;
	customID?: string;
	width?: string;
	header?: string;
	render?: (parent: T) => m.Children;
	noBorder?: boolean;
};

export function isCustomID<T>(column: DataTableColumn<T>): column is DataTableColumn<T> & { customID: string } {
	return !!(column as { customID: string }).customID;
}

export function isField<T>(column: DataTableColumn<T>): column is DataTableColumn<T> & { field: keyof T } {
	return !!(column as { field: keyof T }).field;
}

export function isValidColumn<T>(column: DataTableColumn<T>): boolean {
	return isCustomID(column) || isField(column);
}

export function getHeader<T>(column: DataTableColumn<T>): string {
	if (column.header) {
		return column.header;
	}

	if (isCustomID(column)) {
		return capitalize(column.customID);
	}

	if (isField(column)) {
		return capitalize(column.field as string);
	}

	throw new Error('should not reach here');
}

function defaultRender<T>(column: DataTableColumn<T>): (parent: T) => m.Children {
	return (parent: T) => {
		if (isCustomID(column) && !column.render) {
			throw new Error(`Custom column ${column.customID} must have a render function`);
		}

		if (isField(column) && !column.render) {
			const value = parent[column.field];
			switch (typeof value) {
				case 'string':
				case 'number':
				case 'boolean':
					return value.toString();
				case 'object':
					if (Array.isArray(value)) {
						return value.join(', ');
					} else {
						return JSON.stringify(value, null, 2);
					}
				default:
					throw new Error(`Unsupported field type ${typeof value}`);
			}
		}

		throw new Error('should not reach here');
	};
}

export function getRenderable<T>(column: DataTableColumn<T>, parent: T): m.Children {
	return column.render ? column.render(parent) : defaultRender(column)(parent);
}
