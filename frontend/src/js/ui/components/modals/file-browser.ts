import m from 'mithril';

import * as API from 'js/core/api';

import Button from 'js/ui/spectre/button';
import Input from 'js/ui/spectre/input';
import Modal from 'js/ui/spectre/modal';

import Icon from 'js/ui/components/atomic/icon';
import Tooltip from 'js/ui/components/atomic/tooltip';
import Flex from 'js/ui/components/layout/flex';
import SideMenu from 'js/ui/components/view-layout/side-menu';

import { popPortal, pushPortal } from 'js/ui/portal';

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
			state.currentFiles = res ?? [];

			// Sort files. Folders first, then alphabetically.
			state.currentFiles.sort((a, b) => {
				if (a.isDir === b.isDir) {
					return a.name.localeCompare(b.name);
				}

				return a.isDir ? -1 : 1;
			});
		});
	};

	const getIcon = (file: FileInfo) => {
		if (file.isDir) {
			return 'folder';
		}
		const fileEnding = file.name.substring(file.name.lastIndexOf('.'));
		return fileNameIconMappings[fileEnding] || 'document';
	};

	const getCurrentFolder = () => {
		const path = state.path;
		const folders = path.split('/');
		return folders[folders.length - 1];
	};

	const goUp = (attrs: FileBrowserProps) => {
		const path = state.path;
		const folders = path.split('/');
		if (folders.length === 1) {
			return;
		}
		folders.pop();
		state.path = folders.join('/');
		if (state.path === '') {
			state.path = '/';
		}
		fetchFiles(attrs);
	};

	const canGoUp = () => {
		// If the path is a root path, we can't go up
		if (state.path[0] === '/') {
			return state.path.split('/').length > 1;
		}

		// If we only have 4 chars in the path (e.g. C://), we can't go up
		return state.path.length > 4;
	};

	const getFavoriteFolders = () => JSON.parse(localStorage.getItem('favoriteFolders') || '[]');

	const removeFavoriteFolder = (path: string) => {
		const favoriteFolders = getFavoriteFolders();
		const index = favoriteFolders.indexOf(path);
		if (index > -1) {
			favoriteFolders.splice(index, 1);
			localStorage.setItem('favoriteFolders', JSON.stringify(favoriteFolders));
		}
	};

	const favoriteFolder = () => {
		const favoriteFolders = JSON.parse(localStorage.getItem('favoriteFolders') || '[]');
		if (!favoriteFolders.includes(state.path)) {
			favoriteFolders.push(state.path);
			localStorage.setItem('favoriteFolders', JSON.stringify(favoriteFolders));
		}
	};

	const item = (icon: string, text: string, onClick: () => void) =>
		m(
			'div',
			{
				onclick: onClick,
			},
			m(Flex, { items: 'center', className: '.pa1.dim.pointer' }, [m(Icon, { icon: icon, className: '.text-primary.w1.mr1' }), text]),
		);

	return {
		oninit({ attrs }) {
			API.exec<Record<string, string>>(API.GET_DEFAULT_DIRECTORIES).then((res) => {
				state.defaultDirectories = res;
				state.path = res['Sales & Dungeons'];

				fetchFiles(attrs);
			});
		},
		view({ attrs }) {
			const favoriteFolders = getFavoriteFolders() as string[];

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
							items: [
								...Object.keys(state.defaultDirectories).map((key) => ({
									id: key,
									title: key,
									icon: 'folder',
									onClick: () => {
										state.path = state.defaultDirectories[key];
										fetchFiles(attrs);
									},
								})),
								...favoriteFolders.map((path) => ({
									id: path,
									title: path.split('/').pop() || '',
									icon: 'star',
									onClick: () => {
										state.path = path;
										fetchFiles(attrs);
									},
								})),
							],
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
									onEnter: (value) => {
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
								'div.mb2.b.ph2.pt2',
								m(Flex, { justify: 'between', items: 'center' }, [
									getCurrentFolder(),
									m(
										Tooltip,
										{ content: 'Favorite' },
										m(Icon, {
											icon: 'star',
											onClick: () => (favoriteFolders.includes(state.path) ? removeFavoriteFolder(state.path) : favoriteFolder()),
											className: favoriteFolders.includes(state.path) ? '.yellow' : '',
										}),
									),
								]),
							),
							m(
								'div.overflow-auto',
								{ style: { height: '400px' } },
								m('div.ph2.pb2', [
									canGoUp() ? item('arrow-round-up', 'Go up', () => goUp(attrs)) : null,
									state.currentFiles.length === 0 ? m('div.mt2.text-muted', 'Nothing found...') : null,
									state.currentFiles
										.filter((file) => {
											if (state.search) {
												return file.name.toLowerCase().includes(state.search.toLowerCase());
											}
											return true;
										})
										.map((file) =>
											item(getIcon(file), file.name, () => {
												if (file.isDir) {
													state.path = file.fullPath;
													state.search = '';
													fetchFiles(attrs);
												} else {
													attrs.resolve(file.fullPath);
													popPortal();
												}
											}),
										),
								]),
							),
						]),
					]),
					m(Flex, { justify: 'end', gap: 1, className: '.pa2.bt.b--black-10' }, [
						m(
							Button,
							{
								onClick: () => {
									{
										attrs.reject(new Error('User closed file browser'));
										popPortal();
									}
								},
							},
							'Cancel',
						),
						!attrs.onlyDirs
							? null
							: m(
									Button,
									{
										intend: 'success',
										onClick: () => {
											attrs.resolve(state.path);
											popPortal();
										},
									},
									'Select',
							  ),
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
