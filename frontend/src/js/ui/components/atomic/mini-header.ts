import m from 'mithril';

type MiniHeaderProps = {
	className?: string;
	noMargin?: boolean;
};

export default (): m.Component<MiniHeaderProps> => ({
	view: ({ children, attrs }) => m(`div.f8.b${attrs.noMargin ? '' : '.mb2'}${attrs.className ?? ''}`, children),
});
