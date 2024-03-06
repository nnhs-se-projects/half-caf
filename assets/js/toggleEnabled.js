const Enabled = require(".../enabled.js");

const orderEnabledCheckbox = document.getElementById("input.toggle");

orderEnabledCheckbox.addEventListener("change", function () {
  const enabledValue = this.checked;
  Enabled.findOneAndUpdate(
    {},
    { enabled: enabledValue },
    { new: true, upsert: true },
    function (err, doc) {
      if (err) {
        console.log("Error updating document: ", err);
      } else {
        console.log("Document updated: ", doc);
      }
    }
  );

  console.log("Enabled value:", enabledValue); // For demonstration purposes
});
/**
const toggleEnabled = document.querySelector("input.toggle");
// console.log(toggleEnabled.checked); // boolean value
// const id = "65d77b1087449294679afc91";
toggleEnabled.addEventListener("change", async () => {
  const newValue = toggleEnabled.checked;
  try {
    // const doc = await Enabled.FindByID("enabled");

    // doc.enabled = newValue;

    // await doc.save;
    // console.log(toggleEnabled.checked); // boolean value

    // console.log(doc.enabled);
  } catch (error) {
    console.error("Error enabling website", error);
  }
}); 
*/
