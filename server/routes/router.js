const express = require("express");
const route = express.Router();
const User = require("../model/user");

route.get("/", async (req, res) => {
  res.render("index");
});

route.get("/auth", (req, res) => {
  res.render("auth");
});

async function getUserRoles(email) {
  try {
    var user = await User.findOne({ email: email }, "userType");
    var userRole = user.userType;
    return userRole;
  } catch (error) {
    console.error(error);
  }
}

route.get("/redirectUser", async (req, res) => {
  try {
    var role = await getUserRoles(req.session.email);
    if (role === "admin") {
      res.redirect("/addUser");
    } else if (role === "barista") {
      res.redirect("/barista");
    } else if (role === "teacher") {
      res.redirect("/teacherPopularDrinks");
    } else {
      console.log("Role Not Recognized");
      res.redirect("/");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
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
