var express = require('express');
var fs = require('fs');
var path = require('path');
var xlsx = require('xlsx');
var csv = require('basic-csv');
var txt = require('babyparse');
var http = require('http');
var request = require('request');
var api = require('../routes/api.js');
var merge = require('merge')
var txt_check = require('istextorbinary');
var iconvlite = require('iconv-lite');
var xlsx2 = require('excel');

var royalty_row = require('../models/royalty_row.js');
var advance_row = require('../models/advances_row.js');

var router = express.Router();

router.post('/process_file', function(req,res,next){
	var year = req.body.year;
	var quarter = req.body.quarter;	
	var provider = req.body.provider;	
	var filename = req.body.file;	
	var file_path = get_provider_filepath(provider.id, quarter, year) + req.body.file;	
	var ext = path.extname(req.body.file);

	var results;

	if(ext == '.xlsx' || ext == 'xls')
	{
		var temp_file = fs.readFileSync(file_path);
		if(txt_check.isTextSync("",temp_file) == true)
			ext = '.txt';
	}
		
	if(ext != '.xls' && ext != '.xlsx' && ext != '.csv' && ext != '.txt')	
		res.status(500).send('The extension provided is not supported.');


	if(ext == '.xlsx' || ext == '.xls')	
		parse_xlsx(file_path, provider, function(results){
			console.log('parse complete, xls file');
			clean_results(results, function(these_results){
				console.log('clean complete');
				commit_results(these_results, quarter, year, function(){
					console.log('commit complete');
					res.write('Processing complete for:'+filename);
					res.end();
					res.status(200).send();
				});
			});
		});

	if(ext == '.csv')	
		parse_csv(file_path, provider, function(results){
			console.log('parse complete, csv file');
			clean_results(results, function(these_results){
				console.log('clean complete');
				commit_results(these_results, quarter, year, function(){
					console.log('commit complete');
					res.write('Processing complete for: '+filename);
					res.end();
					res.status(200).send();
				});
			});
		});

	if(ext == '.txt')	
		parse_txt(file_path, provider, function(results){
			console.log('parse complete, text file');
			//console.log(results);
			clean_results(results, function(these_results){
				console.log('clean complete');
				//console.log(these_results);
				commit_results(these_results, quarter, year, function(){
					//console.log(these_results);
					console.log('commit complete');
					res.write('Processing complete for:'+filename);
					res.end();
					res.status(200).send();
				});
			});
		});	
});

function process_file(filename, quarter, year, provider,callback)
{	
	var file_path = get_provider_filepath(provider.id, quarter, year) + filename;
	var ext = path.extname(filename);
	provider.data = JSON.parse(provider.provider_data);

	var results;

	if(ext == '.xlsx' || ext == '.xls')
	{
		var temp_file = fs.readFileSync(file_path);
		if(txt_check.isTextSync("",temp_file) == true)
			ext = '.txt';
	}

	if(provider.data.parseAsText != undefined && provider.data.parseAsText == true)
		ext = '.txt';
		
	if(ext != '.xls' && ext != '.xlsx' && ext != '.csv' && ext != '.txt')	
		console.log('The extension provided is not supported.');


	if(ext == '.xlsx' || ext == '.xls')	
		parse_xlsx(file_path, provider, function(results){
			console.log("parsed:" + filename + ", xls file");
			callback(results);			
		});

	if(ext == '.csv')	
		parse_csv(file_path, provider, function(results){
			console.log("parsed:" + filename + ", csv file");
			callback(results);			
		});

	if(ext == '.txt')	
		parse_txt(file_path, provider, function(results){
			console.log("parsed:" + filename + ", txt file");
			callback(results);			
		});	
};

router.post('/process_files', function(req,res,next){
	var year = req.body.year;
	var quarter = req.body.quarter;	
	var provider = req.body.provider, wait, parse_results = [], index = 0;	

	for(file in req.body.files)
	{	
		process_file(req.body.files[file], quarter, year, provider,function(results)
		{
			index++;
			for(result in results)
			{	
				parse_results.push(results[result]);	
			}

			if(index >= req.body.files.length)
			{
				clean_results(parse_results, function(clean_results){
					console.log('results cleaned');
					commit_results(clean_results, quarter, year, function(err){

						console.log('results comitted');
						res.write('Processing complete for '+ provider.provider_name+'.  Wait for the green checkmark to appear before proceeding.');
						res.end();
						res.status(200).send();
					});
				});				
			}
		});		
	}
});

