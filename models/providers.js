var royalty_db = require('database.js');

var Provider = royalty_db.define('royaltyCalc_providers', {	
	provider_name : sequelize.STRING,
	provider_data: sequelize.TEXT
}, 
{
	timestamps:false
});

module.exports = Provider;