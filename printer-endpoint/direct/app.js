const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const Printer = require('printer');
const Puppeteer = require('puppeteer');

/*
    Config
 */

const Config = require('./config');

/*
    Get Printer
 */

let ptr = Printer.getPrinter(Config.printer);

/*
    Create Temp Directory
 */

const fs = require('fs');
if (!fs.existsSync('./temp')) {
	fs.mkdirSync('./temp');
}

/*
    Routing
 */
const bodyparser = require('body-parser');
const express = require('express');

let app = express();

app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
	res.header('Access-Control-Allow-Credentials', 'true');
	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
	res.header('Access-Control-Expose-Headers', 'Content-Length');
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
	if (req.method === 'OPTIONS') {
		return res.send(200);
	} else {
		return next();
	}
});
app.use(bodyparser.text({ limit: '50mb' }));

app.post('/print', function(req, res) {
	let file = './temp/' + Math.ceil(Math.random() * 1000000000) + '.png';

	console.log('Received request...');

	(async () => {
		/*
            Screenshot
         */

		let browser = null;
		if (Config.chromium && Config.chromium.length > 0) {
			browser = await Puppeteer.launch({ executablePath: Config.chromium });
		} else {
			browser = await Puppeteer.launch();
		}

		const page = await browser.newPage();
		page.on('console', msg => console.log('CHROME PAGE LOG:', msg.text()));

		await page.setContent(req.body, {
			waitUntil: 'networkidle0'
		});
		await page.setViewport({
			width: 380,
			height: 10000
		});

		const target = await page.$('#content');
		const bounding_box = await target.boundingBox();

		await target.screenshot({
			path: file,
			clip: {
				x: bounding_box.x,
				y: bounding_box.y,
				width: Math.min(bounding_box.width, page.viewport().width),
				height: Math.min(bounding_box.height, page.viewport().height)
			}
		});

		await browser.close();

		/*
            Print
         */

		let thermal_printer = new ThermalPrinter({
			type: PrinterTypes.EPSON
		});

		thermal_printer.printImage(file).then(() => {
			thermal_printer.newLine();
			thermal_printer.newLine();

			Printer.printDirect({
				data: thermal_printer.getBuffer(),
				printer: ptr.name,
				type: 'RAW',
				success: function(job_id) {
					console.log('Printing Success:', job_id);
				},
				error: function(err) {
					console.error('Printing Error:', err);
				}
			});
		});
	})();

	res.send('Ok!');
});

app.listen(3000, function() {
	console.log('Sales & Dungeons Printer Service: listening on port 3000!');
	console.log('Printer:', ptr.name, '/', ptr.driverName, '/', ptr.portName);
});
