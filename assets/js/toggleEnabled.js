const toggleEnabled = document.querySelector("input.toggle");
console.log(toggleEnabled); // boolean value
// const id = "65d77b1087449294679afc91";
toggleEnabled.addEventListener("change", async () => {
  const newValue = toggleEnabled.checked;
  try {
    // const doc = await Enabled.FindByID("enabled");

    // doc.enabled = newValue;

    // await doc.save;
    console.log(toggleEnabled); // boolean value
  } catch (error) {
    console.error("Error enabling website", error);
  }
});
