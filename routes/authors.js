var express = require('express');
var router = express.Router();

///authors
router.get('/', function(req, res, next) {
  res.render('authors/authors', { title: "Authors" });
});

module.exports = router;