var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var xlsx = require('xlsx');
var json2csv = require('json2csv');
var http = require('http');
var url = require('url');
var api = require('../routes/api.js');

///reports
router.get('/quickbooks', function(req, res, next) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var quarter = query.quarter.replace("Q",""), year = query.year;

	var headers = ['Vendor','Transaction Date',	'RefNumber', 'Bill Due', 'Terms', 'Memo', 'Address Line1', 
	'Address Line2',	'Address Line3', 'Address Line4', 'Address City','Address State', 'Address PostalCode', 
	'Address Country', 'Vendor Acct No',	'Expenses Account',	'Expenses Amount',	'Expenses Memo', 'Expenses Class',
	'Expenses Customer', 'Expenses Billable', 'Items Item',	'Items Qty', 'Items Description', 'Items Cost', 
	'Items Class', 'Items Customer', 'Items Billable', 'AP Account'];
	api.get_all_author_profile_data(quarter, year, function(author_profile_data){
		
		var exp_account = 'Royalty Expense Paid:Author';
		var ref_number_counter = 0;
		var start_m, end_m, start_date, end_date, trans_date = 1; 
		var ref_number_base = year + quarter + 'Q_Royalties', report = [], this_entry, accts_payable;

		if(quarter == 1)
			trans_date = '4';
		else if (quarter == 2)
			trans_date = '7';
		else if (quarter == 3)
			trans_date = '10';

		trans_date = trans_date + '/30/' + year;

		for(this_data in author_profile_data)
		{
			if(author_profile_data[this_data].total_royalty == null)
				continue;

			if(author_profile_data[this_data].payment_method == 'direct_deposit')
				author_profile_data[this_data].payment_codeval = 'EFT';
			if(author_profile_data[this_data].payment_method == 'paypal')
				author_profile_data[this_data].payment_codeval = 'PayPal';
			if(author_profile_data[this_data].payment_method == 'check')
				author_profile_data[this_data].payment_codeval = 'Checks';
			if(author_profile_data[this_data].payment_method == 'wire')
				author_profile_data[this_data].payment_codeval = 'Wire';

			ref_number_counter = ref_number_counter + 1;

			accts_payable = "Accounts Payable (Advances neg):Author:"+author_profile_data[this_data].payment_codeval;

			this_entry = {};
			this_entry['Vendor'] = author_profile_data[this_data].real_name;
			this_entry['Transaction Date'] = trans_date;
			this_entry['RefNumber'] = ref_number_base + "_" + ref_number_counter;
			this_entry['Bill Due'] = trans_date;
			this_entry['Terms'] = " ";
			this_entry['Memo'] = ref_number_base;
			this_entry['Address Line1'] = " ";
			this_entry['Address Line2'] = " ";
			this_entry['Address Line3'] = " ";
			this_entry['Address Line4'] = " ";
			this_entry['Address City'] = " ";
			this_entry['Address State'] = " ";
			this_entry['Address PostalCode'] = " ";
			this_entry['Address Country'] = " ";
			this_entry['Vendor Acct No'] = author_profile_data[this_data].sid;
			this_entry['Expenses Account'] = exp_account;
			this_entry['Expenses Amount'] = author_profile_data[this_data].total_royalty;
			this_entry['Expenses Memo'] = ref_number_base;
			this_entry['Expenses Class'] = " ";
			this_entry['Expenses Billable'] = " ";
			this_entry['Items Item'] = " ";
			this_entry['Items Qty'] = " ";
			this_entry['Items Description'] = " ";
			this_entry['Items Cost'] = " ";
			this_entry['Items Class'] = " ";
			this_entry['Items Customer'] = " ";
			this_entry['Items Billable'] = " ";
			this_entry['AP Account'] = accts_payable;

			report.push(this_entry);
		}		

		json2csv({ data: report, fields: headers }, function(err, csv) {
		  if (err) console.log(err);
		  res.writeHead(200, {
		       'Content-Type': 'text/csv',
		       'Content-Length': csv.length
		  });
		  res.charset = 'UTF-8';
		  res.write(csv);
		  res.end();

		});
	});	
});

router.get('/paypal', function(req, res, next) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var quarter = query.quarter.replace("Q",""), year = query.year, report = [], this_entry;

	var headers = ['Paypal Email Address', 'Balance Total', 'Currency', 'Vendor'];
	
	api.get_all_author_paypal_data(quarter, year, function(author_profile_data){
		for(this_data in author_profile_data)
		{
			if(author_profile_data[this_data].payment_method == 'paypal')
			{
				if(author_profile_data[this_data].total_royalty == 0 || author_profile_data[this_data].total_royalty == null)
					continue;
				if(author_profile_data[this_data].paypal_email == null)
					continue;

				this_entry = {};
				
				///todo advances
				this_entry['Paypal Email Address'] = author_profile_data[this_data].paypal_email;
				this_entry['Balance Total'] = author_profile_data[this_data].total_royalty;
				this_entry['Currency'] = "USD";
				this_entry['Vendor'] = author_profile_data[this_data].real_name;
				
				report.push(this_entry);
			}
		}

		console.log(report);

		json2csv({ data: report, fields: headers }, function(err, csv) {
		  if (err) console.log(err);
		  res.writeHead(200, {
		       'Content-Type': 'text/csv',
		       'Content-Disposition': 'attachment; filename=paypal.csv',
		       'Content-Length': csv.length
		  });
		  res.charset = 'UTF-8';
		  res.write(csv);
		  res.end();

		});
	});
});

