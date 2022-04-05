import FormGroup from '/js/ui/components/form-group';

export default () => {
	let getSelect = (vnode) => {
		return (
			<select className={`form-select ${vnode.attrs.labelCol ? 'col-' + (12 - vnode.attrs.labelCol) : ''}`} oninput={vnode.attrs.oninput}>
				<option value="" selected={!vnode.attrs.selected || vnode.attrs.selected.length === 0}>
					{vnode.attrs.default ?? 'Choose an option...'}
				</option>
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
	};

	return {
		view(vnode) {
			return <FormGroup label={vnode.attrs.label} labelCol={vnode.attrs.labelCol} elem={getSelect(vnode)} />;
		},
	};
};
