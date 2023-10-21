import m from 'mithril';
import { popPortal, pushPortal } from 'js/ui/portal';
import * as API from 'js/core/api';
import Modal from 'js/ui/spectre/modal';
import SideMenu from 'js/ui/components/view-layout/side-menu';
import Flex from 'js/ui/components/layout/flex';
import Input from 'js/ui/spectre/input';
import Icon from 'js/ui/components/atomic/icon';

type FileBrowserProps = {
	title: string;
	fileEndings: string[];
	onlyDirs: boolean;
	resolve: (path: string) => void;
	reject: (err: Error) => void;
};

type FileInfo = {
	name: string;
	fullPath: string;
	isDir: boolean;
};

type FileBrowserState = {
	defaultDirectories: Record<string, string>;
	path: string;
	search: string;
	currentFiles: FileInfo[];
};

const fileNameIconMappings = {
	'.png': 'image',
	'.jpg': 'image',
	'.jpeg': 'image',
	'.gif': 'image',
	'.svg': 'image',
	'.zip': 'archive',
	'.rar': 'archive',
	'.7z': 'archive',
	'.tar': 'archive',
	'.gz': 'archive',
	'.json': 'code',
};

const fileBrowserModal = (): m.Component<FileBrowserProps> => {
	const state: FileBrowserState = {
		defaultDirectories: {},
		path: '',
		search: '',
		currentFiles: [],
	};

	const fetchFiles = (attrs: FileBrowserProps) => {
		API.exec<FileInfo[]>(API.GET_FILES, state.path, attrs.fileEndings, attrs.onlyDirs).then((res) => {
			// Sort files. Folders first, then alphabetically.
			res.sort((a, b) => {
				if (a.isDir === b.isDir) {
					return a.name.localeCompare(b.name);
				}

				return a.isDir ? -1 : 1;
			});

			state.currentFiles = res;
		});
	};

	const getIcon = (file: FileInfo) => {
		if (file.isDir) {
			return 'folder';
		}
		const fileEnding = file.name.substring(file.name.lastIndexOf('.'));
		return fileNameIconMappings[fileEnding] || 'document';
	};

	return {
		oninit({ attrs }) {
			API.exec<Record<string, string>>(API.GET_DEFAULT_DIRECTORIES).then((res) => {
				state.defaultDirectories = res;
				state.path = res['Sales & Dungeons'];

				fetchFiles(attrs);
			});
		},
		view({ attrs }) {
			return m(
				Modal,
				{
					title: attrs.title,
					icon: 'folder',
					width: 750,
					noPadding: true,
					onClose: () => {
						popPortal();
						attrs.reject(new Error('User closed file browser'));
					},
				},
				[
					m(Flex, { className: '.h-100' }, [
						m(SideMenu, {
							className: '.w-30.flex-shrink-0.br.b--black-10.pa2',
							items: Object.keys(state.defaultDirectories).map((key) => ({
								id: key,
								title: key,
								icon: 'folder',
								onClick: () => {
									state.path = state.defaultDirectories[key];
									fetchFiles(attrs);
								},
							})),
						}),
						m('div.flex-grow-1', [
							m(
								'div.bb.b--black-10.ph2',
								m(Input, {
									className: '.pa1',
									useBlur: true,
									value: state.path,
									minimal: true,
									onChange: (value) => {
										state.path = value;
										fetchFiles(attrs);
									},
								}),
							),
							m(
								'div.bb.b--black-10.ph2',
								m(Input, {
									className: '.pa1',
									value: state.search,
									placeholder: 'Search...',
									minimal: true,
									onChange: (value) => {
										state.search = value;
									},
								}),
							),
							m(
								'div.overflow-auto',
								{ style: { height: '400px' } },
								m(
									'div.pa1',
									state.currentFiles
										.filter((file) => {
											if (state.search) {
												return file.name.toLowerCase().includes(state.search.toLowerCase());
											}
											return true;
										})
										.map((file) =>
											m(
												'div',
												{
													onclick: () => {
														if (file.isDir) {
															state.path = file.fullPath;
															fetchFiles(attrs);
														} else {
															attrs.resolve(file.fullPath);
															popPortal();
														}
													},
												},
												m(Flex, { items: 'center', className: '.pa1.dim.pointer' }, [
													m(Icon, { icon: getIcon(file), className: '.text-primary.w1.mr1' }),
													file.name,
												]),
											),
										),
								),
							),
						]),
					]),
				],
			);
		},
	};
};

export function openFileModal(title: string, fileEndings: string[] = [], onlyDirs: boolean = false) {
	return new Promise<string>((resolve, reject) => {
		pushPortal(fileBrowserModal, {
			attributes: {
				title,
				fileEndings,
				onlyDirs,
				resolve,
				reject,
			},
		});
	});
}
