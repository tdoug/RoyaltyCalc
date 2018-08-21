// this model stores discrepancies in the spreadsheets provided by vendors, such as deviations from 
// expected formatting, empty columns, etc.
var royalty_db = require('./database');
var sequelize = require('sequelize');

var Discrepancy_Row = royalty_db.define('royaltyCalc_discrepancies', {	
	quarter: sequelize.STRING,
	y: sequelize.INTEGER,
	provider_id: sequelize.INTEGER,
	filename: sequelize.STRING,
	row_number: sequelize.INTEGER,
	title: sequelize.STRING,
	author: sequelize.STRING,	
	quantity: sequelize.INTEGER,
	price: sequelize.INTEGER,
	discrepancy_type: sequelize.STRING,
	resolved: sequelize.INTEGER,
	fictionwise_due: sequelize.DECIMAL,
}, 
{
	timestamps:false
});


module.exports = Discrepancy_Row;