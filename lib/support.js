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
			try {
				return require(path);
			} catch (e) {
				return {};
			}
		},

		save: function(path, inventoryObj) {
			var fs = require('fs');
			fs.writeFileSync(path, JSON.stringify(inventoryObj));
		},

		compare: function(oldInventory, newInventory) {
			var toReturn = {};

			for (var ic in newInventory) {
				var nCategory = newInventory[ic];

				if (! oldInventory[ic]) {
					// oldInventory doesn't contain the entire category
					toReturn[ic] = nCategory;
				} else {
					// oldInventory has the category; loop through skus
					for (var sku in nCategory) {
						var nSku = nCategory[sku];

						if (! oldInventory[ic][sku]) {
							// oldInventory doesn't have this sku in the category
							if (! toReturn[ic]) toReturn[ic] = {};
							toReturn[ic][sku] = nSku;
						} else {
							// oldInventory has the sku; compare 'requested/purchased' hash
							var oSku = oldInventory[ic][sku],
								oSkuHash = oSku['purchased'].toString() + "/" + oSku['requested'].toString(),
								nSkuHash = nSku['purchased'].toString() + "/" + nSku['requested'].toString();

							if (oSkuHash != nSkuHash) {
								if (! toReturn[ic]) toReturn[ic] = {};
								toReturn[ic][sku] = {
									"requested": nSku['requested'],
									"purchased": nSku['purchased']
								};
							}
						}
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