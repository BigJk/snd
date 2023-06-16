import m from 'mithril';

import { createNunjucksCompletionProvider } from 'js/core/monaco/completion-nunjucks';

import IconButton from 'js/ui/spectre/icon-button';

import Base from 'js/ui/components/base';
import Breadcrumbs from 'js/ui/components/breadcrumbs';
import Flex from 'js/ui/components/flex';
import Monaco from 'js/ui/components/monaco';
import SideMenu from 'js/ui/components/side-menu';

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
				m(Flex, { className: '.overflow-auto.h-100' }, [
					m(
						'div.br.b--black-10.flex-shrink-0.pa2',
						m(SideMenu, {
							items: [
								{ title: 'Basic Info', icon: 'clipboard' }, //
								{ title: 'Images', icon: 'images' },
								{ title: 'Data Sources', icon: 'analytics' },
								{ title: 'Global Config', icon: 'cog' },
								{ title: 'Data Skeleton', icon: 'body' },
								{ title: 'Print Template', icon: 'code-working', active: true },
								{ title: 'List Template', icon: 'code-working' },
							],
						})
					),
					m(Monaco, { language: 'html', value: '', className: '.flex-grow-1', completion: createNunjucksCompletionProvider(testState) }),
				])
			);
		},
	};
};
