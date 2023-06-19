import m from 'mithril';

import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';

import IconButton from 'js/ui/spectre/icon-button';

import BasicInfo from 'js/ui/components/editor/basic-info';
import Images from 'js/ui/components/editor/images';
import Monaco from 'js/ui/components/monaco';
import Base from 'js/ui/components/view-layout/base';
import Breadcrumbs from 'js/ui/components/view-layout/breadcrumbs';
import SideMenuPager from 'js/ui/components/view-layout/side-menu-pager';

let testState = {
	it: {
		hello: 'world',
		num: 123,
	},
	other: 'test',
	other2: {
		array: [1, 2, 3],
	},
};

let images = {};

export default (): m.Component => {
	return {
		view(vnode) {
			return m(
				Base,
				{
					title: m(Breadcrumbs, {
						confirm: true,
						items: [{ link: '/templates', label: 'Templates' }, { label: 'Create Template' }],
					}),
					rightElement: [
						m(IconButton, { icon: 'add', size: 'sm', intend: 'success' }, 'Save'), //
					],
					active: 'templates',
					classNameContainer: '',
				},
				m(SideMenuPager, {
					items: [
						{
							title: 'Basic Info',
							icon: 'clipboard',
							render: () => m(BasicInfo, { info: { name: 'Test', author: 'Test123', slug: 'asdasd', description: 'asdasd', version: ' ' } }),
						}, //
						{ title: 'Images', icon: 'images', render: () => m(Images, { images: images, onChange: (updated) => (images = updated) }) },
						{ title: 'Data Sources', icon: 'analytics', render: () => null },
						{ title: 'Global Config', icon: 'cog', render: () => null },
						{ title: 'Data Skeleton', icon: 'body', render: () => null },
						{
							title: 'Print Template',
							icon: 'code-working',
							render: () =>
								m(Monaco, { language: 'html', value: '', className: '.flex-grow-1', completion: createNunjucksCompletionProvider(testState) }),
						},
						{ title: 'List Template', icon: 'code-working', render: () => null },
					],
				})
			);
		},
	};
};
