#!/usr/bin/env node

var fs = require('fs'),
	nconf = require('nconf'),
	request = require('request'),
	cheerio = require('cheerio'),
	newInventory = [];

// for now, just read the response.html file in the project root.
var response = fs.readFileSync('./response.html');
newInventory = parseResponse(response);
fs.writeFileSync('./inventory.json', JSON.stringify(newInventory));

currentInventory = importInventory('./inventory.json');

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}


function parseResponse(rawHtmlResponse) {
	var $ = cheerio.load(rawHtmlResponse),
		inventory = {}

	$("h2.ui-accordion-header").each(function(h2Index, h2Element) {

		var thisCategoryName = $(this).find('a').text().replace(/\s\(\d+\)$/, '');

		inventory[thisCategoryName] = [];

		$(this).next('div.accordionDiv').find('li.productRow').each(function(liIndex, liElement) {
			var thisCategoryList = {},
				hiddenInputs = $(this).find('li.productLastColumn');

			thisCategoryList.title = $(this).find('li.productName span.blueName a').text().trim();
			thisCategoryList.sku = $(hiddenInputs).find('input[name=skuId]').val();
			thisCategoryList.pid = $(hiddenInputs).find('input[name=prodId]').val();

			inventory[thisCategoryName].push(thisCategoryList.sku);
		});

	});

	return inventory;
}

function importInventory(path) {
	return require(path);
}

function compareInventories(prevInventory, newInventory) {
	// go through the keys to newInventory; if a similar key doesn't exist in prevInventory, the
	// whole array in newInventory is new. If the key exists in both, run a difference between the two
	// arrays; the resultant array are all the new items in the pre-existing category.
}