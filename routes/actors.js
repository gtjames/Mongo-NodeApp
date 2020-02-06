/**
 * Make this JS file an express module
 *      Get the router object to set up our end points
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

router.init = function(db) {
	actorsCol = db.collection('actors');
	delActorsCol = db.collection('deleteActors');
};

/**
 *      Find
 *          Just list the first 20 actors in the actors collection
 *          We have 47,000 but we will limit the return to 20
 */
router.get('/', function(req, res) {
	actorsCol.find({}).limit(20).toArray(function(err, items) {
		for (let m = 0; m < items.length; m++) {
			//  why you ask? Some actors don't have a list of filmes
			//  I chose to test and accomodate for that here
			//  rather than in the pug file
			if(items[m].filmography == undefined) {
				items[m].filmography=[];
			}
		}
		res.render('actors', {'actors': items, 'title': 'All Actors'});
	});
});

/**
 *      Create
 *          Nothing much to do here
 *          Just render an empty actor page
 */
router.get('/create', function(req, res) {
	res.render('createActor');
});

/**
 *
 *      Create Actor Completed
 *          We have all new Actor data in the req.body
 *          Create an Actor object and save to the actors collection
 *
 **/
router.post('/created', function(req, res) {
	let actor = new Actor(req.body._id, req.body.name);
	actorsCol.insert(actor, function(error,result){
		res.redirect( '/actors');
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
	actorsCol.find({}).skip(skip).limit(limit).toArray(function(err, actors) {
		res.render('actors', {'actors': actors, 'title':'Every Actor to Perform'});
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
	actorsCol.find( { $text: { $search: req.body.actor } } ).limit(10).toArray(function(err, actors) {
		if (actors.length == 0) {
			//  if nothing matches then at least return a 'Movies Not Found' page
			actors.push(new Actor(req.body.actor, 'Does not match an Actor in our DB'));
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
router.get('/:_id', function(req, res) {
	actorsCol.findOne({_id: req.params._id}, function(err, result) {
		let actor = null;
		if (err || !result) {
			actor = new Actor(req.params.id, 'Does not match an Actor in our DB' );
		}
		else {
			actor = result;
		}
		//  See the [actor] code here? That creates a single entry actor array
		res.render('actors', {'actors': [actor], 'title': actor.name});
	});
});

/**
 * Update Actor
 *          #0  Detailed actor page is the current page
 *          #1  User clicks the 'Update' link which invokes the
 *              HTTP method for GET URL '/update/:_id' ('/actors/update/:_id') function
 *              the record is found and the updateActor page is rendered
 *          #2  User makes changes and presses the 'Update' button which invokes the
 *              HTTP method POST URL '/updated/'  ('/actors/updated') function
 *          #3  updateActor: The changes applied and saved
 *              callback is called which will send/render a message to the user
 *
 **/
router.get('/update/:_id', function(req, res) {
	actorsCol.findOne({_id:req.params._id}, function(err, result) {
		let actor = null;
		if (err || !result) {
			actor = new Actor(req.params._id, 'Does not match an Actor in the DB');
		}
		else {
			actor = result;
			actor.rows = Math.max((actor.bio.length/80)+1, 6);
		}
		//  We found a actor matching the key ID.
		//  Render the Update form to alter the few fields we permit changes to
		res.render('updateActor', { 'actor': actor, 'title': actor.title});
	});
});

/**
 *      updateActor              STEP 2
 *          The Update form has been submitted
 */
router.post('/updated/', function(req, res) {
	actorsCol.updateOne( { _id: req.body._id },
		{	$set: { title: req.body.name + ".", bio: req.body.bio },
			$currentDate: { lastModified: true }
		},function (err, result) {
			if (err) {
				res.send({'result': 'error'});
			} else {
				//  The document was successfully updated
				res.redirect('/actors/' + req.body._id);
			}
		}
	);
});

/**
 *
 * Delete Actor Completed
 *
 **/
router.get('/delete/:_id', function(req, res) {
	actorsCol.findOne({_id:req.params._id}, function(err, result) {
		let actor = null;
		if (err || !result) {
			actor = new Actor(req.params._id, 'Does not match an Actor in our DB' );
		}
		else {
			actor = result;
		}
		res.render('deleteActor', { 'actor': actor, 'title': actor.name});
	});
});

router.post('/deleted/', function(req, res) {
	actorsCol.findOne({_id: req.body._id}, function (err, actor) {
		//  The document was found. Now we will update it
		res.redirect( '/actors');
		actorsCol.deleteOne( { _id: req.body._id });
		actor.deleteDate = new Date();
		delActorsCol.insert(actor);
	});
});

let Actor = function(_id, name) {
	this.idIMDB = _id;
	this.urlPhoto = '';
	this._id = _id;
	this.name = name;
	this.filmography = [];
};
