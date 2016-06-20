var sequelize = require('sequelize');

var external_db_url = "mysql://localhost";

var royaltyCalc_db = new sequelize(external_db_url,
	{logging: false, pool: {
        	minConnections: 50,
        	maxIdleTime: 5000
    	}
    });

module.exports = royaltyCalc_db;