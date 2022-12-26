import { Input, TextArea } from '/js/ui/components/index';

export default {
	name: 'Fight Club 5e Compedium Format',
	view: () => {
		let state = {
			name: '',
			author: '',
			slug: '',
			description: '',
		};

		return {
			view(vnode) {
				return (
					<div>
						<div className='mb2 lh-copy'>
							You can import data from Fight Club 5e Compediums. This will convert all the included data (Items, Monsters, Races, Background, ...) and
							add them as Data Sources. <br />
							<br />
							As the compediums don't contain the basic information like name, author, etc. Please insert them manually:
						</div>
						<Input label='Name' placeholder='Full Compedium' oninput={(e) => (state.name = e.target.value)} />
						<Input label='Author' placeholder='User' oninput={(e) => (state.author = e.target.value)} />
						<Input label='Slug' placeholder='Slug' oninput={(e) => (state.slug = e.target.value.replace(/[^a-z0-9-]/gi, ''))} />
						<TextArea label='Description' placeholder='Contains ...' oninput={(e) => (state.description = e.target.value)} />
						<div className='btn btn-primary mr2' onclick={() => vnode.attrs.onimport('fc5e', state)}>
							Import FC5e (compedium.xml)
						</div>
					</div>
				);
			},
		};
	},
};
