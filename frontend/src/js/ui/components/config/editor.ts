import m from 'mithril';

import { isEqual } from 'lodash-es';

import { css } from 'goober';

import Types from './types';

import { ConfigValue, fillConfigValues } from 'js/types/config';

import HorizontalProperty from 'js/ui/components/horizontal-property';
import Flex from 'js/ui/components/layout/flex';

const containerClass = css`
	max-width: 1000px;
`;

type ConfigEditorProps = {
	className?: string;
	definition: ConfigValue[];
	current: any;
	onChange: (config: any) => void;
};

export default (): m.Component<ConfigEditorProps> => ({
	oninit({ attrs }) {
		const config = fillConfigValues(attrs.current, attrs.definition);
		if (!isEqual(config, attrs.current)) {
			attrs.onChange(config);
		}
	},
	view({ attrs }) {
		return m(
			Flex,
			{ justify: 'center', className: `.w-100.ph3${attrs.className ?? ''}` },
			m(
				`div.w-100.${containerClass}`,
				attrs.definition.map((config) => {
					const value = attrs.current[config.key];
					const type = (Types as any)[config.type];
					if (!type) {
						return null;
					}

					return m(
						HorizontalProperty,
						{
							label: config.name,
							description: config.description,
							centered: true,
							bottomBorder: true,
						},
						m(type.view, {
							value,
							onChange: (value: any) => {
								attrs.onChange({
									...attrs.current,
									[config.key]: value,
								});
							},
						}),
					);
				}),
			),
		);
	},
});
