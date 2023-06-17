import m from 'mithril';

import { css } from 'goober';

import guid from 'js/core/guid';

import Flex from 'js/ui/components/flex';
import ImageUpload from 'js/ui/components/image-upload';

const containerClass = css`
	max-width: 800px;
`;

type ImagesProps = {
	images: Record<string, string>;
	onChange?: (images: Record<string, string>) => void;
};

export default (): m.Component<ImagesProps> => {
	let id = guid();

	return {
		view({ attrs }) {
			return m(
				Flex,
				{ className: '.w-100', direction: 'column', items: 'center' },
				m(`div.w-100.lh-copy.ph3.${containerClass}`, [
					m('div.f4.pt3', 'Images'), //
					m('div.f7.text-muted.mb3', 'Upload images that will be embedded'),
					m(ImageUpload, {
						height: 150,
						onUpload: (image) => {
							if (!attrs.onChange) return;
							attrs.onChange({ ...attrs.images, [id]: image });
						},
					}),
				])
			);
		},
	};
};
