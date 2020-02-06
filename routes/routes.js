/**
 * Created by Edge Tech Academy on 1/11/17.
 */
let express = require('express');
let request = require( 'request' );
let http    = require( 'http' );
let fetch = require('node-fetch');

let router = module.exports = express.Router();

// middleware that is specific to this router
router.use(     function timeLog (req, res, next) {	console.log(req.originalUrl, Date.now());	next(); });
router.all('/', function         (req, res, next) {	console.log('First section ...');	        next(); });
router.all('/', function         (req, res, next) {	console.log('Next  section ...: ');	        next(); });

// GET method route
//      curl (-X GET) localhost:3000/routes/
router.get('/', function (req, res) {
    res.send   ('GET: ' + req.originalUrl);
});

router.get( '/weather/:zip', function ( req, res ) {
	let api = 'http://api.openweathermap.org/data/2.5/weather?zip=' + req.params.zip + ',us&appid=dc6e40e10806f79c1a2354eaad1e04bd';
	let request = http.request( api, function ( response ) {
			let body = "";
			response.on( 'data', function ( data ) {
				console.log(data);
				body += data;
			} );
			response.on( 'end', function () {
				let json = JSON.parse( body );
				res.send( json );
			} );
		} );
		request.on( 'error', function ( e ) {
			console.log( 'Problem with request: ' + e.message );
		} );
	request.end();
} );

router.get( '/weather1/:zip', function ( req, res ) {
	let api = 'http://api.openweathermap.org/data/2.5/weather?zip=' + req.params.zip + ',us&appid=dc6e40e10806f79c1a2354eaad1e04bd';
	request( { url: api, json: true }, function ( err, apires, json ) {
		if ( err ) {
			throw err;
		}
		res.send( json );
	} );
} );

router.get( '/whoAreYou', function ( req, res ) {
	console.log(req);
});
router.get( '/contact/:source/:tag', function ( req, res ) {
	let body;
	let options = {
		method: 'POST'
		, headers: { "Authorization": "Bearer BDAk9bUbovzBAjuOhIzXXo9yNZmBIdJ3" }
		, body: '{ "' + req.params.source + '": "' + req.params.tag + '" }'
	};
	fetch('https://api.fullcontact.com/v3/person.enrich', options)
		.then(function(json){
			let body = JSON.parse("" + json.body._readableState.buffer.head.data);
			if ( body.status == '404' ) {
				res.render( "whoAreYou", {fullName: 'None'} );
			}
			else {
				console.log( body );
				res.render( "whoAreYou", body );
			}
		});
} );


//  curl -H"X-FullContact-APIKey:BDAk9bUbovzBAjuOhIzXXo9yNZmBIdJ3" https://api.fullcontact.com/v2/person.json?email=gtjames@gmail.com -k
//  curl -H"X-FullContact-APIKey:d4HUQrLsicA0tbcAEmCVjt29WdJ52ixg" https://api.fullcontact.com/v3/person.enrich?email=gtjames@gmail.com -k

router.get( '/contact1/:source/:tag', function ( req, res ) {
	let body
	let options = {
		method: 'POST',
		headers: { "Authorization": "Bearer BDAk9bUbovzBAjuOhIzXXo9yNZmBIdJ3" },
		body: '{ "' + req.params.source + '": "' + req.params.tag + '" }'
	};
	fetch('https://api.fullcontact.com/v3/person.enrich', options)
	.then(function(json){
		let body = JSON.parse("" + json.body._readableState.buffer.head.data);
		if ( body.status == '404' ) {
			res.send( {fullName: 'None'} );
		}
		else {
			console.log( body );
			res.send(body);
		}
	});
} );

// POST method route
//      curl -X POST localhost:3000/routes/
router.post('/', function (req, res) {
    res.send   ('POST: ' + req.originalUrl);
});

//  Respond to a PUT request to the /user route:
//      curl -X PUT localhost:3000/routes/route
router.put('/route', function (req, res) {
    res.send   ('PUT: ' + req.originalUrl);
});

//Respond to a DELETE request to the /user route:
//      curl -X DELETE localhost:3000/routes/route
router.delete('/route', function (req, res) {
    res.send   ('DELETE: ' + req.originalUrl);
});

//  Request URL: http://localhost:3000/flights/LAX-SFO
//      req.params: { "from": "LAX", "to": "SFO" }
//      curl -X GET http://localhost:3000/routes/flights/LAX-MIA-SFO
router.get('/flights/:from-:stopover-:to', function (req, res) {
	res.send(req.params);
});

router.get('/flights/:from-:to', function (req, res) {
	res.send(req.params);
});

//  More than one callback function can handle a route (make sure you specify the next object). For example:
//      curl -X GET localhost:3000/routes/2Steps
router.get('/2Steps',
	function (req, res, next) {
		console.log('moving on');
		next();
	},
	function (req, res)       {
		console.log('made it');
		res.send('Hello from Step 2!');
	}
);

//  An array of callback functions can handle a route. For example:
//      curl -X GET localhost:3000/routes/baseball
let base1st = function (req, res, next) {    console.log('First Base');    next();};
let base2nd = function (req, res, next) {    console.log('Second Base');   next();};
let base3rd = function (req, res, next) {    console.log('Third Base');    next();};
let home    = function (req, res)       {    res.send('Safe at home');};
router.get('/baseball', [base1st, base2nd, base3rd, home]);
router.get('/skip2ndAnd3rd', [base1st, home, base2nd, base3rd]);

//  Respond to a GET with parameters
//      curl -X GET localhost:3000/routes/checkOut/1000/books/666
router.get('/checkOut/:userId/books/:bookId', function (req, res) {
	res.send(req.params);
});

//  Here is an example of chained route handlers
//      curl -X POST http://localhost:3000/routes/book/666.Hogwarts.Random%20House.J.K.Rowlings
router
	.all ('/book/:bookId', function (req, res, next) {
		console.log('Book Id: ' + req.params.bookId);
		next();
	}).get ('/book/:bookId', function (req, res) {
		res.send(req.params);
	}).delete ('/book/:bookId', function (req, res) {
		res.send('Delete a book: ' + req.params.bookId);
	}).post('/book/:bookId.:bookTitle.:publisher.:author', function (req, res) {
		res.send(req.params);
	}).put ('/book/:bookId.:bookTitle.:publisher.:author', function (req, res) {
		res.send('Update a book: ' + req.params.bookId);
	});
