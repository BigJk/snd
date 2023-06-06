import m from 'mithril';

import Flex from 'js/ui/components/flex';

// Portal element target
const target = document.getElementById('portal');
if (target === null) {
	throw new Error('Could not find portal target');
}

type SetPortalOptions = {
	className?: string;
	justify?: 'start' | 'center' | 'end';
	items?: 'start' | 'center' | 'end';
};

let currentPortalOptions: SetPortalOptions = {};
let currentPortal: m.Children | null = null;

m.mount(target, {
	view(vnode) {
		if (currentPortal === null) {
			return null;
		}

		return m(
			'div.absolute.w-100.h-100.bg-white-50.z-999',
			m(
				Flex,
				{
					items: currentPortalOptions.items ?? 'center',
					justify: currentPortalOptions.justify ?? 'center',
					className: `.h-100${currentPortalOptions.className}`,
				},
				currentPortal
			)
		);
	},
});

export const setPortal = (portal: m.Children | null, options?: SetPortalOptions) => {
	currentPortalOptions = options ?? {};
	currentPortal = portal;
	m.redraw();
};

export const clearPortal = () => {
	currentPortal = null;
	m.redraw();
};
