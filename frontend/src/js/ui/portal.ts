import m from 'mithril';

import Flex from 'js/ui/components/flex';

// Portal element target
const target = document.getElementById('portal');
if (target === null) {
	throw new Error('Could not find portal target');
}

type Component = m.Component | (() => m.Component);

type SetPortalOptions = {
	className?: string;
	justify?: 'start' | 'center' | 'end';
	items?: 'start' | 'center' | 'end';
};

let currentPortalOptions: SetPortalOptions = {};
let currentPortal: Component | null = null;

m.mount(target, {
	view(vnode) {
		if (currentPortal === null) {
			return null;
		}

		return m(
			'div.absolute.w-100.h-100.bg-white-60.z-999',
			m(
				Flex,
				{
					items: currentPortalOptions.items ?? 'center',
					justify: currentPortalOptions.justify ?? 'center',
					className: `.h-100${currentPortalOptions.className ?? ''}`,
				},
				m(currentPortal)
			)
		);
	},
});

/**
 * Sets a portal element that overlays the entire screen. Can be used for modals and other overlays.
 * @param portal The portal content.
 * @param options Portal options.
 */
export const setPortal = (portal: Component | null, options?: SetPortalOptions) => {
	currentPortalOptions = options ?? {};
	currentPortal = portal;
	m.redraw();
};

/**
 * Clears the portal element.
 */
export const clearPortal = () => {
	currentPortal = null;
	m.redraw();
};

/**
 * Returns true if a portal is currently set.
 */
export const hasPortal = () => {
	return currentPortal !== null;
};
