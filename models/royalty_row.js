var royalty_db = require('database.js');

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