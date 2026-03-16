const express = require("express");
const route = express.Router();
const User = require("../model/user");
const Ingredient = require("../model/ingredient");
const MenuItem = require("../model/menuItem");
const TempJson = require("../model/temps.json");
const Drink = require("../model/drink");
const Order = require("../model/order");
const CashCount = require("../model/cashCount");
const webPush = require("web-push");

webPush.setVapidDetails(
  "mailto:admin@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const {
  emitOrderCompleted,
  emitOrderCancelled,
  emitNewOrderPlaced,
} = require("../socket/socket");

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

function formatMenuImageData(drink) {
  if (drink && drink.imageData && drink.imageData.buffer) {
    const buffer = drink.imageData.buffer;
    const potentialDataUrl = buffer.toString("utf8");

    if (potentialDataUrl.startsWith("data:image")) {
      drink.imageData = potentialDataUrl;
    } else {
      drink.imageData = `data:image/png;base64,${buffer.toString("base64")}`;
    }
  }

  return drink;
}

route.get("/orders", async (req, res) => {
  const orders = await Order.find();
  const drinkIds = orders.flatMap((order) => order.drinks);
  const drinks = await Drink.find({ _id: { $in: drinkIds } });
  const ingredients = await Ingredient.find();

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
        ingredients: [],
        temp: "",
        caffeinated: false,
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
      if (!drink) {
        break;
      }
      formattedDrink.caffeinated = drink.caffeinated;
      if (drink.ingredients.length === 0) {
        formattedDrink.ingredients.push("None");
      } else {
        for (let x = 0; x < drink.ingredients.length; x++) {
          const tempIngredient = ingredients.find((f) =>
            f._id.equals(drink.ingredients[x]),
          );
          if (tempIngredient !== null && tempIngredient !== undefined) {
            const ingredientCount = drink.ingredientCounts[x];
            if (ingredientCount !== 0) {
              const ingredientCountStr = ingredientCount + " ";
              formattedDrink.ingredients.push(
                " " + ingredientCountStr + tempIngredient.name,
              );
            }
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

  const role = await getUserRoles(req.session.email);

  res.render("barista", {
    orders,
    drinkMap,
    role,
  });
});

route.delete("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("drinks");
    const email = order.email;

    const orderItems = [];
    for (const drink of order.drinks) {
      let ingredientsStr = "";
      let i = 0;
      for (const ingredientId of drink.ingredients) {
        const ingredient = await Ingredient.findById(ingredientId);

        if (ingredient.type === "customizable") {
          ingredientsStr +=
            drink.ingredientCounts[i] === 0
              ? "No "
              : drink.ingredientCounts[i] + " ";
          ingredientsStr += ingredient.name + ", ";
        }

        i++;
      }
      ingredientsStr = ingredientsStr.substring(0, ingredientsStr.length - 2);
      const item = {
        name: drink.name,
        temp: drink.temps,
        ingredients: ingredientsStr.length > 0 ? ingredientsStr : "None",
        instructions: drink.instructions,
      };
      orderItems.push(item);
    }

    order.cancelled = true;
    await order.save();

    emitOrderCancelled({
      cancelMessage: req.body.message,
      email,
      orderId: order._id,
      orderItems,
    });

    const user = await User.findOne({ email: order.email });
    if (user && user.subscription && user.subscription.length) {
      const payload = JSON.stringify({
        title: "Order cancelled",
        options: {
          body: 'Barista Note: "' + req.body.message + '"',
          icon: "../img/Half_Caf_Logo_(1).png",
        },
      });
      for (const sub of user.subscription) {
        try {
          await webPush.sendNotification(sub, payload);
        } catch (error) {
          console.error(
            "Push notification failed for user:",
            user.email,
            error,
          );
        }
      }
    }

    res.status(201).end();
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).end();
  }
});

route.post("/orders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = true;
  order.timer = req.body.t;
  await order.save();

  emitOrderCompleted({ orderId: order.id });

  for (const drinkId of order.drinks) {
    const drink = await Drink.findById(drinkId);
    drink.completed = true;
    await drink.save();

    for (let i = 0; i < drink.ingredients.length; i++) {
      const ingredient = await Ingredient.findById(drink.ingredients[i]);
      // Subtract the used amount and round up fractional quantities
      const newQty = ingredient.quantity - drink.ingredientCounts[i];
      // Round up to the nearest integer and prevent negative quantities
      ingredient.quantity = Math.max(0, Math.ceil(newQty));
      await ingredient.save();
    }
  }

  const user = await User.findOne({ email: order.email });
  if (user && user.subscription && user.subscription.length) {
    const payload = JSON.stringify({
      title: "Order in delivery",
      options: {
        body: "Your order is finished and is on its way!",
        icon: "../img/Half_Caf_Logo_(1).png",
      },
    });
    for (const sub of user.subscription) {
      try {
        await webPush.sendNotification(sub, payload);
      } catch (error) {
        console.error("Push notification failed for user:", user.email, error);
      }
    }
  }

  res.status(201).end();
});

