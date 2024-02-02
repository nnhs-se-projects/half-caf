const express = require("express");
const route = express.Router();

// pass a path (e.g., "/") and callback function to the get method
//  when the client makes an HTTP GET request to the specified path,
//  the callback function is executed
route.get("/", async (req, res) => {
  res.render("auth");
});

route.get("/barista", (req, res) => {
  res.render("barista");
});

route.get("/completed", (req, res) => {
  res.render("completed");
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
