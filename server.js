const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const cors = require('cors');

// app.use(bodyParser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const passport = require('passport'); // works with express-session to save a user's session
const session = require('express-session'); // works with passport to save a user's session
const GitHubStrategy = require('passport-github').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;


const routes = require('./app/routes.js'); // putting routes in a seperate file to cut down on clutter


// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(session({ // from express-session, to keep a cookie on the computer of the user
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.enable('trust proxy'); // enables you to get ip address with just the code req.ip

app.set('view engine', 'pug');


mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  
  if (err) {
    console.log('Database error: ' + err);
  }
  else {
    
    let db = client.db('freecodecamp2018');
    routes(app);
    console.log('Successful database connection');

    //serialization and app.listen
    passport.serializeUser((user, done) => { // turns user's personal information into a key-id to be used to identify user
      // console.log("serialize ", user); // STEP 2
      done(null, user.id);
    });

    passport.deserializeUser((id, done) => { // undoes the serialization to turn key-id back into user's info
      // db.collection('polls').findOne({ _id: new ObjectID(id) }, (err, doc) => { done(null, doc) });
      done(null, id);
    });
  }
  
  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_ID,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: 'https://materialistic-earthworm.glitch.me/auth/twitter/callback'
  },
  (accessToken, refreshToken, profile, cb) => { // this callback will vary based on the passport strategy (Github, Twitter, Google, etc.)
    // console.log("profile ", profile); // STEP 1
    cb(null, profile);
    // Database logic here with callback containing our user object
  }));
  
  
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});