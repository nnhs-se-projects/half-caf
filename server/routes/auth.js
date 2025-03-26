/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require("express");
const route = express.Router();

const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID = process.env.CLIENT_ID;
const oAuth2 = new OAuth2Client(CLIENT_ID);

// route.get("/", (req, res) => {
//   res.render("auth");
// });

route.post("/", async (req, res) => {
  const token = req.body.token;
  const ticket = await oAuth2.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });

  // extract payload now with name -- can use for baristas
  const payload = ticket.getPayload();
  const { sub, email, name } = payload; // name, given_name, family_name (also available)
  req.session.email = email;
  req.session.name = name; // store user's full name

  // log name and email to console for testing
  console.log("Authenticated user:", { name, email });

  res.status(201).end();
});

module.exports = route;
