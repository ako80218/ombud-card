var http = require('http');
var https = require('https');
var url = require('url');

var express = require('express');
var config = require('../config.json');

//////////////////////////////////////////////////////////////
// LionkedIN API keys received from developer.linkedin.com below
var APIKey = config.apiKey;
var APIKeySecret = config.apiSecret;
var callbackURL = "http://localhost:"+config.port+"/";
var APIVersion = "v1";

// These are all of the scope variables. Remove them based on your needs
var APIScope = 'r_basicprofile';
var RandomState = function(howLong) {
    
        howLong=parseInt(howLong);
        
        if (!howLong || howLong<=0) {
            howLong=18;
        }
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";

        for (var i = 0; i < howLong; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

//////////////////////////////////////////////////////////////
// Oauth Step 1 - Redirect end-user for authorization
var OauthStep1 = function(req, response) {

        console.log("Step1");

        response.writeHead(302, {
            'Location': 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=' + APIKey + '&scope=' + APIScope + '&state=RNDM_' + RandomState(18) + '&redirect_uri=' + callbackURL
        });
        response.end();
    };

//////////////////////////////////////////////////////////////
// Oauth Step 2 - The callback post authorization
var OauthStep2 = function(request, response, code) {

        console.log("Step2");

        var options = {
            host: 'api.linkedin.com',
            port: 443,
            path: "/uas/oauth2/accessToken?grant_type=authorization_code&code=" + code + "&redirect_uri=" + callbackURL + "&client_id=" + APIKey + "&client_secret=" + APIKeySecret
        };

        var req = https.request(options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);

            res.on('data', function(d) {
                // STEP 3 - Get LinkedIn API Data
                // We have successfully completed Oauth and have received our access_token.  Congrats! 
                // Now let's make a real API call (Example API call referencing APICalls['peopleSearchWithKeywords'] below)
                // See more example API Calls at the end of this file
                
                access_token = JSON.parse(d).access_token;
                
                var ExpiresIn29days = new Date();
                ExpiresIn29days.setDate(in30days.getDate() + 29);
                response.writeHead(200, {
                  'Set-Cookie':'LIAccess_token=' + access_token + '; Expires=' + ExpiresIn29days
                });
                        
                OauthStep3(request, response, access_token, APICalls['peopleSearchWithKeywords']);
            });
        });

        req.on('error', function(e) {
            console.error("There was an error with our Oauth Call in Step 2: " + e);
            response.end("There was an error with our Oauth Call in Step 2");
        });
        req.end();
    };

//////////////////////////////////////////////////////////////
// Oauth Step 3 - Now you can make a real API call
// Get some real LinkedIn data below
var OauthStep3 = function(request, response, access_token, APICall, callback) {

        console.log("Step3");

        if (APICall.indexOf("?")>=0) {
            var JSONformat="&format=json";
        } else {
            var JSONformat="?format=json";
        }
        
        var options = {
            host: 'api.linkedin.com',
            port: 443,
            path: '/'+APIVersion+'/' + APICall + JSONformat + "&oauth2_access_token=" + access_token
        };

        var req = https.request(options, function(res) {
            console.log("statusCode: ", res.statusCode);
            console.log("headers: ", res.headers);

            res.on('data', function(d) {
                // We have LinkedIn data!  Process it and continue with your application here
                // apiResponse =JSON.parse(d)
                response.end(d);
                console.log(d);
                // YOUR NEXT STEP HERE
            });
        });

        req.on('error', function(e) {
            console.error("There was an error with our LinkedIn API Call in Step 3: " + e);
            response.end("There was an error with our LinkedIn API Call in Step 3");
        });
        req.end();
};



// Make sure the browser isn't requesting a /favicon.ico



/* GET home page. */
module.exports={
	apiCall: function(req, res) {
		if (req.url !='/favicon.ico') {

		    // Check to see if authorization for end user has already been made and skip Oauth dance
		    var cookies = {};
		      req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
		        var parts = cookie.split('=');
		        cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
		      });
		    
		    // If we have the access_token in the cookie skip the Oauth Dance and go straight to Step 3
		    if (cookies['LIAccess_token']){
		        // STEP 3 - Get LinkedIn API Data
		        // console.log("we have the cookie value" + cookies['LIAccess_token']);
		        OauthStep3(req, res, cookies['LIAccess_token'], APICalls['peopleSearchWithKeywords']);
		    
		    } else {    
		        var queryObject = url.parse(req.url, true).query;

		        if (!queryObject.code) {
		            // STEP 1 - If this is the first run send them to LinkedIn for Auth
		            OauthStep1(req, res);
		        } else {
		            // STEP 2 - If they have given consent and are at the callback do the final token request
		            OauthStep2(req, res, queryObject.code);
		        }
		    }
		}
	console.log('Visit http://127.0.0.1:3000/ in your browser to test the LinkedIn Oauth2 API Authentication');
  	res.redirect('/linkedin-view');
	},
	view:function(req, res){
		res.render('linkedin-view.jade');
	}


}

