import m from 'mithril';

type LoaderProps = {
	className?: string;
	big?: boolean;
};

export default (): m.Component<LoaderProps> => ({
	view({ attrs }) {
		return m(`sl-spinner[size=${attrs.big ? 'large' : 'small'}]${attrs.className ?? ''}`);
	},
});
