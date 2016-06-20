var express = require('express');
var router = express.Router();

var sequelize = require('sequelize');
var royalty_row = require('../models/royalty_row.js');
var discrepancy_row = require('../models/discrepancy_row.js');
var author_approval = require('../models/author_approval.js');
var advance_row = require('../models/advances_row.js');

var royalty_db = require('../models/database.js');

var royalty_table = "royalty3_royalties";

var siren_uid = 276985;

/* SETTINGS */
router.post('/settings/save', function(req,res,next){
	var settings = req.body.settings;
	var fs = require('fs');
	settings.update_timestamp = Date.now();
	fs.writeFile( "settings.json", JSON.stringify( settings ), "utf8", function(){
		res.send(200);
	});
});

router.post('/settings/load', function(req,res,next){
	var fs = require('fs');
	fs.readFile('settings.json', 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	  	res.send(data);
	});
});

/* AUTHORS */

router.get_all_author_profile_data = function(quarter, year, callback)
{
	///real_name = 20
	///sid = 192
	///payment_method = 188
	var this_query = "SELECT DISTINCT(cfa.field_author_uid), (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 20 AND value IS NOT NULL) as real_name,"+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 192 AND value IS NOT NULL) as sid,"+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 188 AND value IS NOT NULL) as payment_method, "+
	" (SELECT SUM(royalty_amount) FROM royalty3_royalties WHERE quarter="+quarter+" AND y="+year+" AND author_uid = cfa.field_author_uid) as total_royalty "+
	" FROM profile_values as pv, content_field_publisher as cfp, content_field_author as cfa "+
	" WHERE cfp.field_publisher_uid = "+siren_uid+" AND cfa.nid = cfp.nid AND cfa.field_author_uid = pv.uid";
	
	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT}).then(function(all_author_data) {  			
  		callback(all_author_data);  		
  	});
}

router.get_all_author_names_report_data = function(quarter, year, callback)
{
	///author username (u.name) - per
	///uid - line
	///provider name - line
	///book title - line
	///quantity - line
	///royalty amount - line
	///total for author - line
	var this_query = "SELECT DISTINCT(cfa.field_author_uid) as uid, u.name as author_name"+	
	" FROM users as u, profile_values as pv, content_field_publisher as cfp, content_field_author as cfa "+
	" WHERE u.uid = cfa.field_author_uid AND cfp.field_publisher_uid = "+siren_uid+" AND cfa.nid = cfp.nid AND cfa.field_author_uid = pv.uid";	

	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT}).then(function(all_author_data) {  			
  		callback(all_author_data);  		
  	});
};

router.get_all_author_report_line_items = function(quarter, year, callback)
{

	var this_query = "SELECT rr.*, (SELECT provider_name FROM royalty3_providers WHERE id = rr.provider_id) as provider_name "+	
	" FROM royalty3_royalties as rr "+
	" WHERE quarter = " + quarter + " AND y = " + year +
	" ORDER BY author_uid DESC";
	
	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT}).then(function(all_author_data) {  			
  		callback(all_author_data);  		
  	});
};

router.get_all_provider_report_line_items = function(quarter, year, callback)
{
	//provider
	//title
	//qty
	//royalty amount

	var this_query = "SELECT rr.*, (SELECT provider_name FROM royalty3_providers WHERE id = rr.provider_id) as provider_name "+	
	" FROM royalty3_royalties as rr "+
	" WHERE quarter = " + quarter + " AND y = " + year +
	" ORDER BY author_uid DESC";
	
	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT}).then(function(all_provider_data) {  			
  		callback(all_provider_data);  		
  	});

};

router.get_all_publisher_publisher_report_data = function(quarter, year, callback)
{
	///real_name = 20
	///sid = 192
	///payment_method = 188
	var this_query = "SELECT DISTINCT(cfa.field_author_uid), (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 20 AND value IS NOT NULL) as real_name,"+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 192 AND value IS NOT NULL) as sid,"+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 188 AND value IS NOT NULL) as payment_method, "+
	" (SELECT SUM(royalty_amount) FROM royalty3_royalties WHERE quarter="+quarter+" AND y="+year+" AND author_uid = cfa.field_author_uid) as total_royalty "+
	" FROM profile_values as pv, content_field_publisher as cfp, content_field_author as cfa "+
	" WHERE cfp.field_publisher_uid = "+siren_uid+" AND cfa.nid = cfp.nid AND cfa.field_author_uid = pv.uid";
	//console.log(this_query);

	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT}).then(function(all_author_data) {  			
  		callback(all_author_data);  		
  	});
}

