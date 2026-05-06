async function fetchTimings() {
  const res = await fetch("/admin/api/orderTimings");
  if (!res.ok) throw new Error("Failed to fetch timings");
  return res.json();
}

function formatHMS(sec) {
  if (sec == null) return "-";
  const s = Math.round(sec || 0);
  const h = Math.floor(s / 3600);
  const rem = s % 3600;
  const m = Math.floor(rem / 60);
  const r = rem % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function formatDate(d) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return "-";
  }
}

function renderTable(rows) {
  const tbody = document.querySelector("#timingTable tbody");
  tbody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.email || ""}</td>
      <td>${r.room || ""}</td>
      <td>${formatDate(r.startTime)}</td>
      <td>${formatDate(r.endTime)}</td>
      <td>${formatHMS(r.durationSec)}</td>
      <td>${r.complete ? "Yes" : "No"}</td>
    `;
    tbody.appendChild(tr);
  }
}

function computeSummaries(rows) {
  const durations = rows.map((r) => r.durationSec).filter((v) => v != null);
  if (durations.length === 0) return { avg: null, peak: null };
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / durations.length);
  const peak = Math.max(...durations);
  return { avg, peak };
}

function applyFilter(rows, filter) {
  if (!filter) return rows;
  const f = filter.toLowerCase();
  return rows.filter(
    (r) =>
      (r.email || "").toLowerCase().includes(f) ||
      (r.room || "").toLowerCase().includes(f),
  );
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await fetchTimings();
    let rows = data.data || [];
    const filterInput = document.getElementById("filterInput");
    function refresh() {
      const filtered = applyFilter(rows, filterInput.value);
      renderTable(filtered);
      const s = computeSummaries(filtered);
      document.getElementById("avgTime").textContent =
        s.avg == null ? "-" : formatHMS(s.avg);
      document.getElementById("peakTime").textContent =
        s.peak == null ? "-" : formatHMS(s.peak);
    }
    filterInput.addEventListener("input", refresh);
    refresh();
    // basic column sorting
    document.querySelectorAll("#timingTable th").forEach((th) => {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-key");
        rows.sort((a, b) => {
          const va = a[key] || "";
          const vb = b[key] || "";
          if (typeof va === "number" || typeof vb === "number")
            return (va || 0) - (vb || 0);
          return String(va).localeCompare(String(vb));
        });
        renderTable(rows);
      });
    });
  } catch (err) {
    console.error(err);
    document.querySelector("#mainContent").innerHTML =
      "<p>Error loading analytics data.</p>";
  }
});
