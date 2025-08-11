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

// listen for change in the dropdown menu
document
  .getElementById("filter")
  .addEventListener("change", handleSelectChange);

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

  const popular = document.getElementById("popular").checked;
  const special = document.getElementById("special").checked;
  const imageData = srcData;
  const drink = {
    name,
    description,
    price,
    checkedIngredients,
    ingredientCounts,
    checkedTemps,
    popular,
    caf: caf.checked,
    allowDecaf: allowDecaf.checked,
    special,
    imageData,
  };

  try {
    saveDrinkButton.disabled = true;

    const response = await fetch(`/admin/modifyDrink/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(drink),
    });

    const data = await response.json();

    if (response.ok) {
      window.location = `/admin/modifyDrink?id=${id}`;
    } else {
      console.error("Server error:", data.error);
    }
  } catch (error) {
    console.error("Error updating drink: ", error);
  }
});
