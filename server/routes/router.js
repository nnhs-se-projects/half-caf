const express = require("express");
const route = express.Router();
const path = require("path");
const User = require("../model/user");
const MenuItem = require("../model/menuItem");
const Schedule = require("../model/schedule");
const Period = require("../model/period");
const Enabled = require("../model/enabled");
const Weekday = require("../model/weekdays");

const { emitToggleChange } = require("../socket/socket");

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

const timeBeforeEnd = 10; // 10 minutes before end of period, ordering will be automatically disabled
async function checkTime() {
  // time calculations must always use Chicago zone to match front-end schedule
  const currentTimeDate = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
  );
  const currentTimeMs = Date.parse(currentTimeDate);

  // reset global toggle once per day if it was disabled by an admin/barista
  try {
    const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
    if (toggle && !toggle.enabled) {
      const last = toggle.lastResetDate ? new Date(toggle.lastResetDate) : null;
      if (!last || last.toDateString() !== currentTimeDate.toDateString()) {
        // a new day has begun, clear the kill switch
        toggle.enabled = true;
        toggle.reason = null;
        toggle.lastResetDate = currentTimeDate;
        await toggle.save();
        emitToggleChange();
      }
    }
  } catch (err) {
    console.error("Error resetting global toggle:", err);
  }

  let currentSchedule;
  try {
    const currentWeekDay = await Weekday.findOne({
      day: currentTimeDate.getDay() - 1,
    });
    if (currentWeekDay) {
      currentSchedule = await Schedule.findById(currentWeekDay.schedule);
    }
  } catch (error) {
    // console.log(error);
    return;
  }
  if (!currentSchedule) {
    return;
  }
  // track whether any active period currently has orderingDisabled set
  let activeDisabledPeriod = false;
  for (const periodId of currentSchedule.periods) {
    const period = await Period.findById(periodId);

    let periodEndHr = Number(period.end.substring(0, period.end.indexOf(":")));
    const periodEndMin = Number(
      period.end.substring(period.end.indexOf(":") + 1, period.end.length - 3),
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
      periodEndMin,
    );

    let periodStartHr = Number(
      period.start.substring(0, period.start.indexOf(":")),
    );
    const periodStartMin = Number(
      period.start.substring(
        period.start.indexOf(":") + 1,
        period.start.length - 3,
      ),
    );
    if (period.start.indexOf("PM") > -1 && periodStartHr !== 12) {
      periodStartHr += 12;
    }
    if (period.start.indexOf("AM") > -1 && periodStartHr === 12) {
      periodStartHr = 0;
    }
    const startDate = new Date(
      currentTimeDate.getFullYear(),
      currentTimeDate.getMonth(),
      currentTimeDate.getDate(),
      periodStartHr,
      periodStartMin,
    );
    const startDateMs = Date.parse(startDate);
    const endDateMs = Date.parse(endDate);
    const timeToEnd = endDateMs - currentTimeMs;
    // If during period
    if (currentTimeMs > startDateMs && currentTimeMs < endDateMs) {
      const toggle = await Enabled.findById("660f6230ff092e4bb15122da");

      // track whether any active period has orderingDisabled
      if (period.orderingDisabled) {
        activeDisabledPeriod = true;
      }

      // Check if period was manually disabled in the scheduler
      if (period.orderingDisabled) {
        if (toggle.enabled) {
          toggle.enabled = false;
          await toggle.save();
          emitToggleChange();
          // don't break; still evaluate subsequent periods (shouldn't be others active)
        }
      }

      // If at the end of the period
      if (timeToEnd > 0 && timeToEnd <= timeBeforeEnd * 60 * 1000) {
        if (!period.hasDisabledOrdering) {
          toggle.enabled = false;
          toggle.reason = "Scheduler";
          await toggle.save();
          period.hasDisabledOrdering = true;
          await period.save();
          emitToggleChange();
        }
      } else if (period.hasDisabledOrdering) {
        toggle.enabled = true;
        await toggle.save();
        period.hasDisabledOrdering = false;
        await period.save();
        emitToggleChange();
      }
    }
    // After period has passed, clear any manual disable so it won't persist
    if (currentTimeMs >= endDateMs && period.orderingDisabled) {
      period.orderingDisabled = false;
      await period.save();
    }
  }

  // if we finished iterating and there are no active disabled periods but
  // the global toggle is off for "Period" reason, turn it back on
  try {
    const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
    if (
      toggle &&
      !toggle.enabled &&
      toggle.reason === "Period" &&
      !activeDisabledPeriod
    ) {
      toggle.enabled = true;
      toggle.reason = null;
      await toggle.save();
      emitToggleChange();
    }
  } catch (err) {
    console.error("Error resetting period-related global toggle:", err);
  }
}

