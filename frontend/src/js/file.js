export function readFile() {
	return new Promise((resolve, reject) => {
		let f = document.createElement('input');
		f.style.display = 'none';
		f.type = 'file';
		f.name = 'file';
		f.onchange = function(e) {
			let files = e.target.files;

			if (files.length === 0) {
				f.remove();
				reject();
			}

			let reader = new FileReader();

			reader.onload = e => {
				f.remove();
				resolve(e.target.result);
			};

			reader.readAsDataURL(files[0]);
		};

		document.querySelector('body').appendChild(f);

		f.click();
	});
}
