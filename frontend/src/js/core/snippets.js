export default [
	{
		name: 'if',
		content: `{% if variable %}

{% endif %}`,
	},
	{
		name: 'if-else',
		content: `{% if variable %}

{% elif tired %}

{% else %}

{% endif %}`,
	},
	{
		name: 'if-in-place',
		content: '{{ "true" if foo else "false" }}',
	},
	{
		name: 'for-in',
		content: `{% for item in items %}

{% else %}

{% endfor %}`,
	},
	{
		name: 'macro',
		content: `{% macro your_macro(val, other_val='') %}

{% endmacro %}`,
	},
	{
		name: 'set',
		content: `{% set x = 5 %}`,
	},
	{
		name: 'set-block',
		content: `{% set x %}

{% endset %}`,
	},
];
