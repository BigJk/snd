import m from 'mithril';

import Button from 'js/ui/spectre/button';
import Icon from 'js/ui/components/atomic/icon';
import Box from 'js/ui/components/box';
import Flex from 'js/ui/components/layout/flex';

type BoxVersionProps = {
	className?: string;
	newVersion: boolean;
	newVersionTag?: string;
};

export default (): m.Component<BoxVersionProps> => ({
	view({ attrs }) {
		if (!attrs.newVersion) {
			return m(Box, { className: `.bg-success.white${attrs.className ?? ''}`, minWidth: 350 }, [
				m(Flex, { justify: 'between', items: 'end' }, [
					m(Icon, { className: '.mr3', icon: 'cloud-done', size: 3 }), //
					m('div.f3.b', attrs.newVersionTag),
				]),
				m('div.lh-title.mt2.pt2.bt.b--white-40', [
					m('div.text-muted', 'Great! Your Sales & Dungeons is up to date.'), //
				]),
			]);
		}

		return m(Box, { className: `.ba.b--black-10${attrs.className ?? ''}`, minWidth: 350 }, [
			m(Flex, { justify: 'between', items: 'end' }, [
				m(Icon, { className: '.mr3.col-danger', icon: 'cloud-download', size: 3 }),
				m(Button, { intend: 'primary', link: 'https://github.com/BigJk/snd/releases' }, 'Download'),
			]),
			m('div.lh-title.mt2.pt2.bt.b--black-10', [
				m('div.f3.b', attrs.newVersionTag), //
				m('div', 'Update Available'),
			]),
		]);
	},
});
