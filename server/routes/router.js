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

route.get("/viewUser", (req, res) => {
  res.render("viewUser", {});
});

route.get("/addDrink", (req, res) => {
  res.render("addDrink", {});
});

route.get("/modifyDrink", (req, res) => {
  res.render("modifyDrink", {});
});

route.get("/deleteDrink", (req, res) => {
  res.render("deleteDrink", {});
});

route.get("/addFlavor", (req, res) => {
  res.render("addFlavor", {});
});

route.get("/deleteFlavor", (req, res) => {
  res.render("deleteFlavor", {});
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