function commit_results(results, quarter, year, callback)
{
	var provider, title, isbn, royalty_amount, qty, price;
	
	for(result in results)
	{
		provider = results[result].provider;
		title = results[result].title;
		qty = results[result].grand_qty;
		isbn = results[result].isbn;
		price = results[result].price;		
		royalty_amount = results[result].total_royalty;

		for(author in results[result].author_data)
		{
			royalty_write_row(results[result].author_data[author].uid, provider, quarter, year, 
				title, isbn, royalty_amount, qty, price);
		}
	}
	callback(true);
};

function commit_discrepancies(discrepancies, quarter, year, callback)
{
	var provider, title, filename, row_number, author, price, discrepancy_type;

	for(discrepancy in discrepancies)
	{
		discrepancy_write_row(provider, title, filename, row_number, author, price, discrepancy_type);
	}
	callback(true);
}

///parses xls and xlsx into a generalized object array


///converts "A" to "0", "P" to 15, "BB" to 27, etc.
function convertLetterToNumber(str) {
  var out = 0, len = str.length;
  for (pos = 0; pos < len; pos++) {
    out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
  }
  return out - 1;
}

function parse_xlsx(file, provider, callback)
{
	provider.data = JSON.parse(provider.provider_data);
	var ISBN_col = provider.data.isbnCol;
	var do_match = provider.data.isbnMatchField, buffer = 0;
	var absolute_path = file.replace("../../", "/home/royalty3/royalty-server/");
			
	var books = {};
	var currency, this_isbn, this_value, index = 0;
	
	if(provider.data.exclude_sheets != undefined)
		var exclude_sheets = provider.data.excludeSheets.split(",");

	if(provider.isbnSheetDataToggle === undefined)
		currency_col = provider.currencyCol;
	else
		currency_col = 'sheet';
	///data is worksheet name -> cell row/col
	var workbook = xlsx.readFile(file);

	var sheet_name_list = workbook.SheetNames;
	
	sheet_name_list.forEach(function(sheet_name) { /* iterate through sheets */
		var worksheet = workbook.Sheets[sheet_name];

		if(exclude_sheets != undefined)
		{
			for(sheet in exclude_sheets)
	  		{
	  			if(sheet_name == exclude_sheets[sheet])
	  				continue;
	  		}
  		}
		
	  	for (cell in worksheet) { ///create objects

		    if(cell[0] === '!') continue;
		    if(worksheet[cell] == undefined) continue;
		    if(worksheet[cell].v == undefined) continue;

		    this_isbn = 0;
		    this_value = worksheet[cell].v;
		  	
		    if(cell.search(ISBN_col) > -1)
		    {
		    	index++;
		    	
		    	if(index == 1)
		    		continue;	

		    	this_isbn = this_value;	 		    	   	   

		    	books[index] = {};

		    	var row  = cell.substr(1, cell.length);
		    	var price_cell = provider.data.priceCol + row;
		    	var author_cell = provider.data.authorCol + row;
		    	var title_cell = provider.data.bookCol + row;
		    	var qty_cell = provider.data.quantityCol + row;
		    	var funds_col = provider.data.fundsCol + row;


		    	if(currency_col == 'sheet')
		    		books[index].currency = sheet_name.substr(0,3);
		    	else if(currency_cell != undefined)
		    	{
		    		var currency_cell = provider.data.currencyCol + row;
		    		books[index].currency = worksheet[currency_cell].v;
		    	}
		    	else
		    	{
		    		books[index].currency = "USD";
		    	}

		    	books[index].isbn = this_isbn;

		    	if(worksheet[price_cell] != undefined)
		    		books[index].price = worksheet[price_cell].v;

		    	if(worksheet[author_cell] != undefined)
		    		books[index].author = worksheet[author_cell].v;

		    	if(worksheet[title_cell] != undefined)
		    		books[index].title = worksheet[title_cell].v;

		    	if(worksheet[qty_cell] != undefined)
		    	{
		    		books[index].qty = worksheet[qty_cell].v;
		    		books[index].total = books[index].price * books[index].qty;
		    	}
		    	else
		    		books[index].qty = 1;
		    	
		    	if(worksheet[funds_col] != undefined)
		    	{
		    		books[index].total = worksheet[funds_col].v;
		    		books[index].funds_exist = 1;
		    	}

		    	if(provider.data.refundSheet != undefined && provider.data.refundSheet == sheet_name)
		    	{
		    		books[index].total = books[index].total * -1;
		    	}

		    	books[index].provider = provider.id;
		    	books[index].calc_method = provider.data.royalty_method;
		    }
	  }	
	});

	var book_length = Object.keys(books).length;
	
	if(do_match != undefined)
    {    	
	   	api.get_isbn_from_match_field(do_match, function(res)
    	{
    		for(book in books)
    		{    			
    			for(row in res)
    			{
    				if(books[book].isbn == undefined)
    					continue;

    				if(res[row].this_match_field == undefined)
    					continue;
    				
    				if(res[row].this_match_field.trim() == books[book].isbn.trim())    				    					
    					books[book].isbn = res[row].field_isbn_value; 

    			}
    		}
    		book_length = Object.keys(books).length;

    		for(book in books)
    		{ 
    			if((books[book].isbn.indexOf("BK_") > -1) && books[book].title != undefined)
    				console.log(books[book].title + " Code: " + books[book].isbn);
    		}

		    if(book_length > 0)
	    		callback(books);
	    });

	    
    }
    else if(this_value != undefined)
    {
    	this_isbn = this_value;

    	if(book_length > 0)
    	callback(books);
    }			    
    else if(book_length > 0)
    	callback(books);	

	////////////////////
	///if one parser fails, try another
	if(book_length == 0 || book_length == undefined )
	{
    	var price_col = convertLetterToNumber(provider.data.priceCol);
    	var author_col = convertLetterToNumber(provider.data.authorCol);
    	var title_col = convertLetterToNumber(provider.data.bookCol);
    	var qty_col = convertLetterToNumber(provider.data.quantityCol);
    	var funds_col = convertLetterToNumber(provider.data.fundsCol);
    	var ISBN_col = convertLetterToNumber(provider.data.isbnCol);
    	var currency_col = convertLetterToNumber(provider.data.currencyCol);
    	var index, book = {};

	}
}

