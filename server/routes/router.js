const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temp.json");

route.get("/", async (req, res) => {
  res.render("homePopularDrinks");
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

route.post("/addUser", async (req, res) => {
  const user = new User({
    isActivated: true,
    email: req.body.email,
    userType: req.body.userType,
  });
  await user.save();
  res.status(201).end();
});

route.get("/deleteUser", async (req, res) => {
  const users = await User.find();

  const formattedUsers = users.map((user) => {
    return {
      email: user.email,
      id: user._id,
    };
  });
  res.render("deleteUser", { usersJs: formattedUsers });
});

route.delete("/deleteUser/:id", async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndRemove(userId);
  res.end();
});

route.get("/viewUser", (req, res) => {
  res.render("viewUser");
});

route.get("/addDrink", async (req, res) => {
  const flavors = await Flavor.find();
  const toppings = await Topping.find();

  const formattedFlavors = flavors.map((flavor) => {
    return {
      flavor: flavor.flavor,
      id: flavor._id,
    };
  });

  const formattedToppings = toppings.map((topping) => {
    return {
      topping: topping.topping,
      id: topping._id,
    };
  });
  res.render("addDrink", {
    temps: TempJson,
    toppings: formattedToppings,
    flavors: formattedFlavors,
  });
});

route.post("/addDrink", async (req, res) => {
  const drink = new MenuItem({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    popular: req.body.popular,
    flavors: req.body.checkedFlavors,
    toppings: req.body.checkedToppings,
    temp: req.body.checkedTemps,
    caffeination: req.body.caf,
    special: req.body.special,
  });
  await drink.save();
  res.status(201).end();
});

// everything loads on the Modify Drink page when a
// menu item is selected, except for flavors
route.get("/modifyDrink", async (req, res) => {
  // get id of selected drink
  const { id } = req.query;

  const menuItems = await MenuItem.find();
  const toppings = await Topping.find();
  const flavors = await Flavor.find();

  let selectedMenuItem;
  // check if any drink has been selected
  if (id != null) {
    selectedMenuItem = await MenuItem.findById(id);
  } else {
    selectedMenuItem = undefined;
  }

  const formattedMenuItems = menuItems.map((menuItem) => {
    return {
      name: menuItem.name,
      id: menuItem._id,
    };
  });

  res.render("modifyDrink", {
    menuItems: formattedMenuItems,
    selectedMenuItem,
    toppings,
    flavors,
    temps: TempJson,
  });
});

route.get("/deleteDrink", async (req, res) => {
  const menuItems = await MenuItem.find();

  const formattedMenuItems = menuItems.map((menuItem) => {
    return {
      name: menuItem.name,
      id: menuItem._id,
    };
  });
  res.render("deleteDrink", { menuItems: formattedMenuItems });
});

route.delete("/deleteDrink/:id", async (req, res) => {
  const menuItemId = req.params.id;
  await MenuItem.findByIdAndRemove(menuItemId);
  res.end();
});

route.get("/addFlavor", (req, res) => {
  res.render("addFlavor");
});

route.post("/addFlavor", async (req, res) => {
  const flavor = new Flavor({
    flavor: req.body.flavor,
    isAvailable: true,
  });
  await flavor.save();
  res.status(201).end();
});

route.get("/deleteFlavor", async (req, res) => {
  const flavors = await Flavor.find();

  const formattedFlavors = flavors.map((flavor) => {
    return {
      flavor: flavor.flavor,
      id: flavor._id,
    };
  });
  res.render("deleteFlavor", { flavors: formattedFlavors });
});

route.delete("/deleteFlavor/:id", async (req, res) => {
  const flavorId = req.params.id;
  await Flavor.findByIdAndRemove(flavorId);
  res.end();
});

route.get("/barista", (req, res) => {
  res.render("barista");
});

route.get("/completed", (req, res) => {
  res.render("completed");
});

// Route Teacher Menu
route.get("/teacherMenu/", async (req, res) => {
  res.render("teacherMenu");
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

route.get("/customizeDrink", async (req, res) => {
  const { drink, price, description } = req.query; // Extract query parameters
  res.render("customizeDrink", { drink, price, description });
}); // Pass parameters to view renderer

route.get("/addTopping", async (req, res) => {
  res.render("addTopping");
});

route.post("/addTopping", async (req, res) => {
  const topping = new Topping({
    topping: req.body.topping,
    isAvailable: true,
    price: req.body.price,
  });
  await topping.save();
  res.status(201).end();
});

route.get("/deleteTopping", async (req, res) => {
  const toppings = await Topping.find();

  const formattedToppings = toppings.map((topping) => {
    return {
      topping: topping.topping,
      id: topping._id,
    };
  });
  res.render("deleteTopping", { toppings: formattedToppings });
});

route.delete("/deleteTopping/:id", async (req, res) => {
  const toppingId = req.params.id;
  await Topping.findByIdAndRemove(toppingId);
  res.end();
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));

module.exports = route;
