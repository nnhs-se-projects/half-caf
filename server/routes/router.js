const express = require("express");
const route = express.Router();
const User = require("../model/user");

route.get("/", async (req, res) => {
  res.render("index");
});

route.get("/auth", (req, res) => {
  res.render("auth");
});

async function getUserRoles(email1) {
  try {
    const user = await User.findOne({ email: email1 }, "userType");
    // console.log("role: " + user1.userType);
  } catch (error) {
    console.error(error);
  }
}

route.get("/addUser", (req, res) => {
  // console.log("In xxxxx..." + req.session.email);
  getUserRoles(req.session.email);
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

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
