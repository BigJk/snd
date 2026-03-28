import m from 'mithril';

import * as API from 'js/core/api';
import guid from 'js/core/guid';

import Button from 'js/ui/shoelace/button';
import Input from 'js/ui/shoelace/input';

import Icon from 'js/ui/components/atomic/icon';
import Flex from 'js/ui/components/layout/flex';

export type ImageUploadEntry = { name: string; base: string };

type ImageUploadProps = {
	compact?: boolean;
	className?: string;
	height?: number;
	multiple?: boolean;
	onUpload?: (entries: ImageUploadEntry[]) => void;
};

export default (): m.Component<ImageUploadProps> => {
	let id = guid();
	let url = '';

	return {
		view({ attrs }) {
			return m(
				`div.w-100${attrs.className ?? ''}`,
				m(Flex, { className: '.w-100', direction: 'column', items: 'center' }, [
					//
					// Upload from computer
					m(
						'label.pointer.db.h-100.w-100.ba.bw1.br2.b--dashed.b--col-primary-muted.bg-black-05',
						{ style: { height: attrs.height ? attrs.height + 'px' : '250px' }, for: id },
						[
							m(Flex, { className: '.w-100.h-100', justify: 'center', items: 'center', direction: attrs.compact ? 'row' : 'column' }, [
								m(Icon, {
									icon: 'document',
									size: attrs.compact ? 4 : 2,
									className: attrs.compact ? '.mr3' : '.mb3',
								}),
								m('div.fw5', attrs.multiple ? 'Select images from your computer' : 'Select image from your computer'),
							]), //
						],
					), //
					m(`input.dn#${id}`, {
						type: 'file',
						multiple: attrs.multiple ?? false,
						onchange: (e: Event) => {
							let files = (e.target as HTMLInputElement).files;
							if (!files) return;

							let readers: Promise<ImageUploadEntry>[] = [];

							for (let i = 0, f; (f = files[i]); i++) {
								if (!f.type.match('image.*')) continue;

								readers.push(
									new Promise<ImageUploadEntry>((resolve) => {
										let reader = new FileReader();
										let name = f.name;
										reader.onload = (ev) => {
											resolve({ name, base: ev.target!.result as string });
										};
										reader.readAsDataURL(f);
									}),
								);
							}

							Promise.all(readers).then((entries) => {
								if (attrs.onUpload) attrs.onUpload(entries);
								m.redraw();
							});
						},
					}),
					//
					// Divider
					attrs.compact ? m('div.mb2') : m(Icon, { icon: 'more', size: 3, className: '.mv3.o-50' }),
					//
					// Upload from URL
					m('div.db.h-100.w-100.ba.bw1.br2.b--dashed.b--col-primary-muted.bg-black-05' + (attrs.compact ? '.pa2' : '.pa3'), [
						m('div.tc.mb3.fw5', 'Download from URL'),
						m(Flex, { direction: attrs.compact ? 'column' : 'row' }, [
							m(Input, { className: '.w-100', placeholder: 'https://example.com/image.png', value: url }), //
							m(
								Button,
								{
									className: attrs.compact ? '.mt2' : '.ml2',
									intend: 'primary',
									onClick: () => {
										if (url.length === 0) return;

										API.exec<string>(API.FETCH_IMAGE, url).then((base) => {
											if (attrs.onUpload) attrs.onUpload([{ name: guid(), base }]);
											m.redraw();
										});
									},
								},
								'Download',
							),
						]),
					]), //
				]),
			);
		},
	};
};
