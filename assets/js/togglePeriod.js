// handle the period kill-switch toggle (current period only)
const periodCheckbox = document.getElementById("periodCheckbox");
if (periodCheckbox) {
  periodCheckbox.addEventListener("change", async () => {
    const periodId = periodCheckbox.dataset.periodId;
    const orderingDisabled = !periodCheckbox.checked; // if unchecked, we want disabled

    try {
      const response = await fetch("/togglePeriod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId, orderingDisabled }),
      });
      if (!response.ok) {
        throw new Error(`server responded ${response.status}`);
      }
    } catch (err) {
      console.error("Failed to toggle period kill switch", err);
      // revert checkbox state
      periodCheckbox.checked = !periodCheckbox.checked;
      alert("Unable to change period status");
    }
  });
}
