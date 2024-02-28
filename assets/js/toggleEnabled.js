const Enabled = require("../model/user");

const toggleEnabled = document.querySelector("#myCheckbox");
console.log(toggleEnabled); // boolean value
// const id = "65d77b1087449294679afc91";
toggleEnabled.addEventListener("change", async () => {
  const newValue = toggleEnabled.checked;

  const response = await fetch("/addUser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (response.ok) {
    console.log(toggleEnabled);
  } else {
    console.log("error creating user");
  }
});

/**
 * try {
    const doc = await Enabled.FindByID("enabled");

    doc.enabled = newValue;

    await doc.save;
    console.log(toggleEnabled); // boolean value
  } catch (error) {
    console.error("Error enabling website", error);
  }
 */
