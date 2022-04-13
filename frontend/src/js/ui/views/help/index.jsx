import MarkdownIt from 'markdown-it';
import MarkdownItReplaceLink from 'markdown-it-replace-link';
import hljs from 'highlight.js';

import { Logo } from '/js/ui/components';

const docs = import.meta.globEager('/docs/*.md', { as: 'raw' });
const images = import.meta.globEager('/docs/images/*.png');

// Markdown instance with syntax highlighting
let markdown = new MarkdownIt({
	html: true,
	replaceLink: function (link, env) {
		if (link.indexOf('.png') === -1 || link.indexOf('http') === 0) {
			return link;
		}

		let split = link.split('/');
		return images[`/docs/images/${split[split.length - 1]}`].default;
	},
	highlight: function (str, lang) {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return (
					'<pre class="code hljs br1" data-lang="' +
					lang +
					'"><code>' +
					hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
					'</code></pre>'
				);
			} catch (__) {}
		}

		return '<pre class="code hljs br1" data-lang="' + lang + '"><code>' + markdown.utils.escapeHtml(str) + '</code></pre>';
	},
});
markdown.use(MarkdownItReplaceLink);

// Open links in external browser instead of own electron window
let defaultRender =
	markdown.renderer.rules.link_open ||
	function (tokens, idx, options, env, self) {
		return self.renderToken(tokens, idx, options);
	};

markdown.renderer.rules.link_open = function (tokens, idx, options, env, self) {
	let aIndex = tokens[idx].attrIndex('onclick');

	let fn = `event.preventDefault(); require('electron').shell.openExternal(event.target.href); return false;`;

	if (aIndex < 0) {
		tokens[idx].attrPush(['onclick', fn]);
	} else {
		tokens[idx].attrs[aIndex][1] = fn;
	}

	return defaultRender(tokens, idx, options, env, self);
};

// Help pages to show
let pages = [
	{
		name: 'Home',
		doc: 'home.md',
	},
	{
		name: 'Templates',
		doc: 'templates.md',
	},
	{
		name: 'Data Sources',
		doc: 'data-sources.md',
	},
	{
		name: 'Live Edit',
		doc: 'live-edit.md',
	},
	{
		name: 'Developer',
		doc: 'developer.md',
	},
];

export default () => {
	let state = {
		active: 0,
	};

	return {
		view(vnode) {
			return (
				<div className="bg-white h-100 overflow-auto">
					<div className="grid-bg pa3">
						<Logo scale={0.7} />
					</div>
					<div className="pa3 flex">
						<div className="w4 mr3 flex-shrink-0 br b--black-10">
							<div className="f5">Help Pages</div>
							<ul className="nav">
								{pages.map((val, i) => {
									return (
										<li className={`nav-item ${i === state.active ? 'active' : ''}`}>
											<a
												href="#"
												onclick={(e) => {
													state.active = i;
													e.preventDefault();
												}}
											>
												{val.name}
											</a>
										</li>
									);
								})}
							</ul>
						</div>
						<div className="markdown flex-grow-1">{m.trust(markdown.render(docs['/docs/' + pages[state.active].doc]))}</div>
					</div>
				</div>
			);
		},
	};
};
