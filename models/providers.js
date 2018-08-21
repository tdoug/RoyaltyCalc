// this model stores the list of vendor providers who provide data to the publishing company
var royalty_db = require('./database');
var sequelize = require('sequelize');

var Provider = royalty_db.define('royaltyCalc_providers', {	
	provider_name : sequelize.STRING,
	provider_data: sequelize.TEXT
}, 
{
	timestamps:false
});

module.exports = Provider;