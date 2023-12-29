/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require("express");
const route = express.Router();

const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID =
  "1022838194773-p8g5ac0qr11mfko61qurgnqdb9jitpjf.apps.googleusercontent.com";
const oAuth2 = new OAuth2Client(CLIENT_ID);

route.get("/", (req, res) => {
  res.render("auth");
});

route.post("/", async (req, res) => {
  const token = req.body.token;
  const ticket = await oAuth2.verifyIdToken({
    idToken: token,
    audience: CLIENT_ID,
  });

  // store the authenticated user's email in the session
  const { sub, email } = ticket.getPayload();
  req.session.email = email;
  console.log(sub, email);
  res.status(201).end();
});

module.exports = route;
