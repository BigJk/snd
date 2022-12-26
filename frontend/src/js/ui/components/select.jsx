import easydropdown from 'easydropdown';

import FormGroup from '/js/ui/components/form-group';

export default () => {
	let getSelect = (vnode) => (
		<select
			className={`form-select ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`}
			oninput={vnode.attrs.oninput}
			style={{ width: '31px' }}
		>
			{vnode.attrs.noDefault ? null : (
				<option value='' selected={!vnode.attrs.selected || vnode.attrs.selected.length === 0}>
					{vnode.attrs.default ?? 'Choose an option...'}
				</option>
			)}
			{vnode.attrs.keys.map((k, i) => {
				let text = k;
				if (vnode.attrs.names) {
					text = vnode.attrs.names[i];
				}
				return (
					<option value={k} selected={vnode.attrs.selected === k}>
						{text}
					</option>
				);
			})}
		</select>
	);

	let state = {
		dropdown: null,
		oninput: null,
		open: false,
	};

	// we need to update the oninput value on create and update of component,
	// otherwise we miss updates to this callback.
	let setOnInput = (vnode) => {
		state.oninput = (value) => {
			vnode.attrs.oninput({ target: { value: value } });
			m.redraw();
		};
	};

	return {
		oncreate(vnode) {
			setOnInput(vnode);

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
					root: `edd-root ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`,
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
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getSelect(vnode)} />;
		},
	};
};
