document.getElementById("users").addEventListener("change", () => {
  const selectedValue = document.getElementById("users").value;
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set("id", selectedValue);

  // Create the updated URL with the new query parameter
  const updatedURL = `${window.location.origin}${
    window.location.pathname
  }?${urlParams.toString()}`;

  // redirect window
  window.location = updatedURL;
});

const updateUserButton = document.querySelector("input.submit");

updateUserButton.addEventListener("click", async () => {
  const id = document.getElementById("users").value;
  const email = document.getElementById("email").value;
  const role = document.getElementById("roles").value;

  const user = {
    email,
    role,
  };

  try {
    updateUserButton.disabled = true;

    const response = await fetch(`/admin/modifyUser/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });

    if (response.ok) {
      window.location = `/admin/modifyUser?id=${id}`;
    }
  } catch (error) {
    console.error("Error updating drink: ", error);
  }
});
