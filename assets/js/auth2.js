/**
 * Sends the credentials from the Google Sign-In popup to the server for authentication
 *
 * @param {Object} res - the response object from the Google Sign-In popup
 */

// eslint-disable-next-line no-unused-vars
async function handleCredentialResponse(res) {
  await fetch("/auth", {
    // send the googleUser's id_token which has all the data we want to the server with a POST request
    method: "POST",
    body: JSON.stringify({
      token: res.credential,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  //let jsonRes = parseJwt(res.credential);
  //alert("Email..." + jsonRes.email);
  //getUserRoles(jsonRes.email);

  // redirect to the admin
  window.location = "/addUser";
}

// function parseJwt(token) {
//   var base64Url = token.split(".")[1];
//   var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//   var jsonPayload = decodeURIComponent(
//     atob(base64)
//       .split("")
//       .map(function (c) {
//         return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
//       })
//       .join("")
//   );
//   //alert("json..." + jsonPayload);
//   return JSON.parse(jsonPayload);
// }

// async function getUserRoles(email) {
//   alert("In getUserRoles..." + UserInfo);
//   email = "tkgadhoke@stu.naperville203.org";
//   try {
//     const user1 = await UserInfo.findOne({ email: email }, "userType");
//     alert("role: " + user1.roles);
//   } catch (error) {
//     console.error(error);
//   }
// }

function parseToken(role) {
  alert("role===" + role);
  if (role === "admin") {
    console.log("admin!!");
  } else if (role === "barista") {
    console.log("barista");
  } else if (role === "teacher") {
    console.log("teacher");
  } else {
    console.log("damn dont work");
  }
}

// function postDataBasedOnUserRole(data, role) {
//   let url;
//   // Determine the URL based on the role
//   switch (role) {
//     case "admin":
//       url = "/addUser";
//       break;
//     case "teacher":
//       url = "/teacherMyOrder";
//       break;
//     case "barista":
//       url = "/barista";
//       break;
//     default:
//       console.error("Unknown role");
//       return;
//   }
// }

// async function getUserRole(userEmail) {
//   try {
//     const user = await User.findOne({ email: userEmail }); // Find the user by email
//     if (user) {
//       return user.userType; // Return the userType if the user is found
//     } else {
//       return null; // Return null or some default value if no user is found
//     }
//   } catch (error) {
//     console.error("Error fetching user role:", error);
//     throw error; // Rethrow or handle the error appropriately
//   }
// }
