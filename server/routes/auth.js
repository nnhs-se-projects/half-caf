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

// possible OAuth code, need to set up link to the database

// async function getUserRole(userEmail) {
//   try {
//     const user = await User.findOne({ email: userEmail }); // Find the user by email
//     if (user) {
//       return user.userType; // Return the userType if the user is found
//     } else {
//       return null; // Return null or some default value if no user is found
//     }
//   } catch (error) {
//     console.error("Error fetching user role:", error);
//     throw error; // Rethrow or handle the error appropriately
//   }
// }

module.exports = route;
