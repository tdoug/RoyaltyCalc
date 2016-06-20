var royalty_db = require('database.js');

var Advances_Row = royalty_db.define('royaltyCalc_advances_authors', {	
	author_uid: sequelize.INTEGER,
	advance_code: sequelize.INTEGER,
	quarter: sequelize.STRING,
	y: sequelize.INTEGER,
	advance_amount: sequelize.FLOAT,
}, 
{
	timestamps:false
});

module.exports = Advances_Row;