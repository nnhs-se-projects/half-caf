const express = require("express");
const route = express.Router();
const Order = require("../model/order");
const DeliveryPerson = require("../model/deliveryPerson");

const { emitOrderClaimed } = require("../socket/socket");

route.get("/", async (req, res) => {
  const deliveryPersons = await DeliveryPerson.find();
  res.render("deliveryLogin", { deliveryPersons });
});

route.post("/", async (req, res) => {
  const attemptedPerson = await DeliveryPerson.findById(req.body.id);
  const attemptedPin = req.body.pin;
  if (attemptedPerson.pin === attemptedPin) {
    req.session.currentDelivererId = req.body.id;
    if (
      attemptedPerson.currentOrder !== null &&
      attemptedPerson.currentOrder !== undefined
    ) {
      res.redirect("/delivery/progress/" + attemptedPerson.currentOrder);
    } else {
      res.redirect("/delivery/home");
    }
  } else {
    req.session.currentDelivererId = null;
    res.redirect("/delivery");
  }
});

route.get("/home/", async (req, res) => {
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
    res.redirect("/delivery");
  }
});

route.post("/progress/:id", async (req, res) => {
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
    res.redirect(`/delivery/progress/${req.params.id}`);
  } else {
    res.redirect("/delivery");
  }
});

route.get("/progress/:id", async (req, res) => {
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
      res.redirect("/delivery/home");
    }
  } else {
    res.redirect("/delivery");
  }
});

route.post("/finish", async (req, res) => {
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
    res.redirect("/delivery/home");
  } else {
    res.redirect("/delivery");
  }
});

route.get("/logout", async (req, res) => {
  req.session.currentDelivererId = null;
  res.redirect("/delivery");
});

module.exports = route;