router.get_all_author_paypal_data = function(quarter, year, callback)
{
	///real_name = 20
	///sid = 192
	///payment_method = 188
	///paypal email = 19
	var this_query = "SELECT DISTINCT(cfa.field_author_uid), (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 20 AND value IS NOT NULL) as real_name,"+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 192 AND value IS NOT NULL) as sid,"+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 188 AND value IS NOT NULL) as payment_method, "+
	" (SELECT value FROM profile_values WHERE uid=cfa.field_author_uid AND fid = 19 AND value IS NOT NULL) as paypal_email, "+
	" (SELECT SUM(royalty_amount) FROM royalty3_royalties WHERE quarter="+quarter+" AND y="+year+" AND author_uid = cfa.field_author_uid) as total_royalty "+
	" FROM profile_values as pv, content_field_publisher as cfp, content_field_author as cfa "+
	" WHERE cfp.field_publisher_uid = "+siren_uid+" AND cfa.nid = cfp.nid AND cfa.field_author_uid = pv.uid";
	console.log(this_query);

	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT}).then(function(all_author_data) {  			
  		callback(all_author_data);  		
  	});
}

router.post('/authors/get_data/isbn', function(req,res,next){	
	
	var isbn = req.body.isbn;	
	
	isbn = isbn.replace("-","");

	var this_query = 
	"SELECT cfa.field_author_uid as uid, pv.value as sid " +
	"FROM content_type_product as ctp, content_field_author as cfa, profile_values as pv" +
	" WHERE cfa.field_author_uid = pv.uid" +
	" AND pv.fid = 192" +
	" AND ctp.nid = cfa.nid" +
	" AND replace(ctp.field_isbn_value,'-','') = '"+isbn+"'";	

	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
  	.then(function(authors) {
  		//console.log(authors);
    	//res.send(authors);
  });

});

router.post('/authors/get_uid/sid', function(req,res,next){
	var sid = req.body.sid;
});

router.post('/authors/get_all_statuses', function(req,res,next){
	var quarter = req.body.quarter.replace("Q","");
	var year = req.body.year;

	author_approval.findAll({where:{quarter: quarter, y:year}}).then(function(statuses){
		res.send(statuses);
	});
});

router.post('/authors/list', function(req,res,next){
	var this_query = "SELECT DISTINCT(u.uid), u.name, pv.value as sid, (SELECT value FROM profile_values WHERE uid=u.uid AND fid = 20) as real_name "
	+"FROM content_field_author as cfa, users as u, profile_values as pv, content_field_publisher as cfp "
	+"WHERE u.uid = cfa.field_author_uid AND pv.fid = 192 AND pv.uid = u.uid AND cfp.field_publisher_uid = 276985 AND cfp.nid = cfa.nid AND u.status = 1 "
	+"ORDER BY u.name";
	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
  	.then(function(authors) {
  		//console.log(authors);
  		res.send(JSON.stringify(authors));
  	});
});

router.post('/authors/unapprove_all', function(req,res,next){
	var quarter = req.body.quarter.replace("Q","");
	var year = req.body.year;

	author_approval.sync().then(function(){
		author_approval.update({
			show_author_flag:0
		}, {where:{quarter: quarter, y:year}}).then(res.send(200));
	});
});

router.post('/authors/change_status', function(req,res,next){
	var quarter = req.body.quarter.replace("Q","");
	var year = req.body.year;
	var force_status = req.body.force_status;
	var author_uid = req.body.author_uid, show_author_flag_change = 0;

	author_approval.findAll({where:{quarter: quarter, y:year, author_uid:author_uid}}).then(function(rows){
		if(rows.length > 0) ///update existing rows
		{
			for(row in rows)
			{
				if(rows[row].show_author_flag == 1)
					show_author_flag_change = 0;
				else
					show_author_flag_change = 1;
			}

			if(force_status != undefined && force_status === 'unapprove')
				show_author_flag_change = 0;
			else if(force_status != undefined && force_status === 'approve')
				show_author_flag_change = 1;
	
			author_approval.sync().then(function(){
				return author_approval.update({
					show_author_flag:show_author_flag_change
				}, {where: {id:rows[row].id}});
			}).then(res.send({author_status:show_author_flag_change}));
		}
		else
		{
			if(force_status != undefined && force_status === 'unapprove')
				show_author_flag_change = 0;
			else if(force_status != undefined && force_status === 'approve')
				show_author_flag_change = 1;

			author_approval.sync().then(function(){
				return author_approval.create({
					quarter: quarter,
					y: year,
					author_uid: author_uid,
					show_author_flag:show_author_flag_change
				}).then(res.send({author_status:show_author_flag_change}));
			});
		}
	});
});

