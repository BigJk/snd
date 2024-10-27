import m from 'mithril';

type AuthorTagProps = {
	author: string;
	onClick?: () => void;
};

const generateColor = (index: number, alpha: number): string => {
	const hue = (index * 137.508) % 360; // Using golden angle approximation for color distribution
	return `hsla(${hue}, 100%, 75%, ${alpha})`;
};

const colors = Array.from({ length: 100 }, (_, i) => generateColor(i, 1));

function authorToColor(author: string, alpha: number): string {
	const num = author.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) + i, 0);
	return generateColor(num, alpha);
}

export default (): m.Component<AuthorTagProps> => ({
	view({ attrs }) {
		return m(
			`span.ph1.br1.f8.b${attrs.onClick ? '.pointer.dim' : ''}`,
			{
				style: {
					background: authorToColor(attrs.author, 0.3),
					border: `1px solid ${authorToColor(attrs.author, 0.4)}`,
				},
				onclick: attrs.onClick,
			},
			attrs.author,
		);
	},
});
