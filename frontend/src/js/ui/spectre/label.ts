import m from 'mithril';

export type LabelProps = {
	intent?: 'primary' | 'success' | 'warning' | 'error';
};

export default (): m.Component<LabelProps> => ({
	view: ({ attrs, children }) => m(`div.label.${attrs.intent ? `label-${attrs.intent}` : ''}`, children),
});
