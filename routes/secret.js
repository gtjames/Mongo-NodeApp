/**
 * Created by Edge Tech Academy on 1/9/2017.
 */
let express = require('express');
let router = module.exports = express.Router();

// middleware that is specific to this router
router.use(function timeLog ( req, res, next) {
	console.log('Time1: ', Date.now())
	next()
});

router.param('mode', function( req, res, next, id) {
	// try to get the user details from the User model and attach it to the request object
	console.log(id);
	req.user = 'found this mode' + id;
	next();
});

//  capture all of the URL requests that start with /router
//      and check to see if they match what has been set for this function
router.get('/:mode/dest/:file', function ( req, res) {
	switch ( req.params.mode)
	{
		case    'download'  :           //  http://localhost:3000/secret/download/dest/user
										//  assumes the application root
			res.download('public/primes.txt', function(err){
				if (err) {
					console.log(err);
					console.log(req.params.file);
				}
				else {
					console.log("Success!!!");
				}
			});
			console.log('leaving the download function');
			break;

		case    'redirect'  :               //  http://localhost:3000/secret/redirect/dest/http%3A%2F%2Fwww.cnn.com
			res.redirect( req.params.file);    //  http://www.cnn.com');
			break;

		case    'json'  :               //  http://localhost:3000/secret/json/file/z
										//  assumes the current directory, hence the ..
			let casablanca = require('../public/Casablanca.json');
			res.json(casablanca);
			break;

		case    'sendFile'  :           //  http://localhost:3000/secret/sendFile/dest/users
										//  doesn't assume anything, the full pathname is required
			res.sendFile('C:/Projects/FirstNodeApp/public/Casablanca.json');
			break;
	}

	// router.get('/resume', function(req, res, next){
	// 	res.sendFile(path.resolve(__dirname+'/../public/resumes/'+req.query.id+'.txt'));
	// });
	//
	// router.get('/schedule', function(req, res, next){
	// 	res.download(__dirname+'/../public/schedules/'+req.query.id+".txt");
	// });


});
