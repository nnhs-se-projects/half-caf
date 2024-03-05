const Enabled = require("./path/to/EnabledModel");

const toggleEnabled = document.querySelector("input.toggle");
// console.log(toggleEnabled.checked); // boolean value

let mongoObject = {
  _id: "65d77b1087449294679afc91",
  enabled: false,
  __v: 0,
};
// const id = "65d77b1087449294679afc91";
toggleEnabled.addEventListener("change", async () => {
  const newValue = toggleEnabled.checked;
  try {
    let doc = await Enabled.findById(mongoObject._id);
    // const doc = await Enabled.FindByID("enabled");

    // doc.enabled = newValue;

    // await doc.save;
    // console.log(toggleEnabled.checked); // boolean value

    doc.enabled = newValue;
    await doc.save();
    console.log(doc.enabled);
  } catch (error) {
    console.error("Error enabling website", error);
  }
});
