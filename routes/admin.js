/**
 * Created by Edge Tech Academy on 1/9/2017.
 */
let express = require('express');
let admin = module.exports = express();

admin.locals.developer = "Edge Tech Academy Admin";
admin.locals.course = "JavaScript";
admin.locals.date = "May 15, 2017";
admin.locals.moduleName = "Admin pages for JavaScript using the Express framework and Pug template.";

//      location mounting is specified here on '/adm*n' and '/manager'. Not in the parent
//      Let's have a nice separation of concerns down to the url definition


admin.get('/', function (req, res) {
	console.log(admin.mountpath); // [ '/adm*n', '/manager' ]

	let header = "<h3>Admin Application Settings</h3>";
	for ( let prop in req.app.locals ) {
		header += "<strong>" + prop + "</strong>: " + req.app.locals[prop] + '<br>';
	}

	res.send('Admin Homepage<br>Base URL:' + req.baseUrl + '<br>' + header);
});

admin.on('mount', function (parent) {
	console.log('Admin Mounted');
});
