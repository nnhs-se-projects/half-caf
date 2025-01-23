function handleSelectChange() {
  const selectedValue = document.getElementById("filter").value;
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("id", selectedValue);

  // Create the updated URL with the new query parameter
  const updatedURL = `${window.location.origin}${
    window.location.pathname
  }?${urlParams.toString()}`;

  // redirect window
  window.location = updatedURL;
  console.log(updatedURL);
}

// listen for change in the dropdown menu
document
  .getElementById("filter")
  .addEventListener("change", handleSelectChange);

// creates a topping with a name chosen by an admin
const saveDrinkButton = document.querySelector("input.submit");

saveDrinkButton.addEventListener("click", async () => {
  const id = document.getElementById("filter").value;
  const name = document
    .getElementById("name")
    .value.replace("/", "")
    .replace("\\", "");
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value.replace(/[^.\d]/g, "");

  const temps = document.querySelectorAll("input#temp");
  const checkedTemps = [];
  temps.forEach((temp) => {
    if (temp.checked) {
      checkedTemps.push(temp.value);
    }
  });

  if (checkedTemps.length === 0) {
    alert("Please select a temperature");
    return;
  }

  const flavors = document.querySelectorAll("input#flavor");
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
  const popular = document.getElementById("popular").checked;
  const caffeination = document.getElementById("caffeination").checked;
  const special = document.getElementById("special").checked;

  const drink = {
    name,
    description,
    price,
    checkedFlavors,
    checkedToppings,
    checkedTemps,
    popular,
    caf: caffeination,
    special,
  };

  const formData = new FormData();
  const imageFile = document.getElementById("image").files[0];

  if (!imageFile && !document.getElementById("currentImg")) {
    alert("Please select an image file");
    return;
  }

  formData.append("image", imageFile);
  // Handle arrays and other form data separately
  for (const [key, value] of Object.entries(drink)) {
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
    const response = await fetch(`/modifyDrink/${id}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      window.location = `/modifyDrink?id=${id}`;
    } else {
      console.error("Server error:", data.error);
    }
  } catch (error) {
    console.error("Error updating drink: ", error);
  }
});