function readFileSync_encoding(filename, encoding) {
    var content = fs.readFileSync(filename);
    return iconvlite.decode(content, encoding);
}


function parse_csv(file, provider, callback)
{
	provider.data = JSON.parse(provider.provider_data);

	var ISBN_col = provider.data.isbnCol;
	var price_col = provider.data.priceCol;
	var author_col = provider.data.authorCol;
	var title_col = provider.data.bookCol;
	var currency_col = provider.data.currencyCol;
	var qty_col = provider.data.quantityCol;
	var funds_col = provider.data.fundsCol;
	var do_match = provider.data.isbnMatchField;

	var this_isbn, index = 0;	
	var books = {};

	csv.readCSV(file, function (error, rows) {
		for(row in rows)
		{
		  if(row==0)
		  {
		  	ISBN_col = rows[row].indexOf(ISBN_col);
		  	price_col = rows[row].indexOf(price_col);
		  	title_col = rows[row].indexOf(title_col);
		  	currency_col = rows[row].indexOf(currency_col);
		  	qty_col = rows[row].indexOf(qty_col);
		  	funds_col = rows[row].indexOf(funds_col);
		  }
		  else
		  {
		  	
		  	this_isbn = rows[row][ISBN_col];
		  	
		  	if(this_isbn == undefined) continue;

		  	if(books[this_isbn] == undefined)
		  		books[index] = {};
		  	
		  	books[index].isbn = this_isbn;
		  	books[index].price = rows[row][price_col].trim().replace("$","");
		  	books[index].qty = rows[row][qty_col];
		  	books[index].currency = rows[row][currency_col];
		  	books[index].author = rows[row][author_col];
		  	books[index].title = rows[row][title_col];

		  	if(rows[row][funds_col] != undefined)
		    	books[index].total = rows[row][funds_col].replace("$","");
		    else
		    	books[index].total = books[index].price * books[index].qty;
		  	
		  	books[index].provider = provider.id;
		  	books[index].calc_method = provider.data.royalty_method;

		  	if(books[index].qty == undefined)
		  		books[index].qty = 1;
		  }
		  index++;
	  	}	  	
	  	callback(books);
	});
}