router.get('/authors', function(req, res, next) {
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var quarter = query.quarter.replace("Q",""), year = query.year, report = [], this_entry;

	var headers = ['Name', 'UID', 'Provider', 'Title', 'Quantity', 'Royalty Amount', 'Total for Author'];
	var current_author_uid, running_total = 0;
	var this_entry, report = [];

	api.get_all_author_names_report_data(quarter, year, function(all_author_names){		

		api.get_all_author_report_line_items(quarter, year, function(all_author_data)
		{
			for(this_author_data in all_author_data)
			{
				if(current_author_uid == undefined)
					current_author_uid = all_author_data[this_author_data].author_uid;

				if(current_author_uid != all_author_data[this_author_data].author_uid)
				{
					current_author_uid = all_author_data[this_author_data].author_uid;

					this_entry = {};
					this_entry['Total for Author'] = running_total;

					running_total = 0;
					report.push(this_entry);
				}


				this_entry = {};

				for(this_author_name in all_author_names)
				{
					if(all_author_names[this_author_name].uid == all_author_data[this_author_data].author_uid)
					{
						this_entry['Name'] = all_author_names[this_author_name].author_name;
					}
				}

				this_entry['UID'] = all_author_data[this_author_data].author_uid;
				this_entry['Title'] = all_author_data[this_author_data].author_uid;
				this_entry['UID'] = all_author_data[this_author_data].author_uid;
				this_entry['Provider'] = all_author_data[this_author_data].provider_name;
				this_entry['Title'] = all_author_data[this_author_data].title;
				this_entry['Quantity'] = all_author_data[this_author_data].qty;
				this_entry['Royalty Amount'] = all_author_data[this_author_data].royalty_amount;
				running_total = running_total + all_author_data[this_author_data].royalty_amount;
				report.push(this_entry);
			}

			this_entry = {};
			this_entry['Total for Author'] = running_total;
			running_total = 0;
			report.push(this_entry);

			json2csv({ data: report, fields: headers }, function(err, csv) {
			  if (err) console.log(err);
			  res.writeHead(200, {
			       'Content-Type': 'text/csv',
			       'Content-Disposition': 'attachment; filename=author_report.xls',
			       'Content-Length': csv.length
			  });
			  res.charset = 'UTF-8';
			  res.write(csv);
			  res.end();

			});
		});

		
	});

	
});

router.get('/provider', function(req, res, next) {
	var headers = ['Provider', 'Title','Quantity','Royalty Amount','Total for Provider'];
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var quarter = query.quarter.replace("Q",""), year = query.year, report = [], this_entry;

	var current_provider_id, running_total = 0;
	var this_entry, report = [];

	api.get_all_provider_report_line_items(quarter, year, function(all_provider_data)
	{
		for(this_provider_data in all_provider_data)
		{		
			if(current_provider_id == undefined)
				current_provider_id = all_provider_data[this_provider_data].provider_id;

			if(current_provider_id != all_provider_data[this_provider_data].provider_id)
			{
				current_provider_id = all_provider_data[this_provider_data].provider_id;

				this_entry = {};
				this_entry['Total for Provider'] = running_total;

				running_total = 0;
				report.push(this_entry);
			}

			this_entry = {};
			this_entry['Provider'] = all_provider_data[this_provider_data].provider_name;
			this_entry['Title'] = all_provider_data[this_provider_data].title;
			this_entry['Quantity'] = all_provider_data[this_provider_data].qty;
			this_entry['Royalty Amount'] = all_provider_data[this_provider_data].royalty_amount;
			running_total = running_total + all_provider_data[this_provider_data].royalty_amount;
			report.push(this_entry);
		}

		this_entry = {};
		this_entry['Total for Provider'] = running_total;
		running_total = 0;
		report.push(this_entry);


		json2csv({ data: report, fields: headers }, function(err, csv) {
			  if (err) console.log(err);
			  res.writeHead(200, {
			       'Content-Type': 'text/csv',
			       'Content-Disposition': 'attachment; filename=provider_report.xls',
			       'Content-Length': csv.length
			  });
			  res.charset = 'UTF-8';
			  res.write(csv);
			  res.end();

			});
	});

});



module.exports = router;