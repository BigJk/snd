import m from 'mithril';

type HeaderProps = {
	title: string;
	description?: string;
};

export default (): m.Component<HeaderProps> => {
	return {
		view({ attrs }) {
			return [m('div.f4.pt3', attrs.title), attrs.description ? m('div.f7.text-muted.mb3', attrs.description) : null];
		},
	};
};
