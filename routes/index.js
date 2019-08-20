var express = require('express');
var router = express.Router();

/* Home page - Swagger Documentation. */
router.get('/', function (req, res, next) {
  res.redirect('/api-docs');
});

module.exports = router;
