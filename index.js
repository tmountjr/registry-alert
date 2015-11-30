#!/usr/bin/env node

var fs = require('fs'),
	nconf = require('nconf'),
	http = require('http'),
	cheerio = require('cheerio'),
	requestObject,
	oldInventory,	// loaded from disk or memory
	newInventory;	// parsed from raw html request response

nconf.file('config.json');

// dropping this here so things can be changed later on if necessary
requestObject = {
	registryId: "542647053",
	startIdx: "0",
	isGiftGiver: true,
	blkSize: "1000",
	isAvailForWebPurchaseFlag: false,
	userToken: "UT1021",
	sortSeq: "1",
	view: "3",
	eventTypeCode: "BRD",
	eventType: "Wedding",
	pwsurl: '',
	totalToCopy: 85
};

var options = {
	'host': 'www.bedbathandbeyond.com',
	'path': '/store/giftregistry/frags/registry_items_guest.jsp?' + toQueryString(requestObject),
	'headers': {
		'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.86 Safari/537.36'
	}
};

var callback = function(response) {
	var str = '';

	response.on('data', function(chunk) {
		str += chunk;
	});

	// all the good stuff happens here
	response.on('end', function() {
		oldInventory = importInventory('./inventory.json');
		newInventory = parseResponse(str);

		compared = compareInventories(oldInventory, newInventory);
		// console.log(compared);

		if (Object.keys(compared).length == 0) {
			// nothing new found
		} else {
			var $ = cheerio.load(str),
				emailBody = "The following new items have been found:\n";

			for (var category in compared) {
				emailBody += "\n\tCategory: " + category + "\n";
				for (var i = 0; i < compared[category].length; i++) {
					var sku = compared[category][i];

					// search the raw response for a matching sku
					var title = $("span.blueName a[data-skuid=" + sku + "]").text().replace(/\s\(\d+\)$/, '');
					if (title == '') title = '(No title found. Check the website for details.)';
					emailBody += "\t" + title + "\n";
				}
			}

			// console.log(emailBody);
			sendEmail(
				nconf.get("smtp:from"),
				nconf.get("smtp:to"),
				'New Wedding Registry Items!',
				emailBody
			);
		}
	});
}

http.request(options, callback).end();


///////////////////////
// SUPPORT FUNCTIONS //
///////////////////////

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function toQueryString(obj) {
    var parts = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
        }
    }
    return parts.join("&");
}

function parseResponse(rawHtmlResponse) {
	var $ = cheerio.load(rawHtmlResponse),
		inventory = {};

	$("h2.ui-accordion-header").each(function(h2Index, h2Element) {

		var thisCategoryName = $(this).find('a').text().replace(/\s\(\d+\)$/, '');

		if (inventory[thisCategoryName])
			thisCategoryName += " [ISO]"	// this means the category is in-store only, not available online

		inventory[thisCategoryName] = [];

		$(this).next('div.accordionDiv').find('li.productRow').each(function(liIndex, liElement) {
			var thisCategoryList = {},
				hiddenInputs = $(this).find('li.productLastColumn');

			// thisCategoryList.title = $(this).find('li.productName span.blueName a').text().trim();
			thisCategoryList.sku = $(hiddenInputs).find('input[name=skuId]').val();
			// thisCategoryList.pid = $(hiddenInputs).find('input[name=prodId]').val();

			inventory[thisCategoryName].push(thisCategoryList.sku);
		});

	});

	return inventory;
}

function importInventory(path) {
	return require(path);
}

function saveInventory(path, inventory) {
	fs.writeFileSync(path, JSON.stringify(inventory));
}

function compareInventories(prevInventory, newInventory) {
	// go through the keys to newInventory; if a similar key doesn't exist in prevInventory, the
	// whole array in newInventory is new. If the key exists in both, run a difference between the two
	// arrays; the resultant array are all the new items in the pre-existing category.
	
	var toReturn = {};
	
	for (var newInventoryCategory in newInventory) {


		if (! prevInventory[newInventoryCategory]) {
			// the entire newInventoryCategory array is new
			// console.log(newInventoryCategory, "is new, has", newInventory[newInventoryCategory]);
			toReturn[newInventoryCategory] = newInventory[newInventoryCategory];
		} else {
			// there is a matching prevInventory category
			// diff the new and previous categories
			
			// ["a", "b", "c", "d"].filter(function(x){return ["a", "b", "c"].indexOf(x) == -1})
			// retrurns: ["d"]
			
			var newItems = newInventory[newInventoryCategory].filter(function(x) {
				return prevInventory[newInventoryCategory].indexOf(x) == -1;
			});

			if (newItems.length == 0) {
				// no new items for this category
			} else {
				// console.log(newInventoryCategory, "now has", newItems);
				toReturn[newInventoryCategory] = newItems;
			}

		}
	}

	return toReturn;
}

function sendEmail(from, to, subject, body) {
	var nodemailer = require('nodemailer'),
		smtpTransport = require('nodemailer-smtp-transport'),
		transporter;

	transporter = nodemailer.createTransport(smtpTransport({
		'host': 'smtp.1and1.com',
		'port': 587,
		'auth': {
			'user': nconf.get('smtp:username'),
			'pass': nconf.get('smtp:password')
		}
	}));

	transporter.sendMail({
		'from': from,
		'to': to,
		'subject': subject,
		'text': body
	}, function(err, info) {
		if (err) throw err;
	});
}