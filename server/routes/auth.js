/**
 * Routes for authentication using the Google Sign-In API
 */

// cSpell:ignoreRegExp /[^\s]{40,}/

const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Drink = require("../model/drink");

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

  // verification throws for a missing, malformed or expired token. express 4
  //  does not catch a rejected promise from an async handler, so without this
  //  try/catch the rejection is unhandled and takes the whole server down.
  let payload;
  try {
    const ticket = await oAuth2.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google ID token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid or missing ID token." });
  }

  const { email, name } = payload; // name, given_name, family_name (also available)
  req.session.email = email;
  req.session.name = name; // store user's full name
  req.session.cart = [];

  // MOBILE LONG LOGIN
  if (req.body.rememberMe) {
    req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000; // Rn set for a year, could change this later to be something more secure masybe
  }

  const user = await User.findOne({ email });

  console.log("Authenticated user with google:", { name, email });

  // check for if this is the first time a staff member is logging into the app and create a user for them if so
  if (!user) {
    if (email.indexOf("@naperville203.org") > -1) {
      console.log("Adding new user to the database.");
      const newUser = new User({
        email,
        userType: "teacher",
      });
      await newUser.save();
    } else {
      console.log("User isn't a staff member and isn't in the database.");
      req.session.email = null;
    }
  }

  res.status(201).end();
});

route.get("/logout", async (req, res) => {
  if (req.session.token) {
    // Revoke Google's access token
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${req.session.token}`,
      {
        method: "POST",
      }
    ).catch((err) => {
      console.error("Error revoking token:", err);
    });
  }

  // Remove drinks from cart and clean up
  if (req.session.cart) {
    for (const drink of req.session.cart) {
      await Drink.findByIdAndRemove(drink);
    }
  }

  req.session.destroy((err) => {
    if (err) {
      return console.error("Logout error:", err);
    }
    // Redirect to auth page after logout
    res.redirect("/auth");
  });
});

module.exports = route;
