import m from 'mithril';
import { map } from 'lodash-es';

import Checkbox from 'js/ui/shoelace/checkbox';
import IconButton from 'js/ui/shoelace/icon-button';
import Input from 'js/ui/shoelace/input';
import TextArea from 'js/ui/shoelace/text-area';

import Icon from 'js/ui/components/atomic/icon';
import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';

export type PropertyAnnotation = {
	label?: string;
	description?: string;
	arrayType?: 'string' | 'number';
	validator?: (value: any) => any;
	largeInput?: boolean;
	fullSize?: boolean;
	customComponent?: m.Children;
};

export type PropertyEditProps<T> = {
	className?: string;
	properties: T;
	annotations?: Record<string, PropertyAnnotation>;
	onChange?: (properties: T) => void;
	hide?: string[];
	show?: string[];
};

/**
 * Basic info component: Basic information about the template, generator...
 */
export default <T extends Object>(): m.Component<PropertyEditProps<T>> => ({
	view({ attrs }) {
		const onChange = (property: T) => {
			if (attrs.onChange) attrs.onChange(property);
		};

		return m(
			Flex,
			{ className: '.w-100', direction: 'column', items: 'center' },
			m(`div.w-100.lh-copy`, [
				...map(attrs.properties, (value, key) => {
					// Only show properties that are in the show array
					if (attrs.show && !attrs.show.includes(key)) return null;

					// Skip hidden properties
					if (attrs.hide && attrs.hide.includes(key)) return null;

					let label = key;
					let description = '';
					let largeInput = false;
					let fullSize = false;
					let validator = (value: any) => value;

					// Check if the property has an annotation
					if (attrs.annotations) {
						let annotation = attrs.annotations[key];

						if (annotation) {
							label = attrs.annotations[key].label ?? key;
							description = attrs.annotations[key].description ?? '';
							largeInput = attrs.annotations[key].largeInput ?? false;
							fullSize = attrs.annotations[key].fullSize ?? false;
							validator = attrs.annotations[key].validator ?? validator;

							if (annotation.customComponent) {
								return m(
									HorizontalProperty,
									{ label: label, description: description, bottomBorder: true, centered: true, fullSize: fullSize },
									attrs.annotations[key].customComponent,
								);
							}
						}
					}

					switch (typeof value) {
						case 'string':
							if (!largeInput) {
								return m(
									HorizontalProperty,
									{ label: label, description: description, bottomBorder: true, centered: true },
									m(Input, { value: value.toString(), onChange: (value) => onChange({ ...attrs.properties, [key]: validator(value) }) }),
								);
							}

							return m(
								HorizontalProperty,
								{ label: label, description: description, bottomBorder: true, centered: false, fullSize: fullSize },
								m(TextArea, {
									rows: fullSize ? 5 : 3,
									value: value.toString(),
									onChange: (value) => onChange({ ...attrs.properties, [key]: validator(value) }),
								}),
							);
						case 'number':
							return m(
								HorizontalProperty,
								{ label: label, description: description, bottomBorder: true, centered: true },
								m(Input, {
									value: value.toString(),
									useBlur: true,
									onChange: (value) => onChange({ ...attrs.properties, [key]: parseInt(validator(value)) }),
								}),
							);
						case 'boolean':
							return m(
								HorizontalProperty,
								{ label: label, description: description, bottomBorder: true, centered: true },
								m(Checkbox, { checked: value, onChange: (checked) => onChange({ ...attrs.properties, [key]: checked }) }),
							);
						case 'object':
							let addButton = m(
								Flex,
								{ justify: 'end' },
								m(
									IconButton,
									{
										icon: 'add',
										intend: 'link',
										size: 'sm',
										onClick: () => {
											// @ts-ignore
											let newArray = value ? [...value] : []; // TODO: Investigate why typescript is complaining about this
											switch (attrs.annotations?.[key]?.arrayType) {
												case 'string':
													newArray.push('');
													break;
												case 'number':
													newArray.push(0);
													break;
											}

											onChange({ ...attrs.properties, [key]: newArray });
										},
									},
									'Add',
								),
							);

							if (value != null && !Array.isArray(value)) return addButton;

							return m(
								HorizontalProperty,
								{ label: label, description: description, bottomBorder: true, centered: false },
								m('div', [
									(value ?? []).map((item, index) =>
										m(Flex, { items: 'center', className: '.mb2' }, [
											m(Input, {
												className: '.w-100',
												value: item.toString(),
												onChange: (text) => {
													// @ts-ignore
													let newArray = [...value];
													newArray[index] = validator(text);
													onChange({ ...attrs.properties, [key]: newArray });
												},
												suffix: m(Icon, {
													className: '.mr2.col-error',
													icon: 'trash',
													onClick: () => {
														// @ts-ignore
														let newArray = [...value];
														newArray.splice(index, 1);
														onChange({ ...attrs.properties, [key]: newArray });
													},
												}),
											}),
										]),
									),
									addButton,
								]),
							);
					}
				}),
			]),
		);
	},
});
