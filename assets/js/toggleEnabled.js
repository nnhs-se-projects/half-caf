const Enabled = require("../model/user");

const toggleEnabled = document.querySelector("#myCheckbox");
console.log(toggleEnabled); // boolean value
const id = "65d77b1087449294679afc91";
toggleEnabled.addEventListener("change", async () => {
  const newValue = toggleEnabled.ariaChecked;
  try {
    const doc = await Enabled.FindByID(id);

    doc.enabled = newValue;

    await doc.save;
    console.log(toggleEnabled); // boolean value
  } catch (error) {
    console.error("Error enabling website", error);
  }
});
