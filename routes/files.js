var express = require('express');
var fs = require('fs');
var router = express.Router();
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });
var mkdirp = require('mkdirp');
var path = require('path');
var zlib = require('zlib');


///files
router.post('/download', function(req, res){
  var file = process.env.PWD + req.body.path;
  res.download(file); // Set disposition and send it.
});

router.post('/load_provider_files', function(req,res,next){
  var file_path = get_provider_filepath(req.body.provider_id, req.body.quarter, req.body.year);
    fs.readdir(file_path, function(err, files){      
      res.status(200).send(files);
    });
});

router.post('/delete_file', function(req,res,next){
  var file_path = get_provider_filepath(req.body.provider_id, req.body.quarter, req.body.year) + req.body.file;
  fs.unlink(file_path,function(err){
     res.status(200).send();
  });
});

router.get('/', function(req, res, next) {
  res.render('files/files', { title: 'Files' });
});

router.post('/', upload.single('files'),function(req, res, next){ 
  var file_path = get_provider_filepath(req.body.provider_id, req.body.quarter, req.body.year);
  var ext = path.extname(req.file.originalname);

  mkdirp(file_path, function(err){
    if (err) throw (err);
      
      fs.rename(req.file.path, file_path + req.file.originalname, function(err){
        if (err) throw (err);
        if(ext.replace(" ", "") == '.gz')
        {
          var extract_dest = file_path + req.file.originalname.slice(0,-3);
          var output_string;
          

          fs.readFile(file_path + req.file.originalname, function(err,data){
           
           zlib.unzip(data, function(err, buffer) {
              if (!err) {
                fs.writeFile(extract_dest, buffer.toString());
                fs.unlink(file_path + req.file.originalname);
              }
            });            
          });          
        }
        res.status(200).send(JSON.stringify({ success: true }));  
    });
  });
});

////////////

function get_provider_filepath(provider_id, quarter, year)
{
	return process.cwd()+ "/public/files/"+year+"/"+quarter+"/"+provider_id+"/";
}

module.exports = router;