router.post('/authors/get_provider_total', function(req,res,next){
	var quarter = req.body.quarter.replace("Q","");
	var year = req.body.year;
	var provider = req.body.provider;
	var author_uid = req.body.author_uid;

	var this_query = "SELECT provider_id, SUM(royalty_amount) as total_royalty FROM royalty3_royalties WHERE "+
	"quarter = "+quarter+" AND y="+year+" AND provider_id="+provider+" AND author_uid="+author_uid;

	

	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
  	.then(function(total) {
  		if(total[0].provider_id == null)
  			total[0].provider_id = provider;
    	res.send(total);
  });

});

/* SITE DATA */

/* PROVIDERS */
var Providers = require('../models/providers.js');

router.post('/providers/save', function(req, res, next) {
	var provider_name = req.body.provider.name;
	var provider_data = JSON.stringify(req.body.provider);

	if(typeof req.body.provider.id !== 'undefined')
	{
		Providers.sync().then(function(){
			return Providers.update({
				provider_name: provider_name,
				provider_data: provider_data,
				}, {
					where:
					{
						id: req.body.provider.id
					}
				});
		});
	}
	else
	{
		Providers.sync().then(function(){
			return Providers.create({
				provider_name: provider_name,
				provider_data: provider_data
			});
		});
	}
	res.send(200);
});

router.post('/providers/list', function(req,res,next){	
	Providers.sync().then(function(){
		Providers.findAll().then(function(providers){
			res.send(providers);
		});		
	});	
});

router.post('/providers/loadOne', function(req,res,next){	
	Providers.sync().then(function(){
		Providers.findAll({where:{id: req.body.provider_id}
		}).then(function(providers){
			res.send(providers);
		});		
	});	
});

router.post('/providers/delete', function(req,res,next){
	Providers.sync().then(function(){
		Providers.destroy({where:{id: req.body.provider_id}}).then(function(){
			res.send(200);
		});		
	});
});

router.post('/providers/check_entries', function(req,res,next){	
	
	royalty_row.sync().then(function(){
		royalty_row.count({where:{provider_id: req.body.provider_id, quarter:req.body.quarter.replace("Q",""), y:req.body.year}}).then(function(entries){

			res.send({entries:entries, provider_id:req.body.provider_id});
		});		
	});	
});

router.post('/providers/check_advances_entries', function(req,res,next){	
	
	advance_row.sync().then(function(){
		advance_row.count({where:{quarter:req.body.quarter.replace("Q",""), y:req.body.year}}).then(function(entries){

			res.send({entries:entries});
		});		
	});	
});

router.get_advances = function(quarter, y, callback)
{
	advance_row.findAll({where:{quarter:quarter, y:y}}).then(function(result){
		res.send(result);
	});
};

router.post('/providers/get_matching_fields', function(req,res,next){
	var this_query = "SELECT field_name, label FROM node_field_instance";
	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
  	.then(function(labels) {
  		//console.log(authors);
    	res.send(labels);
  	});
});

router.get_isbn_from_match_field = function(match_field, callback)
{
	var field = match_field;	
	var this_query = "SELECT "+match_field+"_value as 'this_match_field', field_isbn_value FROM content_type_product WHERE CHAR_LENGTH("+match_field+"_value) > 2";
	
	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
  	.then(function(field_data) {
  		//console.log(authors);
  		callback(field_data);
  	});
};

router.delete_provider_data = function(provider_id, quarter, year,callback)
{
	quarter = quarter.replace("Q","");
	var this_query = "DELETE FROM royalty3_royalties WHERE quarter="+quarter+" AND y="+year+" AND provider_id = "+provider_id;	
	//console.log(this_query);
	royalty_db.query(this_query, { type: sequelize.QueryTypes.DELETE}).then(function(){
		callback(quarter);
	});		
};

router.delete_all_data = function(quarter, year, callback)
{
	quarter = quarter.replace("Q","");
	var this_query = "DELETE FROM royalty3_royalties WHERE quarter="+quarter+" AND y="+year, this_query_2;
	royalty_db.query(this_query, { type: sequelize.QueryTypes.DELETE}).then(function(){
		this_query_2 = "DELETE FROM royalty3_advances_authors WHERE quarter="+quarter+" AND y="+year;
		royalty_db.query(this_query_2, { type: sequelize.QueryTypes.DELETE}).then(function(){
			callback(quarter);
		});
	});
};

router.delete_all_quarter_pdfs = function(quarter, year, callback)
{
	
};

