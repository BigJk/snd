import m from 'mithril';

import { css } from 'goober';

import guid from 'js/core/guid';

import EditorHeader from 'js/ui/components/editor/header';
import ImageUpload from 'js/ui/components/image-upload';
import Flex from 'js/ui/components/layout/flex';

const containerClass = css`
	max-width: 800px;
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
					m(EditorHeader, { title: 'Images', description: 'TUpload images that will be embedded' }), //
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
