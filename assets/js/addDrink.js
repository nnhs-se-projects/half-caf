// creates a menu item with the selected name, description, price if its popular, temperatures available
// if its a special, the selected flavors and the selected toppings and if it can be caffinated
const addDrinkButton = document.querySelector("input.submit");
addDrinkButton.addEventListener("click", async () => {
  const name = document
    .getElementById("name")
    .value.replace("/", "")
    .replace("\\", "");
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value;
  const popular = document.getElementById("popular").checked;
  const temps = document.querySelectorAll("input.temps");
  const checkedTemps = [];
  for (let i = 0; i < temps.length; i++) {
    if (temps[i].checked) {
      checkedTemps.push(temps[i].value);
    }
  }

  if (checkedTemps.length === 0) {
    alert("Please select a temperature");
    return;
  }

  const special = document.getElementById("special").checked;
  const flavors = document.querySelectorAll("input#flavors");
  const checkedFlavors = [];
  for (let i = 0; i < flavors.length; i++) {
    if (flavors[i].checked) {
      checkedFlavors.push(flavors[i].value);
    }
  }

  const toppings = document.querySelectorAll("input#toppings");
  const checkedToppings = [];
  for (let i = 0; i < toppings.length; i++) {
    if (toppings[i].checked) {
      checkedToppings.push(toppings[i].value);
    }
  }

  const caf = document.getElementById("caffeinated").checked;

  const menuItem = {
    name,
    description,
    price,
    popular,
    checkedFlavors,
    checkedToppings,
    checkedTemps,
    caf,
    special,
  };

  const formData = new FormData();
  const imageFile = document.getElementById("image").files[0];

  if (!imageFile) {
    console.error("Please select an image file");
    return;
  }

  formData.append("image", imageFile);

  // Handle arrays and other form data separately
  for (const [key, value] of Object.entries(menuItem)) {
    if (Array.isArray(value)) {
      // Append each array element individually
      value.forEach((item) => {
        formData.append(key, item);
      });
    } else {
      formData.append(key, value);
    }
  }

  try {
    const response = await fetch("/addDrink", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      window.location = "/addDrink";
    } else {
      console.error("Server error:", data.error);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
  }
});
