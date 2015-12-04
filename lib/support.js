var nconf;

module.exports = {

	toTitleCase: function(str) {
	    return str.replace(/\w\S*/g, function(txt) {
	    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	    });
	},

	toQueryString: function (obj) {
	    var parts = [];
	    for (var i in obj) {
	        if (obj.hasOwnProperty(i)) {
	            parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
	        }
	    }
	    return parts.join("&");
	},

	inventory: {
		import: function(path) {
			return require(path);
		},

		save: function(path, inventoryObj) {
			var fs = require('fs');
			fs.writeFileSync(path, JSON.stringify(inventoryObj));
		},

		compare: function(oldInventory, newInventory) {
			// go through the keys to newInventory; if a similar key doesn't exist in oldInventory, the
			// whole array in newInventory is new. If the key exists in both, run a difference between the two
			// arrays; the resultant array are all the new items in the pre-existing category.
			
			var toReturn = {};
			
			for (var newInventoryCategory in newInventory) {
				if (! oldInventory[newInventoryCategory]) {
					// the entire newInventoryCategory array is new
					// console.log(newInventoryCategory, "is new, has", newInventory[newInventoryCategory]);
					toReturn[newInventoryCategory] = newInventory[newInventoryCategory];
				} else {
					// there is a matching oldInventory category
					// diff the new and previous categories
					
					// ["a", "b", "c", "d"].filter(function(x){return ["a", "b", "c"].indexOf(x) == -1})
					// retrurns: ["d"]
					
					var newItems = newInventory[newInventoryCategory].filter(function(x) {
						return oldInventory[newInventoryCategory].indexOf(x) == -1;
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
	},

	sendEmail: function(from, to, subject, body, callback) {
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
		}, callback);
	},

	loadConfig: function(path) {
		var fs = require('fs');
		nconf = require('nconf');

		if (! fs.statSync(path).isFile()) {
			return new Error('Configuration file "config.json" not found. Please run "setup.py" to create it.');
		}

		return nconf.file(path);
	}

}