const express = require("express");
const route = express.Router();
const User = require("../model/user");
const MenuItem = require("../model/menuItem");
const Drink = require("../model/drink");
const Order = require("../model/order");
const Schedule = require("../model/schedule");
const Period = require("../model/period");
const Enabled = require("../model/enabled");
const Weekday = require("../model/weekdays");
const DeliveryPerson = require("../model/deliveryPerson");

const { emitToggleChange, emitOrderClaimed } = require("../socket/socket");

const timeBeforeEnd = 5; // 5 minutes before end of period, ordering will be automatically disabled
async function checkTime() {
  const currentTimeDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  const currentTimeMs = Date.parse(currentTimeDate);
  let currentSchedule;
  try {
    const currentWeekDay = await Weekday.findOne({
      day: currentTimeDate.getDay() - 1,
    });
    currentSchedule = await Schedule.findById(currentWeekDay.schedule);
  } catch (error) {
    // console.log(error);
    return;
  }
  if (!currentSchedule) {
    return;
  }
  for (const periodId of currentSchedule.periods) {
    const period = await Period.findById(periodId);
    let periodEndHr = Number(period.end.substring(0, period.end.indexOf(":")));
    const periodEndMin = Number(
      period.end.substring(period.end.indexOf(":") + 1, period.end.length - 3)
    );
    if (period.end.indexOf("PM") > -1 && periodEndHr !== 12) {
      periodEndHr += 12;
    }
    if (period.end.indexOf("AM") > -1 && periodEndHr === 12) {
      periodEndHr = 0;
    }
    const endDate = new Date(
      currentTimeDate.getFullYear(),
      currentTimeDate.getMonth(),
      currentTimeDate.getDate(),
      periodEndHr,
      periodEndMin
    );
    const endDateMs = Date.parse(endDate);
    const difference = endDateMs - currentTimeMs;
    if (difference > 0 && difference <= timeBeforeEnd * 60 * 1000) {
      if (!period.hasDisabledOrdering) {
        const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
        toggle.enabled = false;
        await toggle.save();
        period.hasDisabledOrdering = true;
        await period.save();
        emitToggleChange();
      }
    } else if (period.hasDisabledOrdering) {
      const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
      toggle.enabled = true;
      await toggle.save();
      period.hasDisabledOrdering = false;
      await period.save();
      emitToggleChange();
    }
  }
}

setInterval(checkTime, 15000); // check every 15 sec

route.get("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  res.render("_adminHeader", { enabled: toggle });
});

// updating toggleEnabled
route.post("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  toggle.enabled = req.body.enabled;
  await toggle.save();

  emitToggleChange();
});

route.use(async (req, res, next) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");

  res.locals.headerData = {
    enabled: toggle.enabled,
  };

  next();
});