route.get("/pointOfSale", async (req, res) => {
  let menuItems = await MenuItem.find().lean();
  menuItems = menuItems.map(formatMenuImageData);
  const ingredients = await Ingredient.find();
  const temps = TempJson;
  const orders = await Order.find();
  const possibleModificationsMap = {};
  const allowedCategoriesMap = {};
  for (const item of menuItems) {
    const modifications = [];
    let i = 0;
    for (const ingredient of item.ingredients) {
      modifications.push(ingredient);
      modifications.push(item.ingredientCounts[i]);
      i++;
    }
    for (const temp of item.temps) {
      modifications.push(temp);
    }
    possibleModificationsMap[item._id] = modifications;
    // Store allowed ingredient categories for this drink
    allowedCategoriesMap[item._id] =
      item.allowedIngredientCategories &&
      item.allowedIngredientCategories.length > 0
        ? item.allowedIngredientCategories
        : ["milk", "syrups", "powders", "sauces", "toppings"];
    if (item.caffeination) {
      possibleModificationsMap[item._id].push("Caffeine");
    }
    if (item.allowDecaf) {
      possibleModificationsMap[item._id].push("Decaf");
    }
  }

  const role = await getUserRoles(req.session.email);

  res.render("pointOfSale", {
    role,
    orders,
    menuItems,
    ingredients,
    temps,
    possibleModificationsMap,
    allowedCategoriesMap,
  });
});

