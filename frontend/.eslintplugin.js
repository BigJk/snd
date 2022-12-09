module.exports.rules = {
	'jsx-uses-my-pragma': {
		create(context) {
			const pragma = 'my';
			const usePragma = () => context.markVariableAsUsed(pragma);
			return {
				JSXOpeningElement: usePragma,
				JSXOpeningFragment: usePragma,
			};
		},
	},
	'jsx-uses-vars': {
		create(context) {
			return {
				JSXOpeningElement(node) {
					if (node.name.name) {
						const variable = node.name.name;
						context.markVariableAsUsed(variable);
					}
				},
			};
		},
	},
};