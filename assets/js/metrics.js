import Chart from "../chart.js/auto";

const userEmails = document.getElementById("userEmails").value.split(",");
const ordersPerUser = document.getElementById("ordersPerUser").value.split(",");

const revenueFromUser = document
  .getElementById("revenueFromUser")
  .value.split(",");

console.log(userEmails);
console.log(ordersPerUser);

let userOrdersElement = document.getElementById("ordersPerUser");
let userOrdersChart = new Chart(userOrdersElement, {
  type: "bar",
  data: {
    labels: userEmails,
    datasets: [
      {
        label: "Orders",
        data: ordersPerUser,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  },
});
