const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");
const MenuItem = require("../model/menuItem");
const Toppings = require("../model/topping");
const Drink = require("../model/drink");
const Order = require("../model/order");
const { emitNewOrderPlaced } = require("../socket/socket");

// Route Teacher Menu
route.get("/teacher/menu", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const menu = await MenuItem.find();
  res.render("teacherMenu", {
    menuItems: menu,
    email: req.session.email,
    role: user.userType,
  });
});

// gets drink object by its name
async function findDrinkByName(drinkName) {
  try {
    const drink = await MenuItem.findOne({ name: drinkName });
    return drink;
  } catch (error) {
    // handle error appropriately
    console.error("Error finding the drink by name:", error);
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
  }
}

route.get("/teacher/customizeDrink/:name", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const selectedDrink = req.params.name; // params holds parameters from the URL path
  const drinkName = decodeURIComponent(selectedDrink.replace("%20/", " ")); // convert URL-friendly string to regular name format
  try {
    const drink = await findDrinkByName(drinkName); // finds drink by name

    // available flavors array
    const flavors = [];
    for (let i = 0; i < drink.flavors.length; i++) {
      flavors[i] = await findFlavorById(drink.flavors[i]);
    }

    // available toppings array
    const toppings = [];
    for (let i = 0; i < drink.toppings.length; i++) {
      toppings[i] = await findToppingsById(drink.toppings[i]);
    }

    if (drink) {
      res.render("customizeDrink", {
        drink,
        flavors,
        temps: drink.temps,
        toppings,
        email: req.session.email,
        role: user.userType,
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

route.post("/teacher/customizeDrink/:name", async (req, res) => {
  // drink user is adding to order
  let quantity = req.body.quantity;
  quantity = quantity < 1 ? 1 : quantity > 9 ? 9 : quantity;
  for (let i = 0; i < quantity; i++) {
    const drink = new Drink({
      name: req.body.name,
      price: req.body.price,
      flavors: req.body.checkedFlavors,
      toppings: req.body.checkedToppings,
      temps: req.body.temp,
      caffeinated: req.body.caf,
      instructions: req.body.instructions,
      favorite: req.body.favorite,
      completed: false,
    });

    await drink.save();
    req.session.cart.push(drink);

    if (req.body.favorite === true && i === 0) {
      const user = await User.findOne({ email: req.session.email });
      const index = user.favoriteDrinks.indexOf(drink.id);
      if (index === -1) {
        drink.favorite = true;
        await drink.save();
        user.favoriteDrinks.push(drink);
        await user.save();
      }
    }
  }

  res.status(200).send("Drink added to session.");
});

route.get("/teacher/myCart", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const customizationDict = {};
  for (const drink of req.session.cart) {
    const drinkFlavorsArray = [];
    const drinkToppingsArray = [];
    for (const flavor of drink.flavors) {
      drinkFlavorsArray.push(await findFlavorById(flavor));
    }
    for (const topping of drink.toppings) {
      drinkToppingsArray.push(await findToppingsById(topping));
    }
    customizationDict[drink._id] = {
      flavors: drinkFlavorsArray,
      toppings: drinkToppingsArray,
    };
  }
  res.render("teacherMyCart", {
    cart: req.session.cart,
    customizationDict,
    email: req.session.email,
    role: user.userType,
  });
});

route.post("/teacher/updateCart", async (req, res) => {
  console.log("Post Updating cart");
  await Drink.findByIdAndRemove(req.session.cart[req.body.index]);
  req.session.cart.splice(req.body.index, 1);

  res.status(200).end();
});

route.post("/teacher/myCart", async (req, res) => {
  let total = 0;
  for (const drink of req.session.cart) {
    total += drink.price;
  }
  try {
    const order = new Order({
      email: req.session.email,
      room: req.body.rm,
      timestamp: req.body.timestamp,
      complete: false,
      claimed: false,
      claimTime: 0,
      delivered: false,
      cancelled: false,
      drinks: req.session.cart,
      totalPrice: total,
      timer: "uncompleted",
    });
    await order.save();
    const user = await User.findOne({ email: req.session.email });
    user.currentOrder = order;
    user.orderHistory.push(order);
    await user.save();

    const drinks = await Drink.find({ _id: { $in: req.session.cart } });
    const flavors = await Flavor.find({});
    const toppings = await Topping.find({});

    const drinkArray = [];
    for (let n = 0; n < order.drinks.length; n++) {
      const formattedDrink = {
        name: "",
        flavors: [],
        toppings: [],
        temp: "",
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(order.drinks[n]));
      if (drink.flavors.length === 0) {
        formattedDrink.flavors.push("None");
      } else {
        for (let x = 0; x < drink.flavors.length; x++) {
          const tempFlavor = flavors.find((f) =>
            f._id.equals(drink.flavors[x])
          );
          if (tempFlavor !== null && tempFlavor !== undefined) {
            formattedDrink.flavors.push(" " + tempFlavor.flavor);
          }
        }
      }
      if (drink.toppings.length === 0) {
        formattedDrink.toppings.push("None");
      } else {
        for (let x = 0; x < drink.toppings.length; x++) {
          const tempTopping = toppings.find((t) =>
            t._id.equals(drink.toppings[x])
          );
          if (tempTopping !== null && tempTopping !== undefined) {
            formattedDrink.toppings.push(" " + tempTopping.topping);
          }
        }
      }
      formattedDrink.name = drink.name;
      formattedDrink.temp = drink.temps;
      formattedDrink.instructions = drink.instructions;
      drinkArray.push(formattedDrink);
    }

    emitNewOrderPlaced({
      order,
      drinks: drinkArray,
    });
  } catch (err) {
    console.log(err);
  }
  res.status(200).end();
});

route.get("/teacher/popularDrinks", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const menuItems = await MenuItem.find();
  const popularMenu = [];
  for (let i = 0; i < menuItems.length; i++) {
    if (menuItems[i].popular === true) {
      popularMenu.push(menuItems[i]);
    }
  }
  res.render("teacherPopularDrinks", {
    menuItems: popularMenu,
    email: req.session.email,
    role: user.userType,
  });
});

route.get("/teacher/myFavorites", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });

  const favoriteDrinkIds = user.favoriteDrinks.filter((drink) => drink != null);
  const favoriteDrinks = await Drink.find({ _id: { $in: favoriteDrinkIds } });
  const flavorIds = favoriteDrinks.flatMap((drink) => drink.flavors);
  const toppingIds = favoriteDrinks.flatMap((drink) => drink.toppings);
  const flavors = await Flavor.find({ _id: { $in: flavorIds } });
  const toppings = await Topping.find({ _id: { $in: toppingIds } });

  const favoriteDrinksFlavors = favoriteDrinks.map((drink) =>
    drink.flavors.map((flavorId) =>
      flavors.find((flavor) => flavor._id.equals(flavorId))
    )
  );

  const favoriteDrinksToppings = favoriteDrinks.map((drink) =>
    drink.toppings.map((toppingId) =>
      toppings.find((topping) => topping._id.equals(toppingId))
    )
  );

  res.render("teacherMyFavorites", {
    favoriteDrinks,
    favoriteDrinksFlavors,
    favoriteDrinksToppings,
    email: req.session.email,
    role: user.userType,
  });
});

route.get("/teacher/addDrinkToCart/:id", async (req, res) => {
  // drink user is adding to order
  const drink = await Drink.findById(req.params.id);
  req.session.cart.push(drink);

  res.redirect("/teacher/myCart");
});

route.get("/teacher/unfavoriteDrink/:id", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const index = user.favoriteDrinks.indexOf(req.params.id);
  if (index > -1) {
    const drink = await Drink.findById(req.params.id);
    drink.favorite = false;
    await drink.save();
    user.favoriteDrinks.splice(index, 1);
  }
  await user.save();

  res.redirect("/teacher/myFavorites");
});

route.get("/teacher/favoriteDrinkFromHistory/:id", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const index = user.favoriteDrinks.indexOf(req.params.id);
  if (index === -1) {
    const drink = await Drink.findById(req.params.id);
    drink.favorite = true;
    await drink.save();
    user.favoriteDrinks.push(drink);
    await user.save();
  }

  res.redirect("/teacher/orderHistory");
});

route.get("/teacher/orderHistory", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const orderIds = user.orderHistory.filter((order) => order != null);
  const orders = await Order.find({ _id: { $in: orderIds } }).populate({
    path: "drinks",
    populate: [
      { path: "flavors", model: "Flavor" },
      { path: "toppings", model: "Topping" },
    ],
  });

  const orderHistory = orders.filter((order) => order != null);

  user.orderHistory = orderHistory.map((order) => order._id); // Update user's orderHistory with non-null orders
  await user.save();

  res.render("teacherOrderHistory", {
    history: orderHistory.reverse(),
    email: req.session.email,
    role: user.userType,
  });
});

route.get("/teacher/orderConfirmation", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  req.session.cart = [];
  res.render("orderConfirmation", {
    email: req.session.email,
    role: user.userType,
  });
});
