var royalty_db = require('database.js');

var Royalty_Row = royalty_db.define('royaltyCalc_authors_approved_reports', {	
	author_uid: sequelize.INTEGER,
	quarter: sequelize.STRING,
	y: sequelize.INTEGER,
	show_author_flag: sequelize.INTEGER
}, 
{
	timestamps:false
});

module.exports = Royalty_Row;