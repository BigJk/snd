import { Input } from '/js/ui/components/index';

export default {
	name: 'Text',
	defaultValue: 'some text',
	view: () => ({
			oninit() {},
			view(vnode) {
				return <Input value={vnode.attrs.value} label={vnode.attrs.label} oninput={(e) => vnode.attrs.oninput(e.target.value)}></Input>;
			},
		}),
};