router.delete_advances_data = function(quarter, year, callback)
{
	quarter = quarter.replace("Q","");

	var this_query = "DELETE FROM royalty3_advances_authors WHERE quarter="+quarter+" AND y="+year;	

	royalty_db.query(this_query, { type: sequelize.QueryTypes.DELETE}).then(function(){
		callback(quarter);
	});
};

router.post('/providers/clear_data', function(req,res,next){
	router.delete_provider_data(req.body.provider_id, req.body.quarter, req.body.year, function(quarter){
		res.send(200);
	});
});

router.post('/providers/clear_all_data', function(req,res,next){
	if(req.body.key == "7639b12eb41a626c671c35c974013026")
	{
		router.delete_all_data(req.body.quarter, req.body.year, function(quarter){
			res.send(200);
		});
	}
	else
		res.send(500);
});

router.post('/publish_quarter', function(req,res,next){
	var quarter = req.body.quarter, year = req.body.year;
	var now = Math.round(+new Date()/1000);

	if(quarter && year)
	{
		var this_query = "INSERT INTO royalty3_quarters_published (quarter, y, is_published, timestamp) VALUES ("
		+ quarter+","+year+",1,"+now+")";

		royalty_db.query(this_query, { type: sequelize.QueryTypes.INSERT})
	  	.then(function(results) {  		
	    	res.send(200);
	  	});
  	}
});

router.post('/unpublish_quarter', function(req,res,next){
	var quarter = req.body.quarter, year = req.body.year;	

	if(quarter && year)
	{
		var this_query = "DELETE FROM royalty3_quarters_published WHERE quarter="+quarter+" AND y="+year;

		royalty_db.query(this_query, { type: sequelize.QueryTypes.DELETE})
	  	.then(function(results) {  		
	    	res.send(200);
	  	});
	}
});

router.post('/check_quarter', function(req,res,next)
{
	var quarter = req.body.quarter, year = req.body.year;
	if(quarter && year)
	{
		var this_query = "SELECT * FROM royalty3_quarters_published WHERE quarter="+quarter+" AND y="+year;

		royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
	  	.then(function(results) {  
	  		console.log(results);		
	    	res.send(results);
	  	});
	}
});

router.get_author_data_by_isbn = function(callback)
{
	//isbn = isbn.toString().replace("-","");

	var this_query = 
	"SELECT replace(replace(ctp.field_isbn_value,'-',''), ' ', '') as isbn, replace(replace(ctp.field_print_isbn__value,'-',''), ' ', '') as print_isbn, "+
	" replace(replace(ctp.field_isbn13_value,'-',''), ' ', '') as isbn13, cfa.field_author_uid as uid, ctp.field_print_price_value as print_price, ucp.sell_price as sell_price "+
	" FROM content_type_product as ctp, content_field_author as cfa, content_field_publisher as cfp, uc_products as ucp" +
	" WHERE ctp.nid = cfa.nid AND LENGTH(replace(ctp.field_isbn_value,'-','')) > 9 AND LENGTH(replace(ctp.field_isbn_value,'-','')) < 14 " +
	" AND cfp.nid = cfa.nid AND cfp.field_publisher_uid = 276985 AND ucp.nid = cfp.nid";	
	//console.log(this_query);
	//" AND replace(ctp.field_isbn_value,'-','') = '"+isbn+"'";	

	royalty_db.query(this_query, { type: sequelize.QueryTypes.SELECT})
  	.then(function(authors) {
  		//console.log(authors);
    	callback(authors);
  });
};

/* TOOLS */

router.post('/tools/find_line_by_title', function(req, res, next)
{	
	royalty_row.findAll({where:{
		title:{
			like: req.body.title + '%'
		},
		provider_id: req.body.provider
	}}).then(function(result){
		res.send(result);
	});
});

router.post('/tools/find_line_by_isbn', function(req,res,next)
{
	isbn = req.body.isbn.replace("-","");
	royalty_row.findAll({where:{
		isbn: isbn,
		provider_id: req.body.provider
	}}).then(function(result){
		res.send(result);
	});
});

router.post('/tools/save_line', function(req,res,next){
	royalty_row.sync().then(function(){
		royalty_row.update(
			req.body.line
		, {where: {id:req.body.line.id}});
	}).then(function(result){
		res.send(result);
	});
});

router.post('/tools/load_discrepancies', function(req,res,next){
	var quarter = req.body.quarter.replace("Q","");
	discrepancy_row.findAll({where:{
		quarter: quarter,
		y: req.body.year,
		resolved: 0,
	}}).then(function(result){
		res.send(result);
	});
});

router.post('/tools/correct_discrepancy', function(req,res,next){
	
});

module.exports = router;