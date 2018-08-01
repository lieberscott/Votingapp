//const express = require('express');
const passport = require('passport');

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.connect(process.env.DATABASE, { useNewUrlParser: true });

let PollSchema = new Schema({
  title: { type: String, required: true },
  answers: [{
    option: { type: String },
    votes: { type: Number },
    _id: false
  }],
  created_by: { type: String, required: true },
  details: {
    display_name: { type: String },
    username: { type: String },
    provider: { type: String }
  },
  date_added: { type: Date, default: new Date() },
  answeredIPs: [String],
  answeredUsers: [String]
});

let Poll = mongoose.model("Poll", PollSchema);

module.exports = (app, db) => {
  
  app.get('/', async (req, res) => {
    
    let polls = await Poll.find({}, '_id title', (err, data) => {
      if (err) {
        console.log(err);
        res.json({ error: "error" });
      }
      else {
        return data;
      }
    });
    
    
    if (req.session.passport && req.session.passport.user) { // logged in or cookie has been preserved from past session
      res.render(process.cwd() + '/views/pug/index', { signedIn: true, polls, name: req.session.display_name });
    }
    else {
      res.render(process.cwd() + '/views/pug/index', { signedIn: false, polls });
    }
  });
  
  app.route('/answer')
  .post(async (req, res) => {

    let referer = req.headers.referer; // url, which includes the mongo ID at the end
    let regex = /polls\//; // regex to split the url to isolate the mongo ID
    let id = referer.split(regex)[1].split("?")[0]; // url includes a ? at the end, so we have to split twice to get rid of it

    let body = req.body;

    // answer submitted by user
    let answer = Object.keys(body)[0]; // this code works for both a preselected option or user-generated option

    let user = req.session.user_id || undefined;
    let ip = req.ip;

    let poll = Poll.findByIdAndUpdate(id, { $addToSet: { answeredIPs: ip, answeredUsers: user } }, (err, data) => {
      if (err) { console.log(err); }
      else {
        let answers = data.answers;
        let len = answers.length;
        let add = true; // add the answer to the array, pending results of ensuing for-loop

        // check all the answers in database, if one is equal to the new answer submitted, change add to false and increment vote total
        for (let i = 0; i < len; i++) {
          if (answers[i].option == answer) {
            answers[i].votes = answers[i].votes + 1;
            add = false;
            break;
          }
        }

        if (add) { // user-generated answer is not already in database
          answers.push({ option: answer, votes: 1 });
        }

        data.save();
        return data;
      }
    });

    // no redirect, page will reload because it's an ajax request
  });
  
  app.route('/auth/twitter')
  .get(passport.authenticate('twitter'), (req, res) => {
    res.redirect('/');
  });
  
  app.route('/auth/twitter/callback')
  .get(passport.authenticate('twitter', { failureRedirect: '/' }), (req, res) => {
    console.log(req.user);
    console.log("req : ", req);
    req.session.user_id = req.user.id; // number
    req.session.display_name = req.user.displayName || ""; // Scott Lieber
    req.session.username = req.user.username || ""; // lieberscott
    req.session.provider = req.user.provider || ""; // github
    res.redirect('/mypolls');
  });
  
  app.route('/mypolls')
  .get(ensureAuthenticated, async (req, res) => {
    
    let user_id = req.session.user_id;
    
    let obj = { created_by: user_id };
    
    let mypolls = await Poll.find(obj, (err, data) => {
      if (err) {
        console.log(err);
        res.json({ error: "error" });
      }
      else {
        return data;
      }
    });

    res.render(process.cwd() + '/views/pug/mypolls', { signedIn: true, mypolls, name: req.session.display_name });
  });
  
  app.route('/newpoll')
  .get(ensureAuthenticated, (req, res) => { // new poll form
    res.render(process.cwd() + '/views/pug/newpoll', { signedIn: true, name: req.session.display_name });
  })
  .post(ensureAuthenticated, async (req, res) => { // submit a new poll
    
    // FOR FORM TO WORK: in server.js file
    // Need body-parser
    // Need app.use(bodyparser.urlencoded({ extended: true }));
    // Not for this app, but for others, you may need app.use(bodyParser.json());    
    let regex = /\r\n?|\n/g; // \r, \r\n, or \n (line break varies based on operating system)
    let title = req.body.title;
    let string = req.body.answers;
    let answers = string.split(regex); // array
    let user_id = req.session.user_id;
    let display_name = req.session.display_name;
    let username = req.session.username;
    let email = req.session.email;
    let provider = req.session.provider;
    
    let answersArr = [];
    let obj;
    
    for (let i = 0; i < answers.length; i++) {
      obj = {};
      obj.option = answers[i];
      obj.votes = 0;
      answersArr.push(obj);
    }
    
    let newentry = new Poll({
      title,
      answers: answersArr,
      created_by: user_id,
      details: {
        display_name,
        username,
        email,
        provider
      }
    });

    let result = await newentry.save((err, data) => {
      if (err) { console.log(err) }
      else { console.log("success") }
    });

    return res.status(200).send({ result: "redirect", url: "/mypolls" }); // will be sent to ajax request for redirect to profile page
  });

  app.route('/polls/:pollnumber')
  .get(async (req, res) => {
    
    let search = req.params.pollnumber;
    
    let ip = req.ip;
    let userID = req.session.user_id || "none";
    
    if (userID != "none") { userID = userID.toString(); }
    
    let poll = await Poll.findOne({ _id: search }, '-details', (err, data) => {
      if (err) {
        console.log(err);
        res.json({ error: "error" });
      }
      else {
        return data;
      }
    });
    
    if (req.session.user_id) {
      res.render(process.cwd() + '/views/pug/chart', { poll, ip, userID, signedIn: true, name: req.session.display_name });
    }
    else {
      res.render(process.cwd() + '/views/pug/chart', { poll, ip, userID });
    }
  });
  
  app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
  });
  
  function ensureAuthenticated(req, res, next) { // middelware to prevent user from manually typing into address bar url.com/profile
    if (req.isAuthenticated()) { // isAuthenticated is part of passport
      return next();
    }
    res.redirect('/'); // else redirect to homepage
  };
  
}