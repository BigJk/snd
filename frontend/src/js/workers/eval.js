onmessage = (e) => {
	postMessage(eval(e.data[1])(e.data[0]));
};
