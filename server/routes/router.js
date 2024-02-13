const express = require("express");
const route = express.Router();

route.get("/", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/addUser", (req, res) => {
  res.render("addUser");
});

route.get("/deleteUser", (req, res) => {
  res.render("deleteUser");
});

route.get("/viewUser", (req, res) => {
  res.render("viewUser");
});

route.get("/addDrink", (req, res) => {
  res.render("addDrink");
});

route.get("/modifyDrink", (req, res) => {
  res.render("modifyDrink");
});

route.get("/deleteDrink", (req, res) => {
  res.render("deleteDrink");
});

route.get("/addFlavor", (req, res) => {
  res.render("addFlavor");
});

route.get("/deleteFlavor", (req, res) => {
  res.render("deleteFlavor");
});

route.get("/barista", (req, res) => {
  res.render("barista");
});

route.get("/completed", (req, res) => {
  res.render("completed");
});

route.get("/teacherPopularDrinks", async (req, res) => {
  res.render("teacherPopularDrinks");
});

route.get("/homePopularDrinks", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/teacherMyOrder", async (req, res) => {
  res.render("teacherMyOrder");
});

route.get("/teacherMyFavorites", async (req, res) => {
  res.render("teacherMyFavorites");
});

route.get("/teacherOrderHistory", async (req, res) => {
  res.render("teacherOrderHistory");
});

route.get("/orderConfirmation", async (req, res) => {
  res.render("orderConfirmation");
});

route.get("/addTopping", async (req, res) => {
  res.render("addTopping");
});

route.get("/deleteTopping", async (req, res) => {
  res.render("deleteTopping");
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
