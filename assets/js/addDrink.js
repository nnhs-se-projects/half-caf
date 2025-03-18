// creates a menu item with the selected name, description, price if its popular, temperatures available
// if its a special, the selected flavors and the selected toppings and if it can be caffinated
const addDrinkButton = document.querySelector("input.submit");

let srcData;

function encodeImageFileAsURL() {
  const imageElement = document.getElementById("drinkImg");

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

const caf = document.getElementById("caffeinated");
const allowDecaf = document.getElementById("allowDecaf");

caf.addEventListener("click", async () => {
  if (caf.checked) {
    allowDecaf.parentElement.hidden = false;
  } else {
    allowDecaf.parentElement.hidden = true;
  }

  allowDecaf.checked = false;
});

addDrinkButton.addEventListener("click", async () => {
  const name = document
    .getElementById("name")
    .value.replace("/", "")
    .replace("\\", "");
  const description = document.getElementById("description").value;
  const price = document.getElementById("price").value.replace(/[^.\d]/g, "");
  const popular = document.getElementById("popular").checked;
  const temps = document.querySelectorAll("input.temps");
  const checkedTemps = [];
  for (let i = 0; i < temps.length; i++) {
    if (temps[i].checked) {
      checkedTemps.push(temps[i].value);
    }
  }
  if (!price) {
    alert("Please enter a price");
    return;
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

  const imageData = srcData;

  const menuItem = {
    name,
    description,
    price,
    popular,
    checkedFlavors,
    checkedToppings,
    checkedTemps,
    caf: caf.checked,
    allowDecaf: allowDecaf.checked,
    special,
    imageData,
  };

  addDrinkButton.disabled = true;

  const response = await fetch("/addDrink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(menuItem),
  });
  if (response.ok) {
    window.location = "/addDrink";
  } else {
    console.log("error adding drink");
  }
});
