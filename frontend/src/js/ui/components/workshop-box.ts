import m from 'mithril';

import { css } from 'goober';

import { RepoEntry } from 'js/types/public-list';

import Flex from 'js/ui/components/layout/flex';

const style = css`
	max-width: 500px;
	transition: transform 0.15s ease-in-out;

	&:hover {
		transform: scale(1.02);

		.info {
			border-color: var(--col-primary);
		}
	}
`;

type WorkshopBoxProps = {
	repo: RepoEntry;
	onClick?: () => void;
};

export default (): m.Component<WorkshopBoxProps> => {
	let key = Math.ceil(Math.random() * 1000000000).toString();

	const cutDescription = (description: string) => {
		if (description.length === 0) {
			return 'No description available...';
		}
		if (description.length > 100) {
			return description.substring(0, 100) + '...';
		}
		return description;
	};

	return {
		view({ attrs }) {
			return m(
				'div',
				{
					onclick: attrs.onClick,
				},
				m(Flex, { className: `.pointer.${style}`, key }, [
					m(
						'div.info.bg-black-01.w-100.ba.b--black-05.lh-copy.overflow-auto',
						{ key: key + '.info' },
						m('div.ph2.pv1.overflow-auto', [
							m(Flex, { className: '.mb1.pb1.bb.b--black-05', justify: 'between' }, [
								m('div.b', attrs.repo.name), //
							]), //
							m('div', cutDescription(attrs.repo.description)), //
						]),
					),
				]),
			);
		},
	};
};
