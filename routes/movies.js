/**
 * Make this JS file an express module
 *      Get the router object to set up our end points
 */
let express = require('express');
let router = module.exports = express.Router();

/*
 *  We need references to the collection objects used in this code
 *      movies and deletedMovies
 */
let moviesCol = null;
let delMoviesCol = null;

/*
 *      this function is a standard function that allows the assignment
 *      of the global variables used through out this module
 *      Another approach is to save these values in app.js in the app.locals list and
 *      then retrieve them as needed from req.app.locals.XXXXX
 */
router.init = function(db) {
	moviesCol    = db.collection('movies');
	delMoviesCol = db.collection('deletedMovies');
};

/**
 *      Find
 *          Just list the first 20 movies in the movies collection
 *          We have 100,000 but we will limit the return to 20
 */
router.get('/', function(req, res) {
	moviesCol.find({}).limit(20).toArray(function(err, movies) {
		res.render('movies', {'movies':movies, 'title':'Every Movie Ever Made'});
	});
});

/**
 *      Create
 *          Nothing much to do here
 *          Just render an empty movie page
 */
router.get('/create', function(req, res) {
	res.render('createMovie');
});

/**
 *
 *      Create Movie Completed
 *          We have all new Movie data in the req.body
 *          Create a Movie object and save to the movies collection
 *
 **/
router.post('/createMovie', function(req, res) {
	let movie = new Movie(req.body._id, req.body.title, req.body.year, req.body.simplePlot);
	moviesCol.insert(movie, function(error,result){
		res.redirect( '/movies');
	});
});

/**
 *      Top
 *          limit   the number of records to display
 *          skip    the number of records to skip
 */
router.get('/top/:skip/:limit', function(req, res) {
	let skip  = parseInt(req.params.skip);
	let limit = parseInt(req.params.limit);
	moviesCol.find({}).skip(skip).limit(limit).toArray(function(err, movies) {
		res.render('movies', {'movies':movies, 'title':'Every Movie Ever Made'});
	});
});

/**
 *      Genre
 *          limit   the number of records to display
 *          skip    the number of records to skip
 */
router.get('/genre/:genre/:skip/:limit', function(req, res) {
	let skip  = parseInt(req.params.skip);
	let limit = parseInt(req.params.limit);
	moviesCol.find({genres: req.params.genre}).skip(skip).limit(limit).toArray(function(err, movies) {
		res.render('movies', {'movies':movies, 'title':'All the ' + req.params.genre + ' you could want'});
	});
});

/**
 *      Find
 *          Data comes from the search field on the top of each page
 *          Use the text index to find the matching movies
 *          Like all movie list end points we use the movies.jade page to show our results
 */
router.post('/find', function(req, res) {
	//  just get the top 10 matches
	moviesCol.find( { $text: { $search: req.body.movie } } ).limit(10).toArray(function(err, movies) {
		if (movies.length == 0) {
			//  if nothing matches then at least return a 'Movies Not Found' page
			movies.push(new Movie(req.body.movie, 'Does not match a Movie in our DB', 2018, '' ));
		}
		res.render('movies', {'movies': movies, 'title': "Movies Matching:\n " + req.body.movie});
	});
});

/**
 *      Details
 *          using the _id parameter read the movies collection and
 *          render the movie details for the selected movie
 *          We also use the movies.jade page to show our results for the details on a movie
 *              The movies.jade page is intelligent about the number of movies returned
 *              and shows more details when it has a single movie in the array
 */
router.get('/:_id', function(req, res) {
	moviesCol.findOne({_id: req.params._id}, function(err, result) {
		let movie = null;
		if (err || !result) {
			movie = new Movie(req.params._id, 'Does not match a movie in the DB', 2018, '' );
		}
		else {
			movie = result;
		}
		//  See the [movie] code here? That creates a single entry movie array
		res.render('movies', {'movies': [movie], 'title': movie.title});
	});
});

/**
 * Update Movie
 *          #0  Detailed movie page is the current page
 *          #1  User clicks the 'Update' link which invokes the
 *              HTTP method for GET URL '/update/:_id' ('/movies/update/:_id') function
 *              the record is found and the updateMovie page is rendered
 *          #2  User makes changes and presses the 'Update' button which invokes the
 *              HTTP method POST URL '/updated/'  ('/movies/updated') function
 *          #3  updateMovie: The changes applied and saved
 *              callback is called which will send/render a message to the user
 *
 **/
router.get('/update/:_id', function(req, res) {
	moviesCol.findOne({_id:req.params._id}, function(err, result) {
		let movie = null;
		if (err || !result) {
			movie = new Movie(req.params._id, 'Does not match a movie in the DB', 2018, '' );
		}
		else {
			movie = result;
			movie.rows = Math.max((movie.simplePlot.length/80)+1, 6);
		}
		//  We found a movie matching the key ID.
		//  Render the Update form to alter the few fields we permit changes to
		res.render('updateMovie', { 'movie': movie, 'title': movie.title});
	});
});

/**
 *      updateMovie              STEP 2
 *          The Update form has been submitted
 */
router.post('/updated/', function(req, res) {
	moviesCol.updateOne( { _id: req.body._id },
		{	$set: { title: req.body.title + ".", year: req.body.year },
			$currentDate: { lastModified: true }
		},function (err, result) {
			if (err) {
				res.send({'result': 'error'});
			} else {
				//  The document was successfully updated
				res.redirect('/movies/' + req.body._id);
			}
		}
	);
});

/**
 *
 * Delete Movie Completed
 *
 **/
router.get('/delete/:_id', function(req, res) {
	moviesCol.findOne({_id:req.params._id}, function(err, result) {
		let movie = null;
		if (err) {
			movie = new Movie(req.params._id, 'Does not match a movie in our DB', 2018, '' );
		}
		else {
			movie = result;
		}
		res.render('deleteMovie', { 'movie': movie, 'title': movie.title});
	});
});

router.post('/deleted/', function(req, res) {
	moviesCol.findOne({_id: req.body._id}, function (err, movie) {
		//  The document was found. Now we will update it
		res.redirect( '/movies');
		moviesCol.deleteOne( { _id: req.body._id });
		movie.deleteDate = new Date();
		delMoviesCol.insert(movie);
	});
});

let Movie = function(_id, title, year, simplePlot) {
	this._id = _id;
	this.idIMDB = _id;
	this.title = title;
	this.urlPoster = '';
	this.urlIMDB = '';
	this.year = year;
	this.simplePlot = simplePlot;
	this.actors = [];
	this.genres = [];
};
