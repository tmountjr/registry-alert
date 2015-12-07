#!/usr/local/bin/node

var fs = require('fs'),
	http = require('http'),
	cheerio = require('cheerio'),
	s = require('./support.js'),
	paths = {
		'inventory': process.env.PWD + '/lib/inventory.json',
		'config': process.env.PWD + '/lib/config.json'
	},
	nconf = s.loadConfig(paths.config),
	requestObject = {
		registryId: nconf.get("bbb:registryId"),
		startIdx: "0",
		isGiftGiver: true,
		blkSize: "1000",
		isAvailForWebPurchaseFlag: false,
		userToken: "UT1021",
		sortSeq: "1",
		view: "1",
		eventTypeCode: "BRD",
		eventType: "Wedding",
		pwsurl: '',
		totalToCopy: 89
	},
	options = {
		'host': 'www.bedbathandbeyond.com',
		'path': '/store/giftregistry/frags/registry_items_guest.jsp?' + s.toQueryString(requestObject),
		'headers': {
			'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
		}
	},
	callback = function(response) {
		var body = '';

		response.on('data', function(chunk) {
			body += chunk;
		});

		// all the good stuff happens here
		response.on('end', function() {
			var oldInventory = s.inventory.import(paths.inventory),	// loaded from disk or memory
				newInventory = parseResponse(body),					// parsed from raw HTML request response
				d = new Date();

			console.log(newInventory);
			return;

			compared = s.inventory.compare(oldInventory, newInventory);
			// console.log(compared);

			if (Object.keys(compared).length == 0) {
				// nothing new found
				console.log(d + "\tNo new items found.");
			} else {
				var $ = cheerio.load(body),
					emailBody = "The following new items have been found:\n";

				for (var category in compared) {
					emailBody += "\n\tCategory: " + category + "\n";
					for (var sku in compared[category]) {
						var title = $("span.blueName a[data-skuid=" + sku + "]").text().replace(/\s\(\d+\)$/, '');
						if (title == '') title = '(No title found. Check the website for details.)';
						emailBody += "\t" + title + "(" + compared[category][sku][purchased].toString() + " out of " + compared[category][sku][requested].toString() + ")"
					}
				}

				// console.log(emailBody);
				console.log(d + "\tNew items found: ", compared);
				s.sendEmail(
					nconf.get("smtp:from"),
					nconf.get("smtp:to"),
					'New Wedding Registry Items!',
					emailBody,
					function(err, info) {
						if (err) {
							throw err;
						} else {
							// email sent, so save the new inventory to disk
							s.inventory.save(paths.inventory, newInventory);
						}
					}
				);
			}
		});
	};

http.request(options, callback).end();

///////////////////////
// SUPPORT FUNCTIONS //
///////////////////////

function parseResponse(rawHtmlResponse) {
	var $ = cheerio.load(rawHtmlResponse),
		inventory = {};

	$("h2.ui-accordion-header").each(function(h2Index, h2Element) {

		var thisCategoryName = $(this).find('a').text().replace(/\s\(\d+\)$/, '');

		if (inventory[thisCategoryName])
			thisCategoryName += " [ISO]"	// this means the category is in-store only, not available online

		inventory[thisCategoryName] = {};

		$(this).next('div.accordionDiv').find('li.productRow').each(function(liIndex, liElement) {
			var thisCategoryList = {},
				hiddenInputs = $(this).find('li.productLastColumn'),
				sku = $(hiddenInputs).find('input[name=skuId]').val(),
				requested = $(this).find('li.requested').text().trim().replace(/.*\s(\d+)/, "$1"),
				purchased = $(this).find('li.purchase').text().trim().replace(/.*\s(\d+)/, "$1");

			inventory[thisCategoryName][sku] = {
				"requested": requested,
				"purchased": purchased
			}

			// thisCategoryList.title = $(this).find('li.productName span.blueName a').text().trim();
			// thisCategoryList.sku = $(hiddenInputs).find('input[name=skuId]').val();
			// thisCategoryList.pid = $(hiddenInputs).find('input[name=prodId]').val();

			// inventory[thisCategoryName].push(thisCategoryList.sku);
		});

	});

	return inventory;
}
