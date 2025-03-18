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

let srcData;
function encodeImageFileAsURL() {
  const imageElement = document.getElementById("currentImg");

  const filesSelected = document.getElementById("image").files;

  if (filesSelected.length > 0) {
    const fileToLoad = filesSelected[0];
    let goodType = false;
    switch (
      fileToLoad.name
        .substring(fileToLoad.name.lastIndexOf(".") + 1)
        .toLowerCase()
    ) {
      case "jpg":
      case "jpeg":
      case "png":
      case "webp":
      case "heic":
      case "heif":
        goodType = true;
        break;
    }
    if (!goodType) {
      alert("Please select a valid image type");
      window.location.reload();
      return;
    }
    const fileReader = new FileReader();

    fileReader.onload = function (fileLoadedEvent) {
      srcData = fileLoadedEvent.target.result; // <--- data: base64
      imageElement.src = srcData;
    };
    fileReader.readAsDataURL(fileToLoad);
  } else {
    imageElement.src = "";
    srcData = "";
  }
}

// listen for change in the dropdown menu
document
  .getElementById("filter")
  .addEventListener("change", handleSelectChange);

// creates a topping with a name chosen by an admin
const saveDrinkButton = document.querySelector("input.submit");

const caf = document.getElementById("caffeination");
const allowDecaf = document.getElementById("allowDecaf");

caf.addEventListener("click", async () => {
  if (caf.checked) {
    allowDecaf.parentElement.hidden = false;
  } else {
    allowDecaf.parentElement.hidden = true;
  }

  allowDecaf.checked = false;
});

saveDrinkButton.addEventListener("click", async () => {
  const id = document.getElementById("filter").value;
  const name = document
    .getElementById("name")
    .value.replace("/", "")
    .replace("\\", "");
  const description = document.getElementById("description").value;

  const price = document.getElementById("price").value.replace(/[^.\d]/g, "");
  if (!price) {
    alert("Please enter a price");
    return;
  }
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
  const special = document.getElementById("special").checked;
  const imageData = srcData;
  const drink = {
    name,
    description,
    price,
    checkedFlavors,
    checkedToppings,
    checkedTemps,
    popular,
    caf: caf.checked,
    allowDecaf: allowDecaf.checked,
    special,
    imageData,
  };

  try {
    saveDrinkButton.disabled = true;

    const response = await fetch(`/modifyDrink/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(drink),
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