// Separate redirectUser route is used to easily redirect
//    the user dependent on their role
route.get("/redirectUser", async (req, res) => {
  console.log("Redirecting user.");
  try {
    const user = await User.findOne({ email: req.session.email });
    req.session.cart = [];
    if (user.userType === "admin") {
      res.redirect("/admin/addUser");
    } else if (user.userType === "barista") {
      res.redirect("/barista");
    } else if (user.userType === "teacher") {
      res.redirect("/teacher/popularDrinks");
    } else {
      req.session.email = "";
      res.redirect("/auth"); // User is either not a staff member, not in the database, or has an invalid role.
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

  // Remove drinks from cart and clean up
  for (const drink of req.session.cart) {
    await Drink.findByIdAndRemove(drink);
  }

  req.session.destroy((err) => {
    if (err) {
      return console.error("Logout error:", err);
    }
    // Redirect to auth page after logout
    res.redirect("/auth");
  });
});

route.get("/api/menuItem/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

route.get("/homePopularDrinks", async (req, res) => {
  const menuItems = await MenuItem.find();
  const popularMenu = [];
  for (let i = 0; i < menuItems.length; i++) {
    if (menuItems[i].popular === true) {
      popularMenu.push(menuItems[i]);
    }
  }

  res.render("homePopularDrinks", {
    menuItems: popularMenu,
  });
});

route.get("/homeMenu", async (req, res) => {
  const menu = await MenuItem.find();
  res.render("homeMenu", {
    menuItems: menu,
  });
});

// Delivery People Routes

route.get("/deliveryLogin", async (req, res) => {
  const deliveryPersons = await DeliveryPerson.find();
  res.render("deliveryLogin", { deliveryPersons });
});

route.post("/deliveryLogin", async (req, res) => {
  const attemptedPerson = await DeliveryPerson.findById(req.body.id);
  const attemptedPin = req.body.pin;
  if (attemptedPerson.pin === attemptedPin) {
    req.session.currentDelivererId = req.body.id;
    if (
      attemptedPerson.currentOrder !== null &&
      attemptedPerson.currentOrder !== undefined
    ) {
      res.redirect("/deliveryProgress/" + attemptedPerson.currentOrder);
    } else {
      res.redirect("/deliveryHome");
    }
  } else {
    req.session.currentDelivererId = null;
    res.redirect("/deliveryLogin");
  }
});

route.get("/deliveryHome/", async (req, res) => {
  if (
    req.session.currentDelivererId !== null &&
    req.session.currentDelivererId !== undefined
  ) {
    const orders = await Order.find();

    for (const order of orders) {
      if (order.drinks.length === 0) {
        await Order.findByIdAndRemove(order._id);
      }
    }

    res.render("deliveryHome", { orders });
  } else {
    res.redirect("/deliveryLogin");
  }
});
route.post("/deliveryProgress/:id", async (req, res) => {
  if (
    req.session.currentDelivererId !== null &&
    req.session.currentDelivererId !== undefined
  ) {
    const currentDeliverer = await DeliveryPerson.findById(
      req.session.currentDelivererId
    );

    const currentOrder = await Order.findById(req.params.id);
    currentDeliverer.currentOrder = currentOrder;
    await currentDeliverer.save();
    currentOrder.claimed = true;

    emitOrderClaimed({ email: currentOrder.email });

    const currentTimeDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
    );
    const currentTimeMs = Date.parse(currentTimeDate);
    currentOrder.claimTime = currentTimeMs;
    await currentOrder.save();
    res.redirect(`/deliveryProgress/${req.params.id}`);
  } else {
    res.redirect("/deliveryLogin");
  }
});
route.get("/deliveryProgress/:id", async (req, res) => {
  if (
    req.session.currentDelivererId !== null &&
    req.session.currentDelivererId !== undefined
  ) {
    const currentDeliverer = await DeliveryPerson.findById(
      req.session.currentDelivererId
    );
    const currentOrder = await Order.findById(req.params.id);
    if (
      currentOrder !== null &&
      currentOrder !== undefined &&
      currentOrder.delivered === false
    ) {
      res.render("deliveryProgress", { currentDeliverer, currentOrder });
    } else {
      res.redirect("/deliveryHome");
    }
  } else {
    res.redirect("/deliveryLogin");
  }
});

route.post("/deliveryFinish", async (req, res) => {
  if (
    req.session.currentDelivererId !== null &&
    req.session.currentDelivererId !== undefined
  ) {
    const currentDeliverer = await DeliveryPerson.findById(
      req.session.currentDelivererId
    );
    const currentOrder = await Order.findById(currentDeliverer.currentOrder);
    currentOrder.delivered = true;
    currentOrder.claimed = false;
    currentDeliverer.currentOrder = null;
    const currentTimeDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
    );
    const currentTimeMs = Date.parse(currentTimeDate);
    const duration = currentTimeMs - currentOrder.claimTime;
    currentDeliverer.deliveryTimes.push({
      duration,
      orderId: currentOrder._id,
      email: currentOrder.email,
    });
    await currentOrder.save();
    await currentDeliverer.save();
    res.redirect("/deliveryHome");
  } else {
    res.redirect("/deliveryLogin");
  }
});
route.get("/deliveryLogOut", async (req, res) => {
  req.session.currentDelivererId = null;
  res.redirect("/deliveryLogin");
});

// Add route to handle push subscriptions for mobile web notifications
route.post("/subscribe", (req, res) => {
  const subscription = req.body;
  console.log("Received push subscription:", subscription);
  // TODO: Store the subscription information in your database for later use with web-push
  res.status(201).json({ message: "Subscription received" });
});

// delegate all authentication to the auth.js router
route.use("/auth", require("./auth"));
route.use("/barista", require("./baristaRoutes"));
route.use("/teacher", require("./teacherRoutes"));
route.use("/admin", require("./adminRoutes"));

module.exports = route;
