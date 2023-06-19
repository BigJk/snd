import m from 'mithril';

import { map } from 'lodash-es';

import { css } from 'goober';

import guid from 'js/core/guid';

import Button from 'js/ui/spectre/button';

import Icon from 'js/ui/components/atomic/icon';
import ImageUpload from 'js/ui/components/image-upload';
import Flex from 'js/ui/components/layout/flex';
import EditorHeader from 'js/ui/components/view-layout/property-header';

const containerClass = css`
	max-width: 800px;
`;

const imageClass = css`
	max-width: 80px;
`;

export type ImagesProps = {
	images: Record<string, string>;
	onChange?: (images: Record<string, string>) => void;
};

/**
 * Images component: Upload of images for the editor.
 */
export default (): m.Component<ImagesProps> => {
	let id = guid();

	return {
		view({ attrs }) {
			return m(
				Flex,
				{ className: '.w-100', direction: 'column', items: 'center' },
				m(`div.w-100.lh-copy.ph3.${containerClass}`, [
					m(EditorHeader, { title: 'Images', description: 'Upload images that will be embedded' }), //
					m(ImageUpload, {
						height: 150,
						className: '.mb3',
						onUpload: (name, image) => {
							if (!attrs.onChange) return;
							attrs.onChange({ ...attrs.images, [name]: image });
						},
					}),
					...map(attrs.images, (image, key) => {
						let fileSizeInKb = (Math.ceil(image.length / 4) * 3) / 1000;

						return m(Flex, { className: '.mb3.pb3.bb.b--black-05', items: 'center' }, [
							m(`img.br2.mr2.w-100.${imageClass}`, { src: image, alt: key }), //
							m(Flex, { justify: 'between', items: 'center', className: '.w-100' }, [
								m('div', [m('div.f6.fw5', key), m('div.f7.text-muted', `~${fileSizeInKb} KB`)]), //
								m(
									Icon,
									{
										icon: 'trash',
										size: 4,
										className: '.col-error',
										onClick: () => {
											if (!attrs.onChange) return;
											const images = { ...attrs.images };
											delete images[key];
											attrs.onChange(images);
										},
									},
									'Remove'
								),
							]),
						]);
					}),
				])
			);
		},
	};
};
