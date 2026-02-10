const loginButton = document.getElementById("login");
let loginToast = document.getElementById("loginToast");

if (!loginToast) {
  loginToast = document.createElement("div");
  loginToast.id = "loginToast";
  loginToast.className = "login-toast";
  loginToast.setAttribute("role", "status");
  loginToast.setAttribute("aria-live", "polite");
  document.body.appendChild(loginToast);
}

let toastTimerId = null;

const showToast = (message) => {
  if (!loginToast) {
    return;
  }

  loginToast.textContent = message;
  loginToast.classList.add("is-visible");

  if (toastTimerId) {
    clearTimeout(toastTimerId);
  }

  toastTimerId = setTimeout(() => {
    loginToast.classList.remove("is-visible");
  }, 3000);
};

loginButton.addEventListener("click", async () => {
  const selectUserId = document.getElementById("deliveryPerson").value;
  const attemptedPin = document.getElementById("password").value;

  if (loginToast) {
    loginToast.classList.remove("is-visible");
  }

  try {
    const response = await fetch("/delivery/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: selectUserId,
        pin: attemptedPin,
      }),
    });

    if (response.redirected) {
      window.location.href = response.url;
      return;
    }

    if (!response.ok) {
      let errorMessage = "Invalid delivery login";
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch (err) {
        // Ignore parse errors and keep default message.
      }

      showToast(errorMessage);
    }
  } catch (err) {
    showToast("Login failed. Please try again.");
  }
});
