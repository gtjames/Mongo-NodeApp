/**
 * Created by Edge Tech Academy on 1/24/2017.
 */
let express = require('express');
let router = module.exports = express.Router();

/*
 * GET list of items in the Request object header
 */
router.get('/actor/:id', function(req, res) {
	let collection = req.app.locals.db.collection('actors');
	collection.findOne({_id: req.params.id}, function(err, items) {
		if (err || !items) {
			let x = [];
			x.push(new User(req.params.id, 'Does not match an Actor in our DB', '', false ));
			res.render('users', {'users': x, 'title': 'Not Found'});
			return;
		}
		let actors = items;
		users.push(new User(actors.idIMDB, actors.name, actors.urlPhoto, true));
		res.render('users', {'users':users, 'title':'Users'});
	});
});

/**
 *      This is a one-off demo to show configuring and connecting to the mongoDB
 *      We get the users collection and read the records there
 */
router.get('/dummy/:id', function(req, res) {
	let MongoClient = require('mongodb').MongoClient;

	MongoClient.connect('mongodb://127.0.0.1:27017', function (err, client) {
		if (err) throw err;
		const db = client.db('users');
		let collection = db.collection('users');
		collection.find({_id: req.params.id}).toArray(function(err, items) {
			if (items.length == 0) {
				let x = [];
				x.push(new User(req.params.id, 'Does not match an Actor in our DB', '', false ));
				res.render('users', {'users': x, 'title': 'Not Found'});
				return;
			}
			let user = items[0];
			users.push(new User(user.id, user.joined, user.likes, true));
			res.render('users', {'users':users, 'title':'Users'});
		});

	});
});

router.get('/movie/:id', function(req, res) {
	let MongoClient = require('mongodb').MongoClient;

	MongoClient.connect('mongodb://127.0.0.1:27017/', function (err, client) {
		if (err) throw err;
		const db = client.db('hollywood');
		let collection = db.collection('movies');
		collection.find({_id:req.params.id}).toArray(function(err, items) {
			if (items.length == 0) {
				let x = [];
				x.push(new User(req.params.id, 'Does not match an movie in our DB', '', false ));
				res.render('users', {'users': x, 'title': 'Not Found'});
				return;
			}
			let movie = items[0];
			users.push(new User(movie.idIMDB, movie.title, movie.urlPoster, true));
			res.render('users', {'users':users, 'title':'Users'});
		});

	});
});

router.get('/', function(req, res) {

	let header = "";
	header += "<h3>Application Properties</h3>";
	for ( let prop in req.app.locals ) {
		header += "<strong>" + prop + "</strong>: " + req.app.locals[prop] + '<br>';
	}

	header += "<h3>Application Settings</h3>";
	for ( let prop in req.app.locals.settings ) {
		header += "<strong>" + prop + "</strong>: " + req.app.locals.settings[prop] + '<br>';
	}

	header += "<h3>Request Object Header Values</h3>";
	for ( let prop in req.headers )
		header += "<strong>" + prop + "</strong>: " + req.headers[prop] + '<br>';

	//	res.attachment('../views/error.jade', 'jade.txt');

	res.send(header);
//	res.redirect('http:/admin/');
});

let User = function(fname, lname, phone, movie) {
	this.FirstName = fname;
	this.LastName = lname;
	this.Phone = phone;
	this.Movie = movie;
};

let users = [];

router.init = function() {
	users.push(new User('Keith', 'Richards', '801-AC5-2030', false));
	users.push(new User('Joe',   'Cocker',   '801-FR3-7789', false));
	users.push(new User('B.B.',  'King',     '202-AAA-2345', false));
};

/*
 *  Render the users.jade file, passing along the array of users
 */
router.get('/pug', function(req, res) {
	res.render( 'users', { 'users': users, 'title': 'Users' } );
});

router.get('/pug', function(req, res) {
	res.render( 'front2Back');
});
