const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temp.json");
const Toppings = require("../model/topping");
const Drink = require("../model/drink");
const Order = require("../model/order");

route.get("/", async (req, res) => {
  res.render("homePopularDrinks");
});

route.get("/auth", (req, res) => {
  res.render("auth");
});

async function getUserRoles(email) {
  try {
    let user = await User.findOne({ email: email }, "userType");
    let userRole = user.userType;
    return userRole;
  } catch (error) {
    console.error(error);
  }
}

// Separate redirectUser route is used to easily redirect
//    the user dependent on their role
route.get("/redirectUser", async (req, res) => {
  try {
    let role = await getUserRoles(req.session.email);
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

  // Destroy session or remove user data from session
  req.session.destroy((err) => {
    if (err) {
      return console.error("Logout error:", err);
    }
    // Redirect to home page or login page after logout
    res.redirect("/");
  });
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
    flavor: req.body.checkedFlavors,
    toppings: req.body.checkedToppings,
    temp: req.body.checkedTemps,
    caffeination: req.body.caf,
    special: req.body.special,
  });
  await drink.save();
  res.status(200).end();
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

route.get("/barista", (req, res) => {
  res.render("barista");
});

route.get("/completed", (req, res) => {
  res.render("completed");
});

// Route Teacher Menu
route.get("/teacherMenu/", async (req, res) => {
  const menu = await MenuItem.find();
  res.render("teacherMenu", {
    menuItems: menu,
  });
});

route.get("/customizeDrink/:name", async (req, res) => {
  const selectedDrink = req.params.name; // params holds parameters from the URL path
  const drinkName = decodeURIComponent(selectedDrink.replace("%20/", " ")); // convert URL-friendly string to regular name format
  try {
    const drink = await findDrinkByName(drinkName); // finds drink by name

    // available flavors array
    const flavors = [];
    for (let i = 0; i < drink.flavor.length; i++) {
      flavors[i] = await findFlavorById(drink.flavor[i]);
    }

    // available toppings array
    const toppings = [];
    for (let i = 0; i < drink.toppings.length; i++) {
      toppings[i] = await findToppingsById(drink.toppings[i]);
    }

    if (drink) {
      res.render("customizeDrink", {
        drink: drink,
        flavors: flavors,
        temps: drink.temp,
        toppings: toppings,
      });
    } else {
      res.status(404).send("Drink not found");
    }
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink:", error);
    res.status(500);
  }
});

// gets drink object by its name
async function findDrinkByName(drinkName) {
  try {
    const drink = await MenuItem.findOne({ name: drinkName });
    return drink;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink by name:", error);
    res.status(500);
  }
}

// finds flavor object by id given by drink.flavor
async function findFlavorById(id) {
  try {
    const flavor = await Flavor.findOne({ _id: id });
    return flavor;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the flavor:", error);
    res.status(500);
  }
}

// finds topping objects by id given by drink.toppings
async function findToppingsById(id) {
  try {
    const toppings = await Toppings.findOne({ _id: id });
    return toppings;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink by name:", error);
    res.status(500);
  }
}

route.post("/customizeDrink/:name", async (req, res) => {
  // drink user is adding to order
  const drink = new Drink({
    name: req.body.name,
    price: req.body.price,
    flavors: req.body.checkedFlavors,
    toppings: req.body.checkedToppings,
    temp: req.body.temp,
    // caffeination: req.body.caf,
    instructions: req.body.instructions,
    favorite: req.body.favorite,
  });
  // await drink.save();
  req.session.cart = [];
  req.session.cart.push(drink);
  req.session.save((err) => {
    if (err) {
      // handle error
      console.error(err);
      res.status(500).send("Could not save drink to session.");
      return;
    }
    res.status(200).send("Drink added to session.");
  });
});

route.get("/teacherMyOrder", async (req, res) => {
  res.render("teacherMyOrder", { cart: req.session.cart });
});

route.post("/teacherMyOrder", async (req, res) => {
  try {
    const order = new Order({
      email: req.session.email,
      room: req.body.rm,
      timestamp: req.body.timestamp,
      complete: false,
      read: false,
      drinks: req.session.cart,
    });
    User.currentOrder = order;
  } catch (err) {
    console.log(err);
  }
  res.status(200).end();
});

route.get("/teacherPopularDrinks", async (req, res) => {
  res.render("teacherPopularDrinks");
});

route.get("/homePopularDrinks", async (req, res) => {
  res.render("homePopularDrinks");
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
