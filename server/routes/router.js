const express = require("express");
const route = express.Router();
const Entry = require("../model/entry");

route.get("/", async (req, res) => {});

route.get("/addUser", (req, res) => {
  res.render("addUser", {});
});

route.get("/deleteUser", (req, res) => {
  res.render("deleteUser", {});
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
