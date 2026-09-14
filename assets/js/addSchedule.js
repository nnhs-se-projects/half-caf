document.querySelector(".addPeriod").addEventListener("click", () => {
  const periodDiv = document.createElement("div");
  periodDiv.className = "period-item";
  periodDiv.innerHTML = `
    <input type="text" class="name" placeholder="Period Name" />
    <input type="time" class="startTime" />
    <input type="time" class="endTime" />
    <button class="delete-period" onclick="this.parentElement.remove()">Remove</button>
  `;
  document.getElementById("periods").appendChild(periodDiv);
});

document.querySelector(".submit").addEventListener("click", async () => {
  const name = document.getElementById("scheduleName").value;
  const periods = [];
  document.querySelectorAll("div.period-item").forEach((card) => {
    const period = {
      name: card.querySelector(".name").value,
      start: convertTimeToAmPm(card.querySelector(".startTime").value),
      end: convertTimeToAmPm(card.querySelector(".endTime").value),
    };
    periods.push(period);
  });

  if (periods.length <= 0) {
    alert("Please add periods.");
    return;
  }
  for (const period of periods) {
    if (!period.name || !period.start || !period.end) {
      alert("Please fill in all period information or delete blank periods.");
      return;
    }
  }

  const days = [];
  let i = 0;
  document.querySelectorAll("input.day").forEach((day) => {
    if (day.checked) {
      days.push(i);
    }
    i++;
  });
  const schedule = {
    name,
    periods,
    days,
  };

  try {
    document.querySelector(".submit").disabled = true;

    const response = await fetch("/admin/addSchedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    });

    if (response.ok) {
      window.location = "/admin/scheduler";
    }
  } catch (error) {
    console.error("Error adding schedule: ", error);
  }
});

// convertTimeToAmPm comes from /js/periodTime.js
