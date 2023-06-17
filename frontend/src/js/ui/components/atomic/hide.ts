import m from 'mithril';

type HideProps = {
	hide?: boolean;
};

export default (): m.Component<HideProps> => {
	return {
		view({ attrs, children }) {
			if (!attrs.hide) {
				return children;
			}
			return null;
		},
	};
};
