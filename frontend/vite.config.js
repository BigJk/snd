import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

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
			js: path.resolve(__dirname, 'src/js'),
			src: path.resolve(__dirname, 'src'),
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
