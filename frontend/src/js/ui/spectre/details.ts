import m from 'mithril';

type DetailsProps = {
	className?: string;
	summary: string;
};

export default (): m.Component<DetailsProps> => ({
	view({ attrs, children }) {
		return m(`sl-details[summary="${attrs.summary}"]${attrs.className}`, children);
	},
});
