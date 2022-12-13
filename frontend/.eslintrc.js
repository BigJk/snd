module.exports = {
	env: {
		browser: true,
		es6: true
	},
	settings: {
		react: {
			createClass: "m",
			pragma: "m",
			fragment: "Fragment",
			version: "detect",
		},
	},
	extends: ['eslint:recommended'],
	overrides: [],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
			modules: true
		}
	},
	plugins: ['local', 'react'],
	rules: {
		"react/self-closing-comp": ["error", {
			"component": true,
			"html": true
		}],
		'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'ignore', propElementValues: 'always' }],
		'no-unused-vars': ['error', { 'argsIgnorePattern': 'vnode' }],
		'arrow-body-style': ['error', 'as-needed'],
		'jsx-quotes': ['error', 'prefer-single'],
		'local/jsx-uses-my-pragma': 'error',
		'local/jsx-uses-vars': 'error',
		'no-mixed-spaces-and-tabs': 'off'
	},
	globals: {
		'm': true
	},
	ignorePatterns: ['*.md', '*.css', '*.scss', '*.html', '*.svg']
};
