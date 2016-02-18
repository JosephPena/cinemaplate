var browserify = require('browserify-middleware');
var express = require('express');
var Path = require('path');
var yelp = require('./yelpHelp');
var sass = require('node-sass-endpoint')
//
// Get Postgres rolling.
//
var pg = require('pg');
var pgConString = '';
if (process.env.NODE_ENV !== 'production') {
  // If trying to connect to DB remotely (ie, dev environment)
  // we need to add the ssl flag.
  pgConString = process.env.DATABASE_URL + '?ssl=true';
} else {
  pgConString = process.env.DATABASE_URL;
}

var routes = express.Router();

//still need to fold into routes.get
yelp.getFoodByZip(78701).then(function(res){
    console.log('i am the res', res); 
});

//
// Provide a browserified file at a specified path
//
routes.get('/app-bundle.js',
  browserify('./client/app.js'));

routes.get('/css/app-bundle.css',
  sass.serve('./client/public/scss/app.scss'))

//
// Match endpoint to match movie genres with cuisines
//
routes.get('/api/match/:zip', function(req, res) {
  var zip = req.params.zip;

  var pgClient = new pg.Client(pgConString);
  pgClient.connect(function(err){
    if (err){
      return console.error('could not connect to postgres', err);
    }
    pgClient.query('SELECT * FROM "genres"', function (err, result){
      if (err){
        return console.error('error running query', err);
      }
      res.send(result.rows);
      pgClient.end();
    });
  });
});

routes.get('/', function(req, res){
  res.sendFile( assetFolder + '/index.html' );
});

//
// Static assets (html, etc.)
//
var assetFolder = Path.resolve(__dirname, '../client/public');
routes.use(express.static(assetFolder));


if (process.env.NODE_ENV !== 'test') {
  //
  // The Catch-all Route
  // This is for supporting browser history pushstate.
  // NOTE: Make sure this route is always LAST.
  //
  routes.get('/*', function(req, res){
    res.sendFile( assetFolder + '/index.html' );
  });

  //
  // We're in development or production mode;
  // create and run a real server.
  //
  var app = express();

  // Parse incoming request bodies as JSON
  app.use( require('body-parser').json() );

  // Mount our main router
  app.use('/', routes);

  // Start the server!
  var port = process.env.PORT || 4000;
  app.listen(port);
  console.log("Listening on port", port);
}
else {
  // We're in test mode; make this file importable instead.
  module.exports = routes;
}