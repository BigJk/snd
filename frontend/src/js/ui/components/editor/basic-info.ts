import m from 'mithril';

import BasicInfo from 'js/types/basic-info';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';
import PropertyEdit, { type PropertyAnnotation } from 'js/ui/components/view-layout/property-edit';
import EditorHeader from 'js/ui/components/view-layout/property-header';

import { author, slug } from 'js/ui/validator';

export type BasicInfoProps<T> = {
	className?: string;
	info: BasicInfo & T;
	extendedAnnotations?: Record<string, PropertyAnnotation>;
	onChange?: (info: BasicInfo & T) => void;
	hide?: string[];
	hideHeader?: boolean;
	hidePreview?: boolean;
};

/**
 * Basic info component: Basic information about the template, generator...
 */
export default <T extends Object>(): m.Component<BasicInfoProps<T>> => ({
	view({ attrs }) {
		const onChange = (info: BasicInfo & T) => {
			if (attrs.onChange) attrs.onChange(info);
		};

		return m(
			Flex,
			{ className: `.w-100.ph3${attrs.className}`, direction: 'column', items: 'center' },
			m('div.w-100.lh-copy', [
				attrs.hideHeader ? null : m(EditorHeader, { title: 'Basic Info', description: 'These are the basic information about your new creation' }),
				m(PropertyEdit<BasicInfo & T>, {
					properties: attrs.info,
					onChange: onChange,
					show: ['name', 'description', 'author', 'slug'].filter((p) => !attrs.hide?.includes(p)),
					annotations: {
						name: {
							label: 'Name',
							description: 'This will be the display name',
						},
						description: {
							label: 'Description',
							description: 'This will be the displayed description',
							largeInput: true,
							fullSize: true,
						},
						author: {
							label: 'Author',
							validator: author,
							description: 'The username of the author',
						},
						slug: {
							label: 'Slug',
							description: "A identifier only containing alphanumerical characters and '-'",
							validator: slug,
						},
						...attrs.extendedAnnotations,
					},
				}),
				//
				// Name and slug preview
				attrs.hidePreview
					? null
					: m(Flex, { className: '.mt3', items: 'center' }, [
							m(Icon, { icon: 'arrow-forward', size: 3, className: '.o-50.mh3' }),
							m('div.pa2.w5.bg-white.ba.b--black-10', [
								m('div.f6', attrs.info.name), //
								m('div.f8.text-muted', `${attrs.info.author}/${attrs.info.slug}`),
							]),
					  ]),
			]),
		);
	},
});
