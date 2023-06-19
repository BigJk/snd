import m from 'mithril';

import { css } from 'goober';

import BasicInfo from 'js/types/basic-info';
import EditorHeader from 'js/ui/components/view-layout/property-header'

import type {PropertyAnnotation} from "js/ui/components/view-layout/property-edit";
import PropertyEdit from "js/ui/components/view-layout/property-edit";
import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

import { author, slug } from 'js/ui/validator';

export type BasicInfoProps<T> = {
	className?: string;
	info: BasicInfo & T;
	extendedAnnotations?: Record<string, PropertyAnnotation>;
	onChange?: (info: BasicInfo & T) => void;
	hide?: string[];
};

const containerClass = css`
	max-width: 800px;
`;

/**
 * Basic info component: Basic information about the template, generator...
 */
export default <T extends Object>(): m.Component<BasicInfoProps<T>> => {
	return {
		view({ attrs }) {
			const onChange = (info: BasicInfo & T) => {
				if (attrs.onChange) attrs.onChange(info);
			};

			return m(
				Flex,
				{ className: '.w-100.ph3', direction: 'column', items: 'center' },
				m(`div.w-100.lh-copy.${containerClass}`, [
					m(EditorHeader, { title: 'Basic Info', description: 'These are the basic information about your new creation' }),
					m(PropertyEdit<BasicInfo & T>, {
						properties: attrs.info,
						onChange: onChange,
						hide: ['version'],
						annotations: {
							'name': {
								label: 'Name',
								description: 'This will be the display name',
							},
							'description': {
								label: 'Description',
								description: 'This will be the displayed description',
								largeInput: true,
							},
							'author': {
								label: 'Author',
								validator: author,
								description: 'The username of the author',
							},
							'slug': {
								label: 'Slug',
								description: "A identifier only containing alphanumerical characters and '-'",
								validator: slug,
							},
							...attrs.extendedAnnotations,
						}
					}),
					//
					// Name and slug preview
					m(Flex, { className: '.mt3', items: 'center' }, [
						m(Icon, { icon: 'arrow-forward', size: 3, className: '.o-50.mh3' }),
						m('div.pa2.w5.bg-white.ba.b--black-10', [
							m('div.f6', attrs.info.name), //
							m('div.f8.text-muted', `${attrs.info.author}/${attrs.info.slug}`),
						]),
					]),
				])
			);
		},
	};
};
