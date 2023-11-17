import m from 'mithril';

import { isArray } from 'lodash-es';

/**
 * Filter children: removes null children.
 *
 * Related to https://mithril.js.org/keys.html#what-are-keys
 *
 * If we are working with keyed children, we need to filter out null children as they don't have keys,
 * which would cause Mithril to throw an error.
 * @param children The children to filter.
 */
export function filterChildren(children: m.Children) {
	if (isArray(children)) {
		return children.filter((child) => child != null);
	}
	return children;
}
