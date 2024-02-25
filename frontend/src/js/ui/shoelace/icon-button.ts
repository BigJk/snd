import m from 'mithril';

import Button, { type ButtonProps } from 'js/ui/shoelace/button';

import Icon from 'js/ui/components/atomic/icon';

type IconButtonProps = ButtonProps & {
	icon: string;
};

export default (): m.Component<IconButtonProps> => ({
	view({ attrs, children }) {
		if (!children || (Array.isArray(children) && children.length === 0)) {
			return m(Button, attrs, m(Icon, { icon: attrs.icon }));
		}
		return m(Button, { ...attrs, prefix: m(Icon, { icon: attrs.icon }) }, children);
	},
});
