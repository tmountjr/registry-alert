var s = require('../lib/support.js'),
	pwd = process.env.PWD;

module.exports = {
	testLoadConfig: function(test) {
		test.ok(s.loadConfig(pwd + '/lib/config.json') instanceof Object);
		test.done();
	},

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
			toWrite = {
				"a": [
					"z",
					"y"
				],
				"b": [
					"x",
					"w"
				]
			};

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

	testInventoryCompare: function(test) {
		var expected = {},
			oldInventory = newInventory = {
				"a": [
					"z",
					"y"
				],
				"b": [
					"x",
					"w"
				]
			};

		test.deepEqual(expected, s.inventory.compare(oldInventory, newInventory));
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
	}
}