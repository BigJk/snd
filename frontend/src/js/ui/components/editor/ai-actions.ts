import m from 'mithril';

import Icon from 'js/ui/components/atomic/icon';

type EditorAIActionsProps = {
	loading: boolean;
	hasSelection: boolean;
	onGenerate: () => void;
	onEditSelection: () => void;
};

export default (): m.Component<EditorAIActionsProps> => ({
	view({ attrs }) {
		return m(
			'sl-dropdown',
			{
				placement: 'top-start',
				hoist: true,
			},
			m(
				'sl-button',
				{
					slot: 'trigger',
					size: 'small',
					variant: 'primary',
					caret: true,
					loading: attrs.loading,
				},
				[m('span', { slot: 'prefix' }, m(Icon, { icon: 'color-wand' })), 'AI'],
			),
			m('sl-menu', [
				m('sl-menu-item', { disabled: attrs.loading, onclick: attrs.onGenerate }, 'Generate'),
				m('sl-menu-item', { disabled: attrs.loading || !attrs.hasSelection, onclick: attrs.onEditSelection }, 'Edit selection'),
			]),
		);
	},
});
