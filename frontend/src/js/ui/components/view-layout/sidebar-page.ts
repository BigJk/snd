import m from 'mithril';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';

type TabDefinition = {
	icon: string;
	label: string;
};

type SidebarProps = {
	tabs: TabDefinition[];
	content: Record<string, () => m.Component>;
};

export default (): m.Component<SidebarProps> => {
	let selectedTab: string = '';

	const leftElement = (icon: string, label: string, active: boolean, onClick: () => void) =>
		m(Tooltip, { content: label, placement: 'right' }, [m(Icon, { icon, size: 5, onClick, className: active ? '.text-primary' : '' })]);

	return {
		oninit: ({ attrs }) => {
			selectedTab = attrs.tabs[0].label;
		},
		view: ({ attrs, children }) =>
			m(Flex, { className: '.flex-gap-3.h-100' }, [
				attrs.tabs.length > 1
					? m(
							'div.flex-shrink-0',
							m(Flex, { direction: 'column', className: '.pa2.bg-white.ba.b--black-10.br2.flex-gap-3' }, [
								...attrs.tabs.map((tab) => {
									if (!tab) {
										return null;
									}
									return leftElement(tab.icon, tab.label, selectedTab === tab.label, () => (selectedTab = tab.label));
								}),
							]),
					  )
					: null, //
				// @ts-ignore
				m(Flex, { className: '.bg-white.ba.b--black-10.br2.flex-grow-1.overflow-auto', direction: 'column' }, attrs.content[selectedTab]()),
				// Content
				children,
			]),
	};
};
