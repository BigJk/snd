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

	let dropdown = null;

	return {
		oncreate(vnode) {
			dropdown = easydropdown(vnode.dom.classList.contains('form-select') ? vnode.dom : vnode.dom.querySelector('.form-select'), {
				behavior: {
					maxVisibleItems: 7,
				},
				callbacks: {
					onSelect: (value) => {
						vnode.attrs.oninput({ target: { value: value } });
						m.redraw();
					},
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
			dropdown.refresh();
		},
		onremove(vnode) {
			dropdown.destroy();
		},
		view(vnode) {
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getSelect(vnode)} />;
		},
	};
};
