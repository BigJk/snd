import m from 'mithril';

import Input from 'js/ui/shoelace/input';

import AuthorTag from 'js/ui/components/atomic/author-tag';
import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

type FilterBoxProps = {
	value?: string;
	placeholder?: string;
	onChange?: (value: string) => void;
	authors?: string[];
	footer?: m.Children;
	hoveredId?: string;
	hideHovered?: boolean;
	hoverText?: string;
};

export default (): m.Component<FilterBoxProps> => ({
	view({ attrs }) {
		return m('.fixed.right-0.mr3', { style: { width: '250px' } }, [
			m('div.bg-white.br2.ba.b--black-10', [
				m(Flex, { className: '.pa2.bb.b--black-10.pb2.f8.br2.br--top.bg-dark-muted-05.b', justify: 'between', items: 'center' }, [
					'Filter',
					m(Icon, { icon: 'switch', className: '.f8' }),
				]),
				m('div.pa2', [
					m(Input, {
						value: attrs.value,
						placeholder: attrs.placeholder ?? 'Search...',
						clearable: true,
						onChange: (value) => attrs.onChange?.(value),
					}),
					m('div.bb.b--black-10.pb2.mb2.mt3.f8.b', 'Author'),
					m(
						Flex,
						{ wrap: 'wrap', gap: 2 },
						attrs.authors?.map((a) => m(AuthorTag, { author: a, onClick: () => attrs.onChange?.(a) })),
					),
				]),
				attrs.footer ? m('div.ph2.pv1.mt2.bg-dark-muted-05.br2.br--bottom.f8', attrs.footer) : null,
			]),
			!attrs.hideHovered
				? m('div.bg-white.br2.ba.b--black-10.mt3', [
						m(Flex, { className: '.pa2.bb.b--black-10.pb2.f8.br2.br--top.bg-dark-muted-05.b', justify: 'between', items: 'center' }, [
							'Preview',
							m(Icon, { icon: 'eye', className: '.f8' }),
						]),
						attrs.hoveredId
							? m(
									'div.pa2',
									m(
										'div.pa2.relative',
										{
											style: {
												height: '300px',
												backgroundImage: `url("/api/preview-image/${attrs.hoveredId}")`,
												backgroundSize: '100% auto',
												backgroundPosition: 'center top',
												backgroundRepeat: 'no-repeat',
											},
										},
										[
											m('div.absolute.bottom-0.right-0.w-100', {
												style: {
													height: '50%',
													background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%)',
												},
											}),
										],
									),
								)
							: m('div.pa2.f8.tc', attrs.hoverText ? attrs.hoverText : 'Hover over a template to preview'),
					])
				: null,
		]);
	},
});
