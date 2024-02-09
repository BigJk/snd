import m from 'mithril';

import Button, { type ButtonProps } from 'js/ui/spectre/button';

import Icon from 'js/ui/components/atomic/icon';

type IconButtonProps = ButtonProps & {
	icon: string;
};

export default (): m.Component<IconButtonProps> => ({
	view({ attrs, children }) {
		return m(Button, attrs, [m(Icon, { icon: attrs.icon }), children]);
	},
});
