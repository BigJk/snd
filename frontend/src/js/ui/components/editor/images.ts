import m from 'mithril';
import { map } from 'lodash-es';

import { css } from 'goober';

import Icon from 'js/ui/components/atomic/icon';
import ImageUpload from 'js/ui/components/image-upload';
import Flex from 'js/ui/components/layout/flex';
import EditorHeader from 'js/ui/components/view-layout/property-header';

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
export default (): m.Component<ImagesProps> => ({
	view({ attrs }) {
		return m(
			Flex,
			{ className: '.w-100', direction: 'column', items: 'center' },
			m(`div.w-100.lh-copy`, [
				m(EditorHeader, { title: 'Images', description: 'Upload images that will be embedded' }), //
				m(ImageUpload, {
					height: 150,
					className: '.mb3',
					multiple: true,
					onUpload: (entries) => {
						if (!attrs.onChange) return;

						Promise.all(
							entries.map((entry) =>
								m
									.request({
										url: `/api/image-cache`,
										method: 'POST',
										body: entry.base,
									})
									.then(() => entry),
							),
						).then((done) => {
							if (!attrs.onChange) return;
							const added = Object.fromEntries(done.map((e) => [e.name, e.base]));
							attrs.onChange({ ...attrs.images, ...added });
						});
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
								'Remove',
							),
						]),
					]);
				}),
			]),
		);
	},
});
