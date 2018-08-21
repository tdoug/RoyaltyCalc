// this stores the total tabulated royalty to be paid to a given author for a given quarter/year.  Data is taken from all
// vendor provided spreadsheets.
var royalty_db = require('./database');
var sequelize = require('sequelize');

var Royalty_Row = royalty_db.define('royaltyCalc_royalties', {	
	author_uid: sequelize.INTEGER,
	provider_id: sequelize.INTEGER,
	quarter: sequelize.STRING,
	y: sequelize.INTEGER,
	title: sequelize.STRING,
	isbn: sequelize.STRING,
	royalty_amount: sequelize.FLOAT,
	qty: sequelize.INTEGER, 
	price:sequelize.FLOAT
}, 
{
	timestamps:false
});

module.exports = Royalty_Row;