function parse_txt(file, provider, callback)
{
	provider.data = JSON.parse(provider.provider_data);

	var ISBN_col = provider.data.isbnCol;
	//console.log(ISBN_col);
	var price_col = provider.data.priceCol;
	var author_col = provider.data.authorCol;
	var title_col = provider.data.bookCol;
	var	currency_col = provider.data.currencyCol;
	var do_match = provider.data.isbnMatchField;

	var qty_col = provider.data.quantityCol;
	var funds_col = provider.data.fundsCol;
	var this_isbn, index = 0;	
	var books = {}, encoding;

	if(provider.data.parseAsUTF16 == true)
		encoding = "utf16le";
	else
		encoding = "utf8";

	var data = readFileSync_encoding(file, encoding).toString("utf8");

	if(provider.data.headerRowStart != undefined)
	{
		data = data.toString();
		console.log('trimming file');
		data = data.split("\n");
		data.splice(0, (provider.data.headerRowStart-1));
		data = data.join("\n");
	}

	var parsed = txt.parse(data, {header:true});
	
	if(parsed.data.length < 1)
		return false;
	
	var sheet_data = parsed.data;
	//for (var k in sheet_data)
	//{
    for(k in sheet_data)
    {
    	if(sheet_data[k][qty_col] == undefined || sheet_data[k][qty_col] == 0)
    		continue;

    	this_isbn = sheet_data[k][ISBN_col];

    	if(this_isbn != undefined)
    	{
    		books[index] = {};
    		books[index].isbn = this_isbn;

    		if(sheet_data[k][price_col] != undefined)
    			books[index].price = sheet_data[k][price_col];
    		else
    			books[index].price = 0;

    		books[index].qty = sheet_data[k][qty_col];
    		
    		if(sheet_data[k][currency_col] != undefined)
    			books[index].currency = sheet_data[k][currency_col];
    		else
    			books[index].currency = "USD";

    		books[index].author = sheet_data[k][author_col];
    		books[index].title = sheet_data[k][title_col];
    		
    		if(funds_col != undefined)
    			books[index].total = sheet_data[k][funds_col].replace("$","");
    		else
    			books[index].total = books[index].price * books[index].qty;

    		if(books[index].qty == undefined)
    			books[index].qty = 1;

    		books[index].provider = provider.id;
    		books[index].calc_method = provider.data.royalty_method;
    		
			index++;

    	}
    }
	callback(books);		
}

function clean_results(results, callback)
{	
	var isbn_array = {}, bad_isbn = [], author_buffer;
	var this_total, this_currency, this_qty, index = 0, settings, this_currency_conversion_rate;
	settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));	
	var currency_aliases = settings.alt_map.split("\n");	
	var currency_alias_array = [], currency_temp;	
	var isbn_pat = new RegExp("^(97(8|9))?\d{9}(\d|X)$");

	for(alias in currency_aliases)
	{
		currency_temp = currency_aliases[alias].split("=");
		currency_alias_array[currency_temp[0]] = currency_temp[1];
	}
	
	for(result in results)
	{

		//if(results[result].isbn == 9781933563237)
		//	console.log(results[result]);
		
		if(results[result].isbn == undefined || results[result].isbn.length < 2)
			continue;

		//remove hyphens and spaces
		results[result].isbn = results[result].isbn.replace(/-/g, "").replace(" ", "");			

		//if(isbn_pat.test(results[result].isbn) == false)
		//	continue;		

		if(isbn_array[results[result].isbn] == undefined)
			isbn_array[results[result].isbn] = results[result];

		if(results[result].currency.length == 2)
		{			
			for(alias_currency in currency_alias_array)
			{				
				if(alias_currency == results[result].currency)
					results[result].currency = currency_alias_array[alias_currency];
			}
		}

		if(isbn_array[results[result].isbn]['sales_by_currency'] == undefined)
			isbn_array[results[result].isbn]['sales_by_currency'] = {};

		if(isbn_array[results[result].isbn]['sales_by_currency'][results[result].currency] == undefined)
			isbn_array[results[result].isbn]['sales_by_currency'][[results[result].currency]] = {};

		if(isbn_array[results[result].isbn]['sales_by_currency'][[results[result].currency]].total == undefined)
			isbn_array[results[result].isbn]['sales_by_currency'][[results[result].currency]].total = 0;

		isbn_array[results[result].isbn]['sales_by_currency'][[results[result].currency]].total = parseFloat(isbn_array[results[result].isbn]['sales_by_currency'][[results[result].currency]].total) + parseFloat(results[result].total);

		if(isbn_array[results[result].isbn].grand_qty == undefined)
			isbn_array[results[result].isbn].grand_qty = parseInt(results[result].qty);
		else
			isbn_array[results[result].isbn].grand_qty = parseInt(isbn_array[results[result].isbn].grand_qty) + parseInt(results[result].qty);

		//if(isbn_array[results[result].isbn].isbn == 9781933563237)
		//	console.log(isbn_array[results[result].isbn]);

		if(isbn_array[results[result].isbn].isbn == 9781619262324)
		{
			/*
			console.log(orig_currency);
			console.log(results[result].total);
			console.log(isbn_array[results[result].isbn]);
			*/
		}
	}

	api.get_author_data_by_isbn(function(authors)
	{
		for(result in isbn_array)
		{		
			this_total = 0;
			this_royalty = 0;

			author_buffer = authors.filter(function (author) { 
				
				if(author.isbn == isbn_array[result].isbn && author.isbn.length > 5)
					return true;
				else if(author.print_isbn == isbn_array[result].isbn && author.print_isbn.length > 5)
					return true;
				else if(author.isbn13 == isbn_array[result].isbn && author.isbn13.length > 5)
					return true;
			});			
			
			if(author_buffer.length > 0)
			{

				for(author in author_buffer)
				{
					index = 0;
					/*
					authors[author].isbn = authors[author].isbn.replace(" ", "");
					authors[author].isbn = authors[author].isbn.replace("ISBN:", "");
					isbn_array[result].isbn = isbn_array[result].isbn.replace(" ", "");
					*/
									
					if(isbn_array[result].author_count == undefined)
						isbn_array[result].author_count = 1;
					else
						isbn_array[result].author_count = isbn_array[result].author_count + 1;

					if(isbn_array[result].author_data == undefined)
						isbn_array[result].author_data = {};

					index = isbn_array[result].author_count;
					//console.log(index);
					
					isbn_array[result].author_data[index] = author_buffer[author];	
					isbn_array[result].vendor_data = {};
					isbn_array[result].vendor_data.sell_price = author_buffer[author].sell_price;
					isbn_array[result].vendor_data.print_price = author_buffer[author].print_price;
									
				}
			}
			else			
			{
				bad_isbn.push(isbn_array[result]);
				continue;
			}

			//process royalties by currency
			if(isbn_array[result].calc_method == 'publisher_price')
			{	
			isbn_array[result].price = isbn_array[result].vendor_data.sell_price;						
				this_royalty = isbn_array[result]['sales_by_currency']['USD'].total * settings.royalty1.commpct;				
				
				if(isbn_array[result].total_royalty == undefined)
					isbn_array[result].total_royalty = 0;

				isbn_array[result].total_royalty = (parseFloat(isbn_array[result].total_royalty) + parseFloat(this_royalty)) / isbn_array[result].author_count;
			} ///account for foreign currencies
			else if(isbn_array[result].calc_method == 'publisher_price_convert')
			{
				isbn_array[result].price = isbn_array[result].vendor_data.sell_price;
				for(currency in isbn_array[result].sales_by_currency)
				{					
					this_currency_conversion_rate = 0;
					this_royalty = 0;
					
					//remap two digit aliases to their official three digit counterpats
					

					//if USD, do traditional 
					if(currency.toUpperCase().replace(" ", "") == 'USD')			
					{
						this_royalty = isbn_array[result]['sales_by_currency'][currency].total;

						if(isbn_array[result].author_count > 1)
								this_royalty = this_royalty / isbn_array[result].author_count;

						this_royalty = this_royalty * settings.royalty1.commpct;	
					}		
					else if(currency.length == 3)
					{
						for(settings_currency in settings.currencies)
						{						
							if(settings.currencies[settings_currency].name.toUpperCase() == currency.toUpperCase().replace(" ",""))
								this_currency_conversion_rate = settings.currencies[settings_currency].saved_rate;
						}
					}

					if(this_currency_conversion_rate > 0)
					{
						this_royalty = isbn_array[result]['sales_by_currency'][currency].total / this_currency_conversion_rate;							

						if(isbn_array[result].author_count > 1)
							this_royalty = this_royalty / isbn_array[result].author_count;
						
						this_royalty = this_royalty * settings.royalty1.commpct;	
					}

					if(this_royalty > 0)
					{						
						if(isbn_array[result].total_royalty == undefined)
							isbn_array[result].total_royalty = 0;

						isbn_array[result].total_royalty = (parseFloat(isbn_array[result].total_royalty) + parseFloat(this_royalty));												
					}	
				}	
			}
			else if(isbn_array[result].calc_method == 'print_method') ///TODO finish
			{
				//if(isbn_array[result].isbn == )

				isbn_array[result].price = isbn_array[result].vendor_data.print_price;
				this_royalty = (isbn_array[result].grand_qty * isbn_array[result].price);	

				if(this_royalty > 0)
				{
					if(isbn_array[result].total_royalty == undefined)
						isbn_array[result].total_royalty = 0;

					if(isbn_array[result].author_count > 1)
						this_royalty = this_royalty / isbn_array[result].author_count;

					this_royalty = this_royalty * settings.royalty2.commpct;						

					isbn_array[result].total_royalty = parseFloat(isbn_array[result].total_royalty) + parseFloat(this_royalty);						
				}
			} ///end print method
		}
		if(bad_isbn != undefined && bad_isbn.length > 0)
		{
			//console.log(bad_isbn);
			for(this_isbn in bad_isbn)
			{

			}
		}
		callback(isbn_array);
	});
}

