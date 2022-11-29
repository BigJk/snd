import { Switch } from '/js/ui/components/index';

export default {
	name: 'Text',
	defaultValue: false,
	view: () => {
		return {
			oninit() {},
			view(vnode) {
				return <Switch value={vnode.attrs.value} label={vnode.attrs.label} oninput={(e) => vnode.attrs.oninput(e.target.checked)}></Switch>;
			},
		};
	},
};
