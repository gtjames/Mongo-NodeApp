let express         = require('express');
let path            = require('path');
let favicon         = require('serve-favicon');
let logger          = require('morgan');
let cookieParser    = require('cookie-parser');
let bodyParser      = require('body-parser');

let index           = require('./routes/index');
let users           = require('./routes/users');
let routes          = require('./routes/routes');
let movies          = require('./routes/movies');
let actors          = require('./routes/actors');
let secret          = require('./routes/secret');

let admin           = require('./routes/admin');

let app = module.exports = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
 *  assign variables that are available to the all modules
 */
app.locals.developer = "Edge Tech Academy";
app.locals.location = "Hurst, Texas";
app.locals.date = "Jan 6, 2017";
app.locals.moduleName = "JavaScript using the Express framework and Pug template.";

/*
 *      I want your attention here
 *      This is where we set up the traffic routing for our applications
 *      Pay attention!
 */
app.use('/users',   users);             //  URL: /request  will call the GET method in users.js
app.use('/',        index);
app.use(['/admin[0-9]?(super)?', '/manager[1-5]?', '/clerk[0-9]+'], admin); //  load the 'admin' router mount where desired. The sub-app will not care
app.use('/routes',  routes);             //  URL: /routes will call the GET method in users.js
app.use('/movies',  movies);             //  URL: /movies will call the GET method in movies.js
app.use('/actors',  actors);             //  URL: /actors will call the GET method in actors.js
app.use('/secret',  secret);             //  URL: /router will call the GET method in router.js

//----------------------------------------------------------------------------------------------
//      catching errors - last ditch to process a URL request
//----------------------------------------------------------------------------------------------
// catch 404 and forward to error handler
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

//----------------------------------------------------------------------------------------------
//  Let's add some data to our application to make the pages more interesting
//----------------------------------------------------------------------------------------------
users.init();                                     //  add our data to the users array

let MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://127.0.0.1:27017/', function (err, client) {
	if (err) throw err;
	const db = client.db('hollywood');
	app.locals.client = client;
	app.locals.db = db;

	movies.init(db);
	actors.init(db);
	loadHollywoodDB(db);
});

//-----------https://www.npmjs.com/package/request----------------------------------------------
//---------------https://nodejs.org/api/fs.html-------------------------------------------------
//--------------http://stackoverflow.com/questions/5726729/how-to-parse-json-using-node-js------
//      Get All Actors in movies
//          unwind an array subdocument and project the individual fields we care about into a new collection
//              db.movies.aggregate({"$unwind":"$actors"},{"$project":{"_id":0,"actors.actorId":1}},{"$out" : "forcsv"})
//          export the new collection
//              mongoexport /d hollywood /c forcsv /f actors.actorId /pretty | grep actorId > actorList.csv
//      Get All Movies in Actors
//              db.actors.aggregate({"$unwind":"$filmography"},{"$project":{"_id":0,"filmography.imdbid":1}},{"$out" : "forcsv"})
//              mongoexport /d hollywood /c forcsv /f filmography.imdbid /pretty | grep imdbid > movieList.csv

function loadHollywoodDB(db) {
	loadMovies(db.collection('movies'));
//		loadActors(db.collection('actors'));
}

function loadMovies (collection) {
	let movies = require('./public/javascripts/next.json');
	for (let ma = 0; ma < movies.movies.length; ma++) {
		try {
			let m = require('./public/javascripts/movies/' + movies.movies[ma]);
			let m1 = m.data.movies[0];
			m1._id = m1.idIMDB;

			collection.insert(m1, function (err, docs) {
				if (err)
					console.log(err.message);
				else
					console.log(docs.insertedIds[0]);
			});
		} catch (err) {
			console.log("error^" + err + '^' + movies.movies[ma]);
		}
	}
}

function loadActors(collection) {
	let people = require('./public/javascripts/next.json');
	for (let ma = 0; ma < people.people.length; ma++) {
		try {
			let m = require('./public/javascripts/movies/' + people.people[ma]);
			let m1 = m.data.names[0];
			m1._id = m1.idIMDB;
			for (let s = 0; s < m1.filmographies.length; s++) {
				if (m1.filmographies[s].section == "Actor" || m1.filmographies[s].section == "Actress") {
					//  TODO do I really want to make this change?
					m1.films = m1.filmographies[s].filmography;
					break;
				}
			}

			collection.insert(m1, function (err, docs) {
				if (err)
					console.log(err.message);
				else
					console.log(docs.insertedIds[0]);
			});
		} catch (err) {
			console.log("error^" + err + '^' + people.people[ma]);
		}
	}
}
