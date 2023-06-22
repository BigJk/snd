import m from 'mithril';

import Flex from 'js/ui/components/layout/flex';

// Portal element target
const target = document.getElementById('portal');
if (target === null) {
	throw new Error('Could not find portal target');
}

type Component = m.Component | (() => m.Component);

type SetPortalOptions<T> = {
	className?: string;
	justify?: 'start' | 'center' | 'end';
	items?: 'start' | 'center' | 'end';
	attributes?: T;
};

let currentPortalOptions: any = {};
let currentPortal: any | null = null;

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
				m(currentPortal, currentPortalOptions.attributes ?? {})
			)
		);
	},
});

/**
 * Sets a portal element that overlays the entire screen. Can be used for modals and other overlays.
 * @param portal The portal content.
 * @param options Portal options.
 */
export const setPortal = <T>(portal: (() => m.Component<T>) | null, options?: SetPortalOptions<T>) => {
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
