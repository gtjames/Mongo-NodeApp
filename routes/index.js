/**
 * Created by Edge Tech Academy on 1/24/2017.
 */
let express = require('express');
let router = module.exports = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express'});
});

