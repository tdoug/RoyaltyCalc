var express = require('express');
var router = express.Router();

///settings
router.get('/', function(req, res, next) {
  res.render('settings/settings', { title: 'Settings' });
});

router.get('/providers/create', function(req, res, next) {
  res.render('settings/create', { title: 'Create Provider' });
});

router.get('/providers/list', function(req, res, next) {
  res.render('settings/list', { title: 'Provider List'});
});

router.get('/providers/edit/:provider_id', function(req, res, next) {
  res.render('settings/create', { title: 'Edit Provider', provider_id:req.params.provider_id });
});

module.exports = router;