var alert = require('../lib/index.js'),
	s = require('../lib/support.js');

module.exports = {
	testLoadConfig: function(test) {
		test.ok(s.loadConfig(process.env.PWD + '/lib/config.json'));
		test.done();
	}
}