import m from 'mithril';

import Template from 'js/types/template';

import IconButton from 'js/ui/spectre/icon-button';

import Title from 'js/ui/components/atomic/title';
import Base from 'js/ui/components/view-layout/base';

type SingleTemplateProps = {
	id: string;
};

export default (): m.Component<SingleTemplateProps> => {
	let state: Template | null = null;

	return {
		view({ attrs }) {
			return m(
				Base,
				{
					title: m(Title, 'Template'),
					active: 'templates',
					classNameContainer: '.pa3',
					rightElement: [
						m(IconButton, { icon: 'create', size: 'sm', intend: 'primary', onClick: () => m.route.set(`/template/${attrs.id}/edit`) }, 'Edit'),
					],
				},
				null
			);
		},
	};
};
