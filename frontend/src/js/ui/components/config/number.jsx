import { Input } from '/js/ui/components/index';

export default {
	name: 'Number',
	defaultValue: () => 0,
	view: () => ({
		oninit() {},
		view(vnode) {
			return (
				<Input
					value={vnode.attrs.value}
					label={vnode.attrs.label}
					oninput={(e) => {
						const value = parseInt(e.target.value);
						vnode.attrs.oninput(isNaN(value) ? '' : value);
					}}
				/>
			);
		},
	}),
};
