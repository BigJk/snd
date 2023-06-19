import m from 'mithril';

import { map } from 'lodash-es';

import { css } from 'goober';

import Checkbox from 'js/ui/spectre/checkbox';
import Input from 'js/ui/spectre/input';
import TextArea from 'js/ui/spectre/text-area';

import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';

export type PropertyAnnotation = {
	label?: string;
	description?: string;
	validator?: (value: any) => any;
	largeInput?: boolean;
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
export default <T extends Object>(): m.Component<PropertyEditProps<T>> => {
	return {
		view({ attrs }) {
			const onChange = (property: T) => {
				if (attrs.onChange) attrs.onChange(property);
			};

			return m(
				Flex,
				{ className: '.w-100', direction: 'column', items: 'center' },
				m(`div.w-100.lh-copy`, [
					...map(attrs.properties, (value, key) => {
						if (attrs.show && !attrs.show.includes(key)) return null;
						if (attrs.hide && attrs.hide.includes(key)) return null;

						let label = key;
						let description = '';
						let largeInput = false;
						let validator = (value: any) => value;

						if (attrs.annotations) {
							let annotation = attrs.annotations[key];

							if (annotation) {
								label = attrs.annotations[key].label ?? key;
								description = attrs.annotations[key].description ?? '';
								largeInput = attrs.annotations[key].largeInput ?? false;
								validator = attrs.annotations[key].validator ?? validator;

								if (annotation.customComponent) {
									return m(
										HorizontalProperty,
										{ label: label, description: description, bottomBorder: true, centered: true },
										attrs.annotations[key].customComponent
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
										m(Input, { value: value.toString(), onChange: (value) => onChange({ ...attrs.properties, [key]: validator(value) }) })
									);
								}

								return m(
									HorizontalProperty,
									{ label: label, description: description, bottomBorder: true, centered: false },
									m(TextArea, { value: value.toString(), onChange: (value) => onChange({ ...attrs.properties, [key]: validator(value) }) })
								);
							case 'number':
								return m(
									HorizontalProperty,
									{ label: label, description: description, bottomBorder: true, centered: true },
									m(Input, {
										value: value.toString(),
										useBlur: true,
										onChange: (value) => onChange({ ...attrs.properties, [key]: parseInt(validator(value)) }),
									})
								);
							case 'boolean':
								return m(
									HorizontalProperty,
									{ label: label, description: description, bottomBorder: true, centered: true },
									m(Checkbox, { checked: value, onChange: (checked) => onChange({ ...attrs.properties, [key]: checked }) })
								);
						}
					}),
				])
			);
		},
	};
};
