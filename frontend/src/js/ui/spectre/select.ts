import m from 'mithril';

import easydropdown from 'easydropdown';

type OnInputEvent = {
	target: {
		value: string;
	};
	value: string;
};

type SelectProps = {
	keys: string[];
	names?: string[];
	selected: string | null;
	default?: string;
	noDefault?: boolean;
	width?: number;
	oninput: (e: OnInputEvent) => void;
};

type SelectState = {
	dropdown: any | null;
	oninput: (e: any) => void;
	open: boolean;
};

export default (): m.Component<SelectProps> => {
	const state: SelectState = {
		dropdown: null,
		oninput: (e) => {},
		open: false,
	};

	const getSelect = (vnode: m.Vnode<SelectProps, {}>) => {
		return m(
			'div',
			{ style: { width: `${vnode.attrs.width ? vnode.attrs.width + 'px' : 'auto'}` } },
			m(
				'select.form-select',
				{
					oninput: vnode.attrs.oninput,
					style: { width: '31px' },
				},
				[
					// if noDefault is set, we don't want to render the default option.
					vnode.attrs.noDefault
						? null
						: m(
								'option',
								{
									value: '',
									selected: !vnode.attrs.selected || vnode.attrs.selected.length === 0,
								},
								vnode.attrs.default ?? 'Choose an option...'
						  ),
					// render all the options.
					vnode.attrs.keys.map((k, i) => {
						let text = k;
						if (vnode.attrs.names) {
							text = vnode.attrs.names[i];
						}
						return m(
							'option',
							{
								value: k,
								selected: vnode.attrs.selected === k,
							},
							text
						);
					}),
				]
			)
		);
	};

	// we need to update the oninput value on create and update of component,
	// otherwise we miss updates to this callback.
	const setOnInput = (vnode: m.Vnode<SelectProps, {}>) => {
		state.oninput = (value) => {
			vnode.attrs.oninput({ target: { value: value }, value });
			m.redraw();
		};
	};

	const updateSize = (vnode: m.VnodeDOM<SelectProps>) => {
		if (!vnode.attrs.width || vnode.attrs.width == 0) return;

		let dropdownElement = vnode.dom.parentElement?.parentElement;
		if (!dropdownElement) return;

		(dropdownElement as HTMLElement).style.width = `${vnode.attrs.width}px`;
	};

	return {
		oncreate(vnode) {
			setOnInput(vnode);

			// @ts-ignore
			state.dropdown = easydropdown(vnode.dom.classList.contains('form-select') ? vnode.dom : vnode.dom.querySelector('.form-select'), {
				behavior: {
					maxVisibleItems: 7,
					liveUpdates: true,
				},
				callbacks: {
					onSelect: (value) => {
						// instead of passing vnode.attrs.oninput to onSelect we need to redirect
						// it to the stored oninput, otherwise this onSelect would be fixed to the
						// callback that was set in oncreate.
						state.oninput(value);
					},
					onOpen: () => (state.open = true),
					onClose: () => (state.open = false),
				},
				classNames: {
					root: `edd-root`,
					head: `form-select edd-head`,
					value: '',
					arrow: '',
					gradientTop: '',
					gradientBottom: '',
				},
			});
		},
		onupdate(vnode) {
			setOnInput(vnode);
		},
		onremove(vnode) {
			state.dropdown.destroy();
		},
		view(vnode) {
			return getSelect(vnode);
		},
	};
};
