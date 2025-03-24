const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Topping = require("../model/topping");
const Flavor = require("../model/flavor");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temps.json");
const Drink = require("../model/drink");
const Order = require("../model/order");

const { emitOrderCancelled, emitNewOrderPlaced } = require("../socket/socket");

// Main/Home page of barista that displays all current orders
route.get("/barista", async (req, res) => {
  const orders = await Order.find();
  const drinkIds = orders.flatMap((order) => order.drinks);
  const drinks = await Drink.find({ _id: { $in: drinkIds } });
  const flavors = await Flavor.find({});
  const toppings = await Topping.find({});

  for (const order of orders) {
    if (order.drinks.length === 0) {
      await Order.findByIdAndRemove(order._id);
    }
  }

  const drinkMap = new Map();
  for (let i = 0; i < orders.length; i++) {
    const drinkArray = [];
    for (let n = 0; n < orders[i].drinks.length; n++) {
      const formattedDrink = {
        name: "",
        flavors: [],
        toppings: [],
        temp: "",
        caffeinated: false,
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
      formattedDrink.caffeinated = drink.caffeinated;
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
    drinkMap.set(i, drinkArray);
  }

  const user = await User.findOne({ email: req.session.email });

  res.render("barista", {
    orders,
    drinkMap,
    role: user.userType,
  });
});

route.delete("/barista/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.cancelled = true;
  await order.save();

  emitOrderCancelled({
    cancelMessage: req.body.message,
    email: order.email,
  });

  res.status(201).end();
});

route.post("/barista/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = true;
  order.timer = req.body.t;
  await order.save();

  for (const drinkId of order.drinks) {
    const drink = await Drink.findById(drinkId);
    drink.completed = true;
    await drink.save();
  }

  res.status(201).end();
});

route.get("/pointofsale", async (req, res) => {
  const menuItems = await MenuItem.find();
  const flavors = await Flavor.find();
  const toppings = await Topping.find();
  const temps = TempJson;
  const orders = await Order.find();
  const possibleModificationsMap = new Map();
  for (const item of menuItems) {
    const modifications = [];
    for (const topping of item.toppings) {
      modifications.push(topping);
    }
    for (const flavor of item.flavors) {
      modifications.push(flavor);
    }
    for (const temp of item.temps) {
      modifications.push(temp);
    }
    possibleModificationsMap[item._id] = modifications;
    if (item.caffeination) {
      possibleModificationsMap[item._id].push("Caffeine");
    }
    if (item.allowDecaf) {
      possibleModificationsMap[item._id].push("Decaf");
    }
  }

  const user = await User.findOne({ email: req.session.email });

  res.render("pointofsale", {
    role: user.userType,
    orders,
    menuItems,
    flavors,
    toppings,
    temps,
    possibleModificationsMap,
  });
});

route.post("/barista/pointofsale", async (req, res) => {
  const drinkIdCart = [];
  for (const drink of req.body.order) {
    const newDrink = new Drink({
      name: drink.name,
      price: drink.price,
      temps: drink.temps,
      flavors: drink.flavors,
      toppings: drink.toppings,
      instructions: drink.instructions,
      completed: false,
      caffeinated: drink.caffeinated,
    });
    await newDrink.save();
    drinkIdCart.push(newDrink._id);
  }

  const order = new Order({
    email: "in-person",
    room: "half-caf",
    timestamp: req.body.timestamp,
    complete: false,
    claimed: true, // set to true so that it doesn't show up in the delivery page
    claimTime: 0,
    delivered: true,
    cancelled: false,
    drinks: drinkIdCart,
    totalPrice: req.body.total,
    timer: "uncompleted",
  });
  await order.save();
  const drinks = await Drink.find({ _id: { $in: drinkIdCart } });
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
        const tempFlavor = flavors.find((f) => f._id.equals(drink.flavors[x]));
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
  res.status(201).end();
});

// completed orders page of barista that displays all completed orders
route.get("/barista/completed", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const orders = await Order.find({ complete: true });
  const drinkIds = orders.flatMap((order) => order.drinks);
  const drinks = await Drink.find({ _id: { $in: drinkIds } });
  const flavors = await Flavor.find({});
  const toppings = await Topping.find({});

  const drinkMap = new Map();
  for (let i = 0; i < orders.length; i++) {
    const drinkArray = [];
    for (let n = 0; n < orders[i].drinks.length; n++) {
      const formattedDrink = {
        name: "",
        flavors: [],
        toppings: [],
        temp: "",
        caffeinated: false,
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
      formattedDrink.caffeinated = drink.caffeinated;
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
    drinkMap.set(i, drinkArray);
  }

  res.render("completed", {
    orders,
    drinkMap,
    role: user.userType,
  });
});

route.post("/barista/completed/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = false;
  await order.save();

  for (const drinkId of order.drinks) {
    const drink = await Drink.findById(drinkId);
    drink.completed = false;
    await drink.save();
  }

  res.status(201).end();
});

route.get("/barista/cancelledOrders", async (req, res) => {
  const user = await User.findOne({ email: req.session.email });
  const orders = await Order.find({ cancelled: true });
  const drinkIds = orders.flatMap((order) => order.drinks);
  const drinks = await Drink.find({ _id: { $in: drinkIds } });
  const flavors = await Flavor.find({});
  const toppings = await Topping.find({});

  const drinkMap = new Map();
  for (let i = 0; i < orders.length; i++) {
    const drinkArray = [];
    for (let n = 0; n < orders[i].drinks.length; n++) {
      const formattedDrink = {
        name: "",
        flavors: [],
        toppings: [],
        temp: "",
        caffeinated: false,
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
      formattedDrink.caffeinated = drink.caffeinated;
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
    drinkMap.set(i, drinkArray);
  }

  res.render("cancelledOrders", {
    orders,
    drinkMap,
    role: user.userType,
  });
});

route.post("/barista/cancelledOrders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.cancelled = false;
  await order.save();
  res.status(201).end();
});
