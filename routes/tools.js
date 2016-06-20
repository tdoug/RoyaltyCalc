var express = require('express');
var router = express.Router();

///tools
router.get('/', function(req, res, next) {
  res.render('tools/tools', { title: 'Tools' });
});

router.get('/lineitem', function(req, res, next) {
  res.render('tools/line-item', { title: 'Tools: Line Item Editor' });
});

router.get('/missingisbn', function(req, res, next) {
  res.render('tools/missing-isbn', { title: 'Tools: Missing ISBN' });
});

module.exports = router;