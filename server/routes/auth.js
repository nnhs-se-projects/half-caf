/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require("express");
const route = express.Router();
const User = require("../model/user");

const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID = process.env.CLIENT_ID;
const oAuth2 = new OAuth2Client(CLIENT_ID);

route.get("/", (req, res) => {
  if (req.session.email) {
    res.redirect("/redirectUser");
  } else {
    res.render("auth");
  }
});

route.post("/", async (req, res) => {
  const token = req.body.token;
  const ticket = await oAuth2.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });

  // store the authenticated user's email in the session
  const { sub, email } = ticket.getPayload();
  console.log(sub, email);
  req.session.email = email;

  const user = await User.findOne({ email });
  if (
    (user === undefined || user === null) &&
    email.indexOf("@naperville203.org") > -1
  ) {
    console.log("User is a staff member, creating account...");
    const newUser = new User({
      email: req.session.email,
      userType: "teacher",
    });
    await newUser.save();
  }
  res.status(201).end();
});

module.exports = route;
