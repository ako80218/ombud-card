var express = require('express');
var utilities = require('../utilities.js');


module.exports={
	home: function(req, res) {
		var message = 'Welcome';
		var linkText = "Get Started!";
		var list = utilities.parseCookies(req);

		console.log("COOKIES LIST:  ", list);
		if (req.query.error === 'access_denied'){
			message=req.query.error;
			linkText = 'Try Again!';
		}
		console.log(list);
		// res.clearCookie('app.sess'); 
  		res.render('index.jade',{title: 'Quick Card',
			message:message,
			linkText:linkText});
}

}


