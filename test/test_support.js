var s = require('../lib/support.js'),
	pwd = process.env.PWD;

module.exports = {

	testLoadConfig: function(test) {
		test.ok(s.loadConfig(pwd + '/lib/config.json') instanceof Object);
		test.done();
	},

	testToTitleCase: function(test) {
		var expected = "Title Case",
			input = "title case";

		test.equal(expected, s.toTitleCase(input));
		test.done();
	},

	testToQueryString: function(test) {
		var expected = "a=1&b=2&c=3",
			input = {
				"a": 1,
				"b": 2,
				"c": 3
			};

		test.equal(expected, s.toQueryString(input));
		test.done();
	},

	inventory: {
		setUp: function(callback) {
			this.baseline = {
				"cat1": {
					"sku1": {
						"requested": 1,
						"purchased": 2
					},
					"sku2": {
						"requested": 3,
						"purchased": 4
					}
				},
				"cat2": {
					"sku3": {
						"requested": 5,
						"purchased": 6
					}
				}
			};

			this.newCategory = {
				"cat1": {
					"sku1": {
						"requested": 1,
						"purchased": 2
					},
					"sku2": {
						"requested": 3,
						"purchased": 4
					}
				},
				"cat2": {
					"sku3": {
						"requested": 5,
						"purchased": 6
					}
				},
				"cat3": {
					"sku4": {
						"requested": 7,
						"purchased": 8
					}
				}
			};

			this.newSku = {
				"cat1": {
					"sku1": {
						"requested": 1,
						"purchased": 2
					},
					"sku2": {
						"requested": 3,
						"purchased": 4
					}
				},
				"cat2": {
					"sku3": {
						"requested": 5,
						"purchased": 6
					},
					"sku4": {
						"requested": 7,
						"purchased": 8
					}
				}
			};

			this.newPurchase = {
				"cat1": {
					"sku1": {
						"requested": 1,
						"purchased": 2
					},
					"sku2": {
						"requested": 3,
						"purchased": 4
					}
				},
				"cat2": {
					"sku3": {
						"requested": 5,
						"purchased": 7
					}
				}
			};

			callback();
		},

		tearDown: function(callback) {
			callback();
		}

		testInventoryImport: function(test) {
			test.doesNotThrow(function() {
				return s.inventory.import(pwd + '/lib/inventory.json');
			});
			test.ok(s.inventory.import(pwd + '/lib/inventory.json') instanceof Object);
			test.done();
		},

		testInventorySave: function(test) {
			var fs = require('fs'),
				mock = require('mock-fs'),
				toWrite = this.baseline;

			// mock the filesystem so we can write an inventory file, then read it back as a parsed
			// JSON object and make sure it's a deep equal match to what was written. Tests the
			// inventory.save function without relying on inventory.import.

			mock({
				'../lib': {
					'inventory.json': 'foo'
				}
			});
			test.doesNotThrow(function() {
				s.inventory.save('../lib/inventory.json', toWrite);
			});
			test.deepEqual(toWrite, JSON.parse(fs.readFileSync('../lib/inventory.json')));
			mock.restore();
			
			test.done();
		},

		testInventoryCompareNoDifferences: function(test) {
			var expected = {};

			test.deepEqual(expected, s.inventory.compare(this.baseline, this.baseline));
			test.done();
		},

		testInventoryCompareNewCategory: function(test) {
			var expected = {
				"cat3": {
					"sku4": {
						"requested": 7,
						"purchased": 8
					}
				}
			};

			test.deepEqual(expected, s.inventory.compare(this.baseline, this.newCategory));
			test.done();
		},

		testInventoryCompareNewSku: function(test) {
			var expected = {
				"cat2": {
					"sku4": {
						"requested": 7,
						"purchased": 8
					}
				}
			};

			test.deepEqual(expected, s.inventory.compare(this.baseline, this.newSku));
			test.done();
		},

		testInventoryCompareNewItemPurchased: function(test) {
			var expected = {
				"cat2": {
					"sku3": {
						"requested": 5,
						"purchased": 7
					}
				}
			};

			test.deepEqual(expected, s.inventory.compare(this.baseline, this.newPurchase));
			test.done();
		}
	}
}