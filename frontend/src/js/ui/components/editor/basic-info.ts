import m from 'mithril';

import { css } from 'goober';

import BasicInfo from 'js/types/basic-info';

import Input from 'js/ui/spectre/input';
import TextArea from 'js/ui/spectre/text-area';

import Flex from 'js/ui/components/flex';
import HorizontalProperty from 'js/ui/components/horizontal-property';

import { author, slug } from 'js/ui/validator';

type BasicInfoProps = {
	className?: string;
	info: BasicInfo;
	onChange?: (info: BasicInfo) => void;
};

const containerClass = css`
	max-width: 800px;
`;

export default (): m.Component<BasicInfoProps> => {
	return {
		view({ attrs }) {
			const onChange = (info: BasicInfo) => {
				if (attrs.onChange) attrs.onChange(info);
			};

			return m(
				Flex,
				{ className: '.w-100.ph3', direction: 'column', items: 'center' },
				m(`div.w-100.lh-copy.${containerClass}`, [
					m('div.f4.pt3', 'Basic Info'),
					m('div.f7.text-muted.mb3', 'These are the basic information about your new creation'),
					//
					// Name
					m(
						HorizontalProperty,
						{ label: 'Name', description: 'This will be the display name', bottomBorder: true, centered: true },
						m(Input, { value: attrs.info.name, onChange: (value) => onChange({ ...attrs.info, name: value }) })
					),
					//
					// Description
					m(
						HorizontalProperty,
						{ label: 'Description', description: 'This will be the displayed description', bottomBorder: true },
						m(TextArea, { value: attrs.info.description, rows: 5, onChange: (value) => onChange({ ...attrs.info, description: value }) })
					),
					//
					// Author
					m(
						HorizontalProperty,
						{ label: 'Author', description: 'The username of the author', bottomBorder: true, centered: true },
						m(Input, { value: attrs.info.author, onChange: (value) => onChange({ ...attrs.info, author: author(value) }) })
					),
					//
					// Slug
					m(
						HorizontalProperty,
						{ label: 'Slug', description: "A identifier only containing alphanumerical characters and '-'", bottomBorder: true, centered: true },
						m(Input, { value: attrs.info.slug, onChange: (value) => onChange({ ...attrs.info, slug: slug(value) }) })
					),
				])
			);
		},
	};
};