setInterval(checkTime, 15000); // check every 15 sec

// helper function to detect mobile user agents
function isMobile(userAgent) {
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent);
}

route.get("/", (req, res) => {
  if (isMobile(req.headers["user-agent"])) {
    const currentFilePath = __filename;
    const parentDirectory = path.dirname(path.dirname(currentFilePath));
    const addToHomePath = parentDirectory.substring(
      0,
      parentDirectory.lastIndexOf("/"),
    );
    res.sendFile(path.join(addToHomePath, "public/add-to-home.html"));
  } else {
    res.redirect("/auth");
  }
});

route.get("/toggle", async (req, res) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  res.render("_adminHeader", { enabled: toggle });
});

// updating toggleEnabled
route.post("/toggle", async (req, res) => {
  // only admins may flip global on/off
  const role = await getUserRoles(req.session.email);
  if (role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
  toggle.enabled = req.body.enabled;
  toggle.reason = "Admin";
  // if enabling, update lastResetDate to today so the daily reset doesn't immediately flip it back
  if (toggle.enabled) {
    toggle.lastResetDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
  }
  await toggle.save();
  emitToggleChange();
});

// period toggle route used by headers and admin UI
route.post("/togglePeriod", async (req, res) => {
  const { periodId, orderingDisabled } = req.body;
  if (!periodId) {
    return res.status(400).json({ message: "Missing periodId" });
  }

  // only barista or admin may flip this toggle; scheduler update will still be restricted separately
  const role = await getUserRoles(req.session.email);
  if (role !== "barista" && role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const period = await Period.findById(periodId);
    if (!period) {
      return res.status(404).json({ message: "Period not found" });
    }
    period.orderingDisabled = orderingDisabled;
    await period.save();

    // if we're toggling the current period, adjust the global toggle instantly
    const toggle = await Enabled.findById("660f6230ff092e4bb15122da");
    if (toggle) {
      if (orderingDisabled && toggle.enabled) {
        toggle.enabled = false;
        toggle.reason = "Period";
        await toggle.save();
        emitToggleChange();
      } else if (
        !orderingDisabled &&
        !toggle.enabled &&
        toggle.reason === "Period"
      ) {
        toggle.enabled = true;
        toggle.reason = null;
        await toggle.save();
        emitToggleChange();
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal error" });
  }
});

route.use(async (req, res, next) => {
  const toggle = await Enabled.findById("660f6230ff092e4bb15122da");

  // compute current period so header can display a second switch
  let currentPeriodId = null;
  let currentPeriodDisabled = false;
  try {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const currentWeekDay = await Weekday.findOne({ day: now.getDay() - 1 });
    if (currentWeekDay) {
      const sched = await Schedule.findById(currentWeekDay.schedule);
      if (sched) {
        for (const pid of sched.periods) {
          const period = await Period.findById(pid);
          if (!period) continue;
          // build same start/end logic as checkTime
          let periodEndHr = Number(
            period.end.substring(0, period.end.indexOf(":")),
          );
          const periodEndMin = Number(
            period.end.substring(
              period.end.indexOf(":") + 1,
              period.end.length - 3,
            ),
          );
          if (period.end.indexOf("PM") > -1 && periodEndHr !== 12) {
            periodEndHr += 12;
          }
          if (period.end.indexOf("AM") > -1 && periodEndHr === 12) {
            periodEndHr = 0;
          }
          const endDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            periodEndHr,
            periodEndMin,
          );

          let periodStartHr = Number(
            period.start.substring(0, period.start.indexOf(":")),
          );
          const periodStartMin = Number(
            period.start.substring(
              period.start.indexOf(":") + 1,
              period.start.length - 3,
            ),
          );
          if (period.start.indexOf("PM") > -1 && periodStartHr !== 12) {
            periodStartHr += 12;
          }
          if (period.start.indexOf("AM") > -1 && periodStartHr === 12) {
            periodStartHr = 0;
          }
          const startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            periodStartHr,
            periodStartMin,
          );

          const startDateMs = Date.parse(startDate);
          const endDateMs = Date.parse(endDate);
          if (now.getTime() > startDateMs && now.getTime() < endDateMs) {
            currentPeriodId = pid;
            currentPeriodDisabled = period.orderingDisabled;
            break;
          }
        }
      }
    }
  } catch (e) {
    // ignore errors silently
  }

  // also expose current user's role so headers can hide controls
  res.locals.role = await getUserRoles(req.session.email);

  res.locals.headerData = {
    enabled: toggle.enabled,
    reason: toggle.reason,
    period: currentPeriodId
      ? {
          id: currentPeriodId,
          disabled: currentPeriodDisabled,
        }
      : null,
  };

  next();
});

route.get("/redirectUser", async (req, res) => {
  try {
    const role = await getUserRoles(req.session.email);
    if (role === "admin") {
      res.redirect("/admin/users");
    } else if (role === "barista") {
      res.redirect("/barista/orders");
    } else if (role === "teacher") {
      res.redirect("/teacher/popularDrinks");
    } else {
      // role is invalid or user is not logged in
      res.redirect("/auth");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

route.get("/homePopularDrinks", async (req, res) => {
  console.log("Route /homePopularDrinks hit");
  try {
    let menuItems = await MenuItem.find().lean();
    menuItems = menuItems.map(formatMenuImageData);
    const popularMenu = [];
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i].popular === true) {
        popularMenu.push(menuItems[i]);
      }
    }

    res.render("homePopularDrinks", {
      menuItems: popularMenu,
    });
  } catch (error) {
    console.error("Error in /homePopularDrinks:", error);
    res.status(500).send("Server error");
  }
});

route.get("/homeMenu", async (req, res) => {
  let menu = await MenuItem.find().lean();
  menu = menu.map(formatMenuImageData);
  res.render("homeMenu", {
    menuItems: menu,
  });
});

// Add route to handle push subscriptions for mobile web notifications
route.post("/subscribe", async (req, res) => {
  const subscription = req.body;
  console.log("Received push subscription:", subscription);
  const user = await User.findOne({ email: req.session.email });
  // now push sub into array.
  if (
    !user.subscription.find(
      (sub) => JSON.stringify(sub) === JSON.stringify(subscription),
    )
  ) {
    user.subscription.push(subscription);
  }
  await user.save();
  // TODO: Store the subscription information in your database for later use with web-push
  res.status(201).json({ message: "Subscription received" });
});

// API endpoint to get current period information
route.get("/api/current-period", async (req, res) => {
  try {
    const currentTimeDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const currentTimeMs = Date.parse(currentTimeDate);

    const currentWeekDay = await Weekday.findOne({
      day: currentTimeDate.getDay() - 1,
    });

    if (!currentWeekDay) {
      return res.json({ period: null });
    }

    const currentSchedule = await Schedule.findById(
      currentWeekDay.schedule,
    ).populate("periods");

    if (!currentSchedule) {
      return res.json({ period: null });
    }

    // Find the current period
    for (const period of currentSchedule.periods) {
      let periodEndHr = Number(
        period.end.substring(0, period.end.indexOf(":")),
      );
      const periodEndMin = Number(
        period.end.substring(
          period.end.indexOf(":") + 1,
          period.end.length - 3,
        ),
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
        periodEndMin,
      );

      let periodStartHr = Number(
        period.start.substring(0, period.start.indexOf(":")),
      );
      const periodStartMin = Number(
        period.start.substring(
          period.start.indexOf(":") + 1,
          period.start.length - 3,
        ),
      );
      if (period.start.indexOf("PM") > -1 && periodStartHr !== 12) {
        periodStartHr += 12;
      }
      if (period.start.indexOf("AM") > -1 && periodStartHr === 12) {
        periodStartHr = 0;
      }
      const startDate = new Date(
        currentTimeDate.getFullYear(),
        currentTimeDate.getMonth(),
        currentTimeDate.getDate(),
        periodStartHr,
        periodStartMin,
      );

      const startDateMs = Date.parse(startDate);
      const endDateMs = Date.parse(endDate);

      // If during period
      if (currentTimeMs > startDateMs && currentTimeMs < endDateMs) {
        return res.json({
          period: {
            name: period.name,
            start: period.start,
            end: period.end,
          },
        });
      }
    }

    // No active period found
    res.json({ period: null });
  } catch (error) {
    console.error("Error fetching current period:", error);
    res.status(500).json({ error: "Failed to fetch current period" });
  }
});

route.use("/auth", require("./auth"));
route.use("/admin", require("./admin"));
route.use("/barista", require("./barista"));
route.use("/teacher", require("./teacher"));
route.use("/delivery", require("./delivery"));

module.exports = route;
