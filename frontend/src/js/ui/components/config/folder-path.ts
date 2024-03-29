import m from 'mithril';

import Button from 'js/ui/shoelace/button';

import Config, { ConfigProps } from 'js/ui/components/config/config';
import { openFileModal } from 'js/ui/components/modals/file-browser';

export default {
	name: 'FilePath',
	default: () => false,
	view: (): m.Component<ConfigProps> => {
		const showEndOfPath = (path: string) => {
			if (path.length < 25) {
				return path;
			}
			return '...' + path.slice(path.length - 25);
		};

		return {
			view: ({ attrs }) =>
				m(
					Button,
					{
						className: '.fr',
						intend: 'primary',
						onClick: () => {
							openFileModal('Select a folder', [], true).then((path: string) => {
								attrs.onChange(path);
							});
						},
					},
					!attrs.value || attrs.value.length === 0 ? 'Select Folder' : showEndOfPath(attrs.value),
				),
		};
	},
} as Config;
