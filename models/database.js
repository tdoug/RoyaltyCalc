var sequelize = require('sequelize');

var royaltyCalc_db = new sequelize(process.env.DB_URL,
	{logging: false, pool: {
        	minConnections: 50,
        	maxIdleTime: 5000
    	}
    });

module.exports = royaltyCalc_db;