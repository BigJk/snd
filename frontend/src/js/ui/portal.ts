import m from 'mithril';

import Flex from 'js/ui/components/layout/flex';

// Portal element target
const target = document.getElementById('portal');
if (target === null) {
	throw new Error('Could not find portal target');
}

type SetPortalOptions<T> = {
	/**
	 * Additional class name to apply to the portal container.
	 */
	className?: string;
	/**
	 * Flex items justification.
	 */
	justify?: 'start' | 'center' | 'end';
	/**
	 * Flex items alignment.
	 */
	items?: 'start' | 'center' | 'end';
	/**
	 * Attributes to pass to the portal component.
	 */
	attributes?: T;
};

type PortalState = {
	portal: any | null;
	portalOptions: any;
};

let portalStack: PortalState[] = [];

m.mount(target, {
	view(vnode) {
		if (portalStack.length === 0) {
			return null;
		}

		return portalStack.map((p, i) =>
			m(
				`div.absolute.w-100.h-100.bg-white-60.z-999.overflow-hidden.pa4${i !== portalStack.length - 1 ? '.dn' : ''}`,
				m(
					Flex,
					{
						items: p.portalOptions.items ?? 'center',
						justify: p.portalOptions.justify ?? 'center',
						className: `.h-100${p.portalOptions.className ?? ''}`,
					},
					m(p.portal, p.portalOptions.attributes ?? {}),
				),
			),
		);
	},
});

/**
 * Sets a portal element that overlays the entire screen. Can be used for modals and other overlays.
 * @param portal The portal content.
 * @param options Portal options.
 */
export const pushPortal = <T>(portal: (() => m.Component<T>) | null, options?: SetPortalOptions<T>) => {
	portalStack.push({
		portal: portal,
		portalOptions: options ?? {},
	});
	m.redraw();
};

/**
 * Sets a portal element that overlays the entire screen. Can be used for modals and other overlays.
 * @param portal The portal content.
 * @param options Portal options.
 */
export const setPortal = <T>(portal: (() => m.Component<T>) | null, options?: SetPortalOptions<T>) => {
	portalStack = [];
	pushPortal(portal, options);
};

/**
 * Removes the current portal element.
 */
export const popPortal = () => {
	portalStack.pop();
	m.redraw();
};

/**
 * Clears the portal element.
 */
export const clearPortal = () => {
	portalStack = [];
	m.redraw();
};

/**
 * Returns true if a portal is currently set.
 */
export const hasPortal = () => portalStack.length > 0;