function royalty_write_row(author_uid, provider_id, quarter, year, title, isbn, royalty_amount, qty, price)
{
	quarter = quarter.replace("Q","");

	royalty_row.findAll({where:{quarter: quarter, y:year, provider_id: provider_id, author_uid:author_uid, isbn:isbn}
		}).then(function(rows){
			if(rows.length > 0) ///update existing rows
			{
				for(row in rows)
				{
					royalty_amount = parseFloat(royalty_amount + rows[row].royalty_amount).toFixed(2);
					qty = qty + rows[row].qty;

					royalty_row.sync().then(function(){
						return royalty_row.update({
							royalty_amount: royalty_amount,
							qty: qty
						}, {where: {id:rows[row].id}});
					});
				}				
			}
			else
			{
				royalty_amount = parseFloat(royalty_amount).toFixed(2);
				royalty_row.sync().then(function(){
					return royalty_row.create({
						author_uid: author_uid,
						provider_id: provider_id,
						quarter: quarter,
						y: year,
						title: title,
						isbn: isbn,
						royalty_amount: royalty_amount,
						qty: qty, 
						price:price
					});
				});				
			}
		});	

		return true;
}

function get_provider_filepath(provider_id, quarter, year)
{
	return process.cwd() + "/public/files/"+year+"/"+quarter+"/"+provider_id+"/";
};

////ADVANCES

router.post('/process_advances', function(req,res,next)
{
	var year = req.body.year;
	var quarter = req.body.quarter;
	var advances = req.body.provider;	
	var filename = advances.files[0];	
	var file_path = get_provider_filepath(advances.id, quarter, year) + filename;	
	var ext = path.extname(filename);
	var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));					

	console.log("Processing Advance File: " + filename);

	quarter = quarter.replace("Q","");

	if(ext == '.xls' || ext == '.xlsx')
	{
		var workbook = xlsx.readFile(file_path);
		var sheet_name_list = workbook.SheetNames, advances = {}, index = 0;

		sheet_name_list.forEach(function(sheet_name) 
		{ /* iterate through sheets */		
			var worksheet = workbook.Sheets[sheet_name];
			
			for (cell in worksheet) 
			{
				var row  = cell.substr(1, cell.length), old_row;

				if(row != old_row)
				{
					index++;

					if(index == 1)
			    		continue;

					var author_cell = settings.advances.uid_col + row;
					var type_cell = settings.advances.type_col + row;
					var amount_cell = settings.advances.amount_col + row;
					old_row = row;					

			    	//if(isNaN(amount_cell))
			    	//	continue;
			    	
			    	advances[index] = {};

			    	if(worksheet[author_cell] != undefined)
						advances[index].author_uid = worksheet[author_cell].v;
					if(worksheet[type_cell] != undefined)
						advances[index].advance_code = worksheet[type_cell].v;
					if(worksheet[amount_cell] != undefined)
						advances[index].advance_amount = worksheet[amount_cell].v;
				}
			};
			console.log("Sheet Parsed");
		});
		var author_uid, advance_code, advance_amount;
		api.delete_advances_data(quarter,year,function(){
			console.log("Advances Cleared");
			
				advance_row.sync().then(function(){
					for(row in advances)
					{
						author_uid = advances[row].author_uid;
						advance_code = advances[row].advance_code;
						advance_amount = advances[row].advance_amount;

						advance_row.create({
							author_uid: author_uid,
							quarter: quarter,
							y: year,
							advance_code: advance_code,
							advance_amount: advance_amount,
						});
					};
				});	
			res.send(200);
		});
	}
});

module.exports = router;