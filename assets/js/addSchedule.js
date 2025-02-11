const addPeriodButton = document.querySelector("input.addPeriod");
addPeriodButton.addEventListener("click", async () => {
  const periodDiv = document.createElement("div");
  periodDiv.className = "card";
  const periodName = document.createElement("input");
  periodName.type = "text";
  periodName.placeholder = "Period Name";
  periodDiv.appendChild(periodName);

  const periodStart = document.createElement("input");
  periodStart.type = "time";
  periodStart.placeholder = "Start Time";
  periodDiv.appendChild(periodStart);

  const periodEnd = document.createElement("input");
  periodEnd.type = "time";
  periodEnd.placeholder = "End Time";
  periodDiv.appendChild(periodEnd);

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    periodDiv.remove();
  });
  periodDiv.appendChild(deleteButton);

  document.getElementById("periods").appendChild(periodDiv);
});

const addScheduleButton = document.querySelector("input.submit");
addScheduleButton.addEventListener("click", async () => {
  const name = document.getElementById("scheduleName").value;
  const periods = [];
  document.querySelectorAll("div.card").forEach((card) => {
    const period = {
      name: card.children[0].value,
      start: card.children[1].value,
      end: card.children[2].value,
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
    if (period.start >= period.end) {
      alert(period.name + "'s start time must be before end time.");
      return;
    }
  }
  const schedule = {
    name,
    periods,
  };

  try {
    addScheduleButton.disabled = true;

    const response = await fetch("/addSchedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(schedule),
    });

    if (response.ok) {
      window.location = "/scheduler";
    }
  } catch (error) {
    console.error("Error adding schedule: ", error);
  }
});
