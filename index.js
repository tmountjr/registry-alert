#!/usr/bin/env node

var fs = require('fs'),
	nconf = require('nconf'),
	request = require('request'),
	cheerio = require('cheerio');

var oldInventory = importInventory('./oldInventory.json');
var newInventory = importInventory('./newInventory.json');

console.log(compareInventories(oldInventory, newInventory));


///////////////////////
// SUPPORT FUNCTIONS //
///////////////////////

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

function saveInventory(path, inventory) {
	fs.writeFileSync(path, JSON.stringify(inventory));
}

function compareInventories(prevInventory, newInventory) {
	// go through the keys to newInventory; if a similar key doesn't exist in prevInventory, the
	// whole array in newInventory is new. If the key exists in both, run a difference between the two
	// arrays; the resultant array are all the new items in the pre-existing category.
	
	var toReturn = {};
	
	for (newInventoryCategory in newInventory) {


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