const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Ingredient = require("../model/ingredient");
const MenuItem = require("../model/menuItem");
const Drink = require("../model/drink");
const Order = require("../model/order");

const { emitNewOrderPlaced, emitRoomUpdated } = require("../socket/socket");

async function getUserRoles(email) {
  try {
    const user = await User.findOne({ email }, "userType");
    if (user === null) {
      return null;
    }

    return user.userType;
  } catch (error) {
    console.error(error);
  }
}

async function findDrinkByName(drinkName) {
  try {
    const drink = await MenuItem.findOne({ name: drinkName });
    return drink;
  } catch (error) {
    console.error("Error finding the drink by name:", error);
  }
}

async function findIngredientById(id) {
  try {
    const ingredient = await Ingredient.findOne({ _id: id });
    return ingredient;
  } catch (error) {
    console.error("Error finding the ingredient:", error);
  }
}

route.get("/menu", async (req, res) => {
  const menu = await MenuItem.find();
  const role = await getUserRoles(req.session.email);
  res.render("teacherMenu", {
    menuItems: menu,
    email: req.session.email,
    role,
  });
});

route.get("/customizeDrink/:name", async (req, res) => {
  const selectedDrink = req.params.name; // params holds parameters from the URL path
  const drinkName = decodeURIComponent(selectedDrink.replace("%20/", " ")); // convert URL-friendly string to regular name format
  try {
    const drink = await findDrinkByName(drinkName); // finds drink by name

    // available ingredients array
    const ingredients = [];
    for (let i = 0; i < drink.ingredients.length; i++) {
      ingredients[i] = await findIngredientById(drink.ingredients[i]);
    }

    if (drink) {
      const role = await getUserRoles(req.session.email);

      res.render("customizeDrink", {
        drink,
        ingredients,
        temps: drink.temps,
        email: req.session.email,
        role,
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

route.post("/customizeDrink/:name", async (req, res) => {
  // drink user is adding to order
  let quantity = req.body.quantity;
  quantity = quantity < 1 ? 1 : quantity > 9 ? 9 : quantity;
  for (let i = 0; i < quantity; i++) {
    const drink = new Drink({
      name: req.body.name,
      price: req.body.price,
      ingredients: req.body.checkedIngredients,
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

route.get("/myCart", async (req, res) => {
  const customizationDict = {};
  for (const drink of req.session.cart) {
    const drinkIngredientsArray = [];
    for (const ingredient of drink.ingredients) {
      drinkIngredientsArray.push(await findIngredientById(ingredient));
    }
    customizationDict[drink._id] = {
      ingredients: drinkIngredientsArray,
    };
  }

  const role = await getUserRoles(req.session.email);

  res.render("teacherMyCart", {
    cart: req.session.cart,
    customizationDict,
    email: req.session.email,
    role,
  });
});

route.get("/outgoingOrders", async (req, res) => {
  const orders = await Order.find({
    complete: false,
    cancelled: false,
    email: req.session.email,
  })
    .populate("drinks")
    .sort({ timestamp: -1 });

  const role = await getUserRoles(req.session.email);
  const orderObjectArray = [];
  for (const order of orders) {
    const tempObject = {
      drinks: [],
    };
    for (const drink of order.drinks) {
      const drinkObject = {
        name: drink.name,
        ingredients: [],
        temps: [],
        instructions: "",
      };
      drinkObject.name = drink.name;
      drinkObject.temps = drink.temps;
      for (const ingredient of drink.ingredients) {
        const ingredientObject = await Ingredient.find({ _id: ingredient });
        drinkObject.ingredients.push(ingredientObject[0].ingredient);
      }
      if (drink.instructions) {
        drinkObject.instructions = drink.instructions;
      }
      tempObject.drinks.push(drinkObject);
    }
    orderObjectArray.push(tempObject);
  }
  res.render("teacherOutgoingOrders", {
    orders,
    orderObjectArray,
    email: req.session.email,
    role,
  });
});

route.post("/updateCart", async (req, res) => {
  await Drink.findByIdAndRemove(req.session.cart[req.body.index]);
  req.session.cart.splice(req.body.index, 1);

  res.status(200).end();
});

route.post("/myCart", async (req, res) => {
  const role = await getUserRoles(req.session.email);
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
      name: req.session.name,
      isAdmin: role === "admin",
    });
    await order.save();
    const user = await User.findOne({ email: req.session.email });
    user.currentOrder = order;
    user.orderHistory.push(order);
    await user.save();

    const drinks = await Drink.find({ _id: { $in: req.session.cart } });
    const ingredients = await Ingredient.find({});

    const drinkArray = [];
    for (let n = 0; n < order.drinks.length; n++) {
      const formattedDrink = {
        name: "",
        ingredients: [],
        temp: "",
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(order.drinks[n]));
      if (drink.ingredients.length === 0) {
        formattedDrink.ingredients.push("None");
      } else {
        for (let x = 0; x < drink.ingredients.length; x++) {
          const tempIngredient = ingredients.find((f) =>
            f._id.equals(drink.ingredients[x])
          );
          if (tempIngredient !== null && tempIngredient !== undefined) {
            formattedDrink.ingredients.push(" " + tempIngredient.name);
          }
        }
      }
      formattedDrink.name = drink.name;
      formattedDrink.temp = drink.temps;
      formattedDrink.instructions = drink.instructions;
      drinkArray.push(formattedDrink);
    }

    req.session.cart = [];

    emitNewOrderPlaced({
      order,
      drinks: drinkArray,
    });
  } catch (err) {
    console.log(err);
  }
  res.status(200).end();
});

route.get("/reorder/:id", async (req, res) => {
  const drink = await Drink.findById(req.params.id);

  const drinkCopy = new Drink({
    name: drink.name,
    price: drink.price,
    ingredients: drink.ingredients,
    temps: drink.temps,
    caffeinated: drink.caffeinated,
    instructions: drink.instructions,
    favorite: false,
    completed: false,
  });

  await drinkCopy.save();

  req.session.cart.push(drinkCopy);

  res.redirect("/teacher/myCart");
});

route.get("/popularDrinks", async (req, res) => {
  const menuItems = await MenuItem.find();
  const popularMenu = [];
  for (let i = 0; i < menuItems.length; i++) {
    if (menuItems[i].popular === true) {
      popularMenu.push(menuItems[i]);
    }
  }

  const role = await getUserRoles(req.session.email);

  res.render("teacherPopularDrinks", {
    menuItems: popularMenu,
    email: req.session.email,
    role,
  });
});

route.get("/myFavorites", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });

  const favoriteDrinkIds = user.favoriteDrinks.filter((drink) => drink != null);
  const favoriteDrinks = await Drink.find({ _id: { $in: favoriteDrinkIds } });
  const ingredientIds = favoriteDrinks.flatMap((drink) => drink.ingredients);
  const ingredients = await Ingredient.find({ _id: { $in: ingredientIds } });

  const favoriteDrinksIngredients = favoriteDrinks.map((drink) =>
    drink.ingredients.map((ingredientId) =>
      ingredients.find((ingredient) => ingredient._id.equals(ingredientId))
    )
  );

  const role = await getUserRoles(req.session.email);

  res.render("teacherMyFavorites", {
    favoriteDrinks,
    favoriteDrinksIngredients,
    email: req.session.email,
    role,
  });
});

route.get("/unfavoriteDrink/:id", async (req, res) => {
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

route.get("/favoriteDrinkFromHistory/:id", async (req, res) => {
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

route.get("/orderHistory", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const orderIds = user.orderHistory.filter((order) => order != null);
  const orders = await Order.find({ _id: { $in: orderIds } }).populate({
    path: "drinks",
    populate: [{ path: "ingredients", model: "Ingredient" }],
  });

  const orderHistory = orders.filter((order) => order != null);

  user.orderHistory = orderHistory.map((order) => order._id); // Update user's orderHistory with non-null orders
  await user.save();

  const role = await getUserRoles(req.session.email);

  res.render("teacherOrderHistory", {
    history: orderHistory.reverse(),
    email: req.session.email,
    role,
  });
});

const dogCoffeeJokes = [
  "Why did the dog open a coffee shop? He wanted to make some pup-resso for himself!",
  'What did the dog say when he walked into a fancy coffee shop? "I hope this place isn\'t collie-flower only!"',
  "How does a Dalmatian take his coffee? Spotted with cream!",
  "My dog started a coffee business from home. He's really mastered the art of the pour-rover.",
  "What's a dog's favorite coffee drink? Anything with lots of lappuccino foam!",
  "Why was the dog fired from the coffee shop? He kept chasing the espresso shots!",
  'A Labrador walked into a café and ordered a double espresso. The barista asked, "Are you sure? It might keep you up all night!" The Lab replied, "That\'s the point—I\'m a watchdog!"',
  "What do you call a caffeinated dog? A ground hound!",
  "My dog learned to make coffee and now he's a barkista with a real nose for quality beans. The only problem is he keeps stealing all the Danish.",
  "Why couldn't the dog finish his coffee? It was too Ruff-roasted!",
  "What's a dog's least favorite coffee? Anything de-barked!",
  "The coffee shop's dog mascot always helps customers find seats. He's their official Lab-locate-or.",
  "My Chihuahua drinks coffee to feel bigger. Now he thinks he's a Great Dane and keeps ordering venti everything.",
  "Why did the dog put his coffee on the floor? He likes his drinks ground level!",
  "What do you call a dog that's had too much coffee? A hypercollie!",
  "I asked my dog if we should go to the coffee shop. He said, \"I don't know, I'm on the fence.\" Turns out he's more of a border collie than a decision maker.",
  "My dog opened an elite coffee shop where they only serve pedigree beans. It's strictly no mutt-cha allowed.",
  "What happened when the dog drank coffee before bed? He was up all night hounding his owner for more!",
  "The sheepdog refuses to drink anything but coffee with extra foam. He says it reminds him of the flock.",
  'I took my dog to a coffee cupping event. He had strong opinions—kept saying everything tasted a little "ruff" around the edges!',
];

route.get("/orderConfirmation", async (req, res) => {
  const dogApiResponse = await fetch(
    "https://dog.ceo/api/breed/husky/images/random"
  );
  const dogApiData = await dogApiResponse.json();
  const dogImageUrl = dogApiData.message;

  const role = await getUserRoles(req.session.email);

  res.render("orderConfirmation", {
    email: req.session.email,
    role,
    image: dogImageUrl,
    joke: dogCoffeeJokes[Math.floor(Math.random() * dogCoffeeJokes.length)],
  });
});

route.post("/updateRoom", async (req, res) => {
  const { orderId, newRoom } = req.body;
  try {
    const order = await Order.findById(orderId);
    if (order && order.email === req.session.email) {
      order.room = newRoom;
      await order.save();
      emitRoomUpdated({ orderId, newRoom });
      res.status(200).json({ success: true });
    } else {
      res.status(403).json({ error: "Unauthorized or order not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = route;
