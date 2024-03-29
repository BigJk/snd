import m from 'mithril';

import Button from 'js/ui/shoelace/button';

import Box from 'js/ui/components/box';
import Flex from 'js/ui/components/layout/flex';

type DeviceProps = {
	className?: string;
	printer: string;
	endpoint: string;
	type: string;
	active: boolean;
	onUse?: (printer: string, endpoint: string, type: string) => void;
};

export default (): m.Component<DeviceProps> => {
	const button = (attrs: DeviceProps) => {
		if (!attrs.active) {
			return m(Button, { intend: 'primary', onClick: () => (attrs.onUse ? attrs.onUse(attrs.printer, attrs.endpoint, attrs.type) : null) }, 'Use');
		}

		return m(Button, { intend: 'success', disabled: true }, 'Active');
	};

	return {
		view({ attrs }) {
			return m(
				Box,
				{ minWidth: 300, minHeight: 180, className: `${attrs.active ? '.ba.b--dashed.bw1.b--col-success' : ''}${attrs.className ?? ''}` },
				m(
					'div.h-100.lh-copy',
					{ style: { wordBreak: 'break-all' } },
					m(Flex, { direction: 'column', justify: 'between', className: '.h-100' }, [
						m('div', [
							m(`div.b.col-primary`, attrs.type), //
							m('div.b.f5.lh-title.bb.b--black-05.mb2.pb2', attrs.printer),
							m('div.f8.code.o-50', 'endpoint=' + attrs.endpoint),
						]),
						m('div', button(attrs)),
					]),
				),
			);
		},
	};
};
