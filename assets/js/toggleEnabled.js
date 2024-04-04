const toggleEnabled = document.querySelector("input.toggle");
console.log(toggleEnabled.checked);
toggleEnabled.addEventListener("change", async () => {
  const getEnabled = document.getElementById("myCheckbox").checked;
  console.log(getEnabled);

  const url = window.location.pathname;
  console.log(url);
  const isEnabled = { enabled: getEnabled };

  const response = await fetch("/toggle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(isEnabled),
  });

  window.location = "/toggle";

  if (response.ok) {
    console.log("success");
  } else {
    console.log("error");
  }
});
/** 
const toggleEnabled = document.querySelector("input.toggle"); `
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
