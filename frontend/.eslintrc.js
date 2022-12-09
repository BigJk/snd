module.exports = {
	env: {
		browser: true,
		es6: true
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
	plugins: ['local'],
	rules: {
		'no-unused-vars': ["error", { "argsIgnorePattern": "vnode" }],
		'arrow-body-style': ["error", "as-needed"],
		'local/jsx-uses-my-pragma': 'error',
		'local/jsx-uses-vars': 'error',
	},
	globals: {
		'm': true
	},
	ignorePatterns: ["*.md", "*.css", "*.scss", "*.html", "*.svg"]
};
