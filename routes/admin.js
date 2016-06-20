var express = require('express');
var router = express.Router();

router.get('/', function(req,res,next){
	if(req.user != 'admin')
		res.send("Access Denied - You are not logged in as an administrator.");
	
	res.render('settings/admin', {title:'Administrator Settings'});
});

module.exports = router;