// creates a menu item with the selected name, description, price if its popular, temperatures available
// if its a special, the selected ingredients and if it can be caffeinated
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

document.addEventListener("DOMContentLoaded", function () {
  const ingredients = document.querySelectorAll("input#ingredients");
  for (const ingredient of ingredients) {
    ingredient.addEventListener("click", () => {
      const numElem = ingredient.parentElement.lastElementChild;
      numElem.hidden = !numElem.hidden;
      if (numElem.hidden) {
        numElem.value = 0;
      } else {
        numElem.value = 1;
      }
    });
  }
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
  const ingredients = document.querySelectorAll("input#ingredients");
  const checkedIngredients = [];
  const ingredientCounts = [];
  for (let i = 0; i < ingredients.length; i++) {
    if (ingredients[i].checked) {
      checkedIngredients.push(ingredients[i].value);

      let count = Number(ingredients[i].parentElement.lastElementChild.value);

      if (count < 1 || count > 100) {
        count = 1;
      }

      ingredientCounts.push(count);
    }
  }

  const imageData = srcData;

  const menuItem = {
    name,
    description,
    price,
    popular,
    checkedIngredients,
    ingredientCounts,
    checkedTemps,
    caf: caf.checked,
    allowDecaf: allowDecaf.checked,
    special,
    imageData,
  };

  addDrinkButton.disabled = true;

  const response = await fetch("/admin/addDrink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(menuItem),
  });
  if (response.ok) {
    window.location = "/admin/addDrink";
  } else {
    console.log("error adding drink");
  }
});
