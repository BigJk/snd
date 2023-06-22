import m from 'mithril';

type LoaderProps = {
	className?: string;
	big?: boolean;
};

export default (): m.Component<LoaderProps> => {
	return {
		view({ attrs }) {
			return m(`div.loading${attrs.big ? '' : '.loading-lg'}${attrs.className ?? ''}`, {}, []);
		},
	};
};
