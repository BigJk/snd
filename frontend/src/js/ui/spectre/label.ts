import m from 'mithril';

export type LabelProps = {
	intent?: 'primary' | 'success' | 'warning' | 'error';
};

export default (): m.Component<LabelProps> => {
	return {
		view: ({ attrs, children }) => {
			return m(`div.label.${attrs.intent ? `label-${attrs.intent}` : ''}`, children);
		},
	};
};