route.post("/pointOfSale", async (req, res) => {
  const drinkIdCart = [];
  const orderItems = Array.isArray(req.body.order) ? req.body.order : [];
  if (orderItems.length === 0) {
    return res.status(400).json({ message: "No order items provided." });
  }

  for (const drink of orderItems) {
    const menuItemId = drink.menuItemId;
    let ingredients = Array.isArray(drink.ingredients) ? drink.ingredients : [];
    let ingredientCounts = Array.isArray(drink.ingredientCounts)
      ? drink.ingredientCounts
      : [];
    let temps = drink.temps;

    if (
      (!ingredients.length ||
        ingredients.length !== ingredientCounts.length ||
        !temps) &&
      menuItemId
    ) {
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: "Invalid menu item in order." });
      }

      if (
        !ingredients.length ||
        ingredients.length !== ingredientCounts.length
      ) {
        ingredients = menuItem.ingredients.map((id) => id.toString());
        ingredientCounts =
          menuItem.ingredientCounts &&
          menuItem.ingredientCounts.length === menuItem.ingredients.length
            ? menuItem.ingredientCounts
            : menuItem.ingredients.map(() => 1);
      }

      if (!temps || (Array.isArray(temps) && temps.length === 0)) {
        temps = menuItem.temps[0] || "";
      }
    }

    if (Array.isArray(temps)) {
      temps = temps[0] || "";
    }

    if (!temps) {
      return res
        .status(400)
        .json({ message: "Missing temperature for a drink." });
    }

    if (!ingredients.length) {
      return res
        .status(400)
        .json({ message: "Missing ingredients for a drink." });
    }

    if (ingredients.length !== ingredientCounts.length) {
      return res
        .status(400)
        .json({ message: "Ingredient counts do not match ingredients." });
    }

    const ingredientDocs = await Ingredient.find({
      _id: { $in: ingredients },
    });
    if (ingredientDocs.length !== ingredients.length) {
      return res.status(400).json({ message: "Unknown ingredient in order." });
    }

    const normalizedCounts = ingredientCounts.map(
      (count) => Number(count) || 0,
    );
    const newDrink = new Drink({
      name: drink.name,
      price: Number(drink.price),
      temps,
      ingredients,
      ingredientCounts: normalizedCounts,
      instructions: drink.instructions,
      completed: false,
      caffeinated: drink.caffeinated,
    });
    await newDrink.save();
    drinkIdCart.push(newDrink._id);
  }

  const role = await getUserRoles(req.session.email);

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
    name: req.session.name,
    isAdmin: role === "admin",
  });
  await order.save();
  const drinks = await Drink.find({ _id: { $in: drinkIdCart } });
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
          f._id.equals(drink.ingredients[x]),
        );
        if (tempIngredient !== null && tempIngredient !== undefined) {
          const ingredientCount = drink.ingredientCounts[x];
          if (ingredientCount !== 0) {
            const ingredientCountStr = ingredientCount + " ";
            formattedDrink.ingredients.push(
              " " + ingredientCountStr + tempIngredient.name,
            );
          }
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

route.post("/pointOfSale/cash-count", async (req, res) => {
  const totalCounted = Number(req.body.totalCounted);
  const expectedTotal = Number(req.body.expectedTotal);

  if (!Number.isFinite(totalCounted) || !Number.isFinite(expectedTotal)) {
    return res
      .status(400)
      .json({ message: "Cash count totals must be valid numbers." });
  }

  const difference = Math.round((totalCounted - expectedTotal) * 100) / 100;
  const cashCount = new CashCount({
    totalCounted,
    expectedTotal,
    difference,
    email: req.session.email,
    name: req.session.name,
  });
  await cashCount.save();

  return res.status(201).json({ difference });
});

// completed orders page of barista that displays all completed orders
route.get("/completedOrders", async (req, res) => {
  const orders = await Order.find({ complete: true });
  const drinkIds = orders.flatMap((order) => order.drinks);
  const drinks = await Drink.find({ _id: { $in: drinkIds } });
  const ingredients = await Ingredient.find({});

  orders.reverse();

  const drinkMap = new Map();
  for (let i = 0; i < orders.length; i++) {
    const drinkArray = [];
    for (let n = 0; n < orders[i].drinks.length; n++) {
      const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
      if (!drink) {
        continue;
      }

      const formattedDrink = {
        name: "",
        ingredients: [],
        temp: "",
        caffeinated: false,
        instructions: "",
      };

      formattedDrink.caffeinated = drink.caffeinated;
      if (drink.ingredients.length === 0) {
        formattedDrink.ingredients.push("None");
      } else {
        for (let x = 0; x < drink.ingredients.length; x++) {
          const tempIngredient = ingredients.find((f) =>
            f._id.equals(drink.ingredients[x]),
          );
          if (tempIngredient !== null && tempIngredient !== undefined) {
            const ingredientCount = drink.ingredientCounts[x];
            if (ingredientCount !== 0) {
              const ingredientCountStr = ingredientCount + " ";
              formattedDrink.ingredients.push(
                " " + ingredientCountStr + tempIngredient.name,
              );
            }
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

  const role = await getUserRoles(req.session.email);

  res.render("completedOrders", {
    orders,
    drinkMap,
    role,
  });
});

route.post("/completedOrders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.complete = false;
  await order.save();

  for (const drinkId of order.drinks) {
    const drink = await Drink.findById(drinkId);
    drink.completed = false;
    await drink.save();

    for (let i = 0; i < drink.ingredients.length; i++) {
      const ingredient = await Ingredient.findById(drink.ingredients[i]);
      ingredient.quantity += drink.ingredientCounts[i];
      await ingredient.save();
    }
  }

  res.status(201).end();
});

route.get("/cancelledOrders", async (req, res) => {
  const orders = await Order.find({ cancelled: true });
  const drinkIds = orders.flatMap((order) => order.drinks);
  const drinks = await Drink.find({ _id: { $in: drinkIds } });
  const ingredients = await Ingredient.find({});

  orders.reverse();

  const drinkMap = new Map();
  for (let i = 0; i < orders.length; i++) {
    const drinkArray = [];
    for (let n = 0; n < orders[i].drinks.length; n++) {
      const formattedDrink = {
        name: "",
        ingredients: [],
        temp: "",
        caffeinated: false,
        instructions: "",
      };
      const drink = drinks.find((d) => d._id.equals(orders[i].drinks[n]));
      if (!drink) {
        break;
      }
      formattedDrink.caffeinated = drink.caffeinated;
      if (drink.ingredients.length === 0) {
        formattedDrink.ingredients.push("None");
      } else {
        for (let x = 0; x < drink.ingredients.length; x++) {
          const tempIngredient = ingredients.find((f) =>
            f._id.equals(drink.ingredients[x]),
          );
          if (tempIngredient !== null && tempIngredient !== undefined) {
            const ingredientCount = drink.ingredientCounts[x];
            if (ingredientCount !== 0) {
              const ingredientCountStr = ingredientCount + " ";
              formattedDrink.ingredients.push(
                " " + ingredientCountStr + tempIngredient.name,
              );
            }
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

  const role = await getUserRoles(req.session.email);

  res.render("cancelledOrders", {
    orders,
    drinkMap,
    role,
  });
});

route.post("/cancelledOrders/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  order.cancelled = false;
  await order.save();
  res.status(201).end();
});

module.exports = route;
