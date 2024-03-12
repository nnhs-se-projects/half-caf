const toggleEnabled = document.querySelector("input.toggle");
console.log(toggleEnabled.checked);
toggleEnabled.addEventListener("change", async () => {
  const getEnabled = document.getElementById("enabled").value;
  console.log(getEnabled);
});
/** 
const toggleEnabled = document.querySelector("input.toggle");
console.log(toggleEnabled.checked); // boolean value
// const id = "65d77b1087449294679afc91";
toggleEnabled.addEventListener("change", async () => {
  const newValue = toggleEnabled.checked;
  try {
    // const doc = await Enabled.FindByID("enabled");

    // doc.enabled = newValue;

    // await doc.save;
    console.log(newValue); // boolean value

    // console.log(doc.enabled);
  } catch (error) {
    console.error("Error enabling website", error);
  }
});
*/
