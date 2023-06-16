import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	plugins: [tsconfigPaths(), monacoEditorPlugin({})],
	root: 'src/',
	esbuild: {
		jsxInject: "import m from 'mithril'",
		jsxFactory: 'm',
		jsxFragment: 'm.Fragment',
	},
	resolve: {
		alias: {
			core: './js/core',
			components: './js/ui/components',
			ui: './js/ui',
		},
	},
	build: {
		outDir: '../dist',
	},
	server: {
		host: '127.0.0.1',
		port: 3000,
	},
});
