/**
 * Make this JS file an express module
 *      Get the router object to set up our end points
 *
 *
 *      https://www.omdbapi.com/?i=tt3896198&plot=full&apikey=2c791b47
 *
 */
let express = require('express');
let router = module.exports = express.Router();

/*
 *      I chose to go the route of getting the actors Collection using an
 *      initializing method that would be called once at start up time
 *      thereafter the actorsCol reference would be available to all endpoints
 */
let actorsCol = null;
let delActorsCol = null;

router.init = function (db) {
	actorsCol = db.collection('actors');
	delActorsCol = db.collection('deleteActors');
};

/**
 *      Find
 *          Just list the first 20 actors in the actors collection
 *          We have 47,000 but we will limit the return to 20
 */
router.get('/', function (req, res) {
	actorsCol.find({}).limit(20).toArray(function (err, actors) {
		res.render('actors', {'actors': actors, 'title': 'All Actors'});
	});
});

/**
 *      Create
 *          Nothing much to do here
 *          Just render an empty actor page
 */
router.get('/create', function (req, res) {
	res.render('createActor');
});

/**
 *
 *      Create Actor Completed
 *          We have all new Actor data in the req.body
 *          Create an Actor object and save to the actors collection
 *
 **/
router.post('/created', function (req, res) {
	let actor = new Actor(req.body.id, req.body.name);
	actorsCol.insert(actor, () => res.redirect('/actors') );
});

/**
 *      Top
 *          limit   the number of records to display
 *          skip    the number of records to skip
 */
router.get('/top/:skip/:limit', function (req, res) {
	let skip = parseInt(req.params.skip);
	let limit = parseInt(req.params.limit);
	actorsCol.find({}).skip(skip).limit(limit).toArray(function (err, actors) {
		res.render('actors', {'actors': actors, 'title': 'Every Actor to Perform'});
	});
});

/**
 *      Find
 *          Data comes from the search field on the top of each page
 *          Use the text index to find the matching movies
 *          Like all movie list end points we use the movies.jade page to show our results
 */
router.post('/find', function (req, res) {
	//  just get the top 10 matches
	actorsCol.find({$text: {$search: req.body.actor}}).limit(10).toArray(function (err, actors) {
		if (!actors || actors.length === 0) {
			actors = [];
			//  if nothing matches then at least return a 'Movies Not Found' page
			actors.push(new Actor(req.body.actor, `${req.body.actor} Does not match an Actor in our DB`));
		}
		res.render('actors', {'actors': actors, 'title': "Actors Matching:\n " + req.body.actor});
	});
});

/**
 *      Details
 *          using the id parameter read the actors collection and
 *          render the actor details for the selected actor
 *          We also use the actors.jade page to show our results for the details on a movie
 *              The actors.jade page is intelligent about the number of actors returned
 *              and shows more details when it has a single actor in the array
 */
router.get('/:id', function (req, res) {
	actorsCol.findOne({id: req.params.id}, function (err, actor) {
		if (err || !actor) {
			actor = new Actor(req.params.id, 'Does not match an Actor in our DB');
		}
		//  See the [actor] code here? That creates a single entry actor array
		res.render('actors', {'actors': [actor], 'title': actor.name});
	});
});

/**
 * Update Actor
 *          #0  Detailed actor page is the current page
 *          #1  User clicks the 'Update' link which invokes the
 *              HTTP method for GET URL '/update/:id' ('/actors/update/:id') function
 *              the record is found and the updateActor page is rendered
 *          #2  User makes changes and presses the 'Update' button which invokes the
 *              HTTP method POST URL '/updated/'  ('/actors/updated') function
 *          #3  updateActor: The changes applied and saved
 *              callback is called which will send/render a message to the user
 *
 **/
router.get('/update/:id', function (req, res) {
	actorsCol.findOne({id: req.params.id}, function (err, actor) {
		if (err || !actor) {
			actor = new Actor(req.params.id, 'Does not match an Actor in the DB');
		} else {
			actor.rows = Math.max((actor.bio.length / 80) + 1, 6);
		}
		//  We found a actor matching the key ID.
		//  Render the Update form to alter the few fields we permit changes to
		res.render('updateActor', {'actor': actor, 'title': actor.title});
	});
});

/**
 *      updateActor              STEP 2
 *          The Update form has been submitted
 */
router.post('/updated/', function (req, res) {
	actorsCol.updateOne({id: req.body.id},
		{
			$set: {title: req.body.name + ".", bio: req.body.bio},
			$currentDate: {lastModified: true}
		}, function (err, result) {
			if (err) {
				res.send({'result': 'error'});
			} else {
				//  The document was successfully updated
				res.redirect('/actors/' + req.body.id);
			}
		}
	);
});

/**
 *
 * Delete Actor Completed
 *
 **/
router.get('/delete/:id', function (req, res) {
	actorsCol.findOne({id: req.params.id}, function (err, result) {
		let actor;
		if (err || !result) {
			actor = new Actor(req.params.id, 'Does not match an Actor in our DB');
		} else {
			actor = result;
		}
		res.render('deleteActor', {'actor': actor, 'title': actor.name});
	});
});

router.post('/deleted/', function (req, res) {
	actorsCol.findOne({id: req.body.id}, function (err, actor) {
		//  The document was found. Now we will update it
		res.redirect('/actors');
		actorsCol.deleteOne({id: req.body.id});
		actor.deleteDate = new Date();
		delActorsCol.insert(actor);
	});
});

let Actor = function (id, name) {
	this.id = id;
	this.image = '../images/genres.jpg';
	this.name = name;
	this.castMovies = [];
};
