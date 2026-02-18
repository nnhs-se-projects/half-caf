/**
 * Period Countdown Timer
 * Displays a countdown in the top right corner showing time remaining in the current period
 */

class PeriodCountdown {
  constructor() {
    this.currentPeriod = null;
    this.countdownElement = null;
    this.updateInterval = null;
    this.init();
  }

  async init() {
    try {
      // Fetch current period data from server
      const response = await fetch("/api/current-period");
      if (response.ok) {
        const data = await response.json();
        this.currentPeriod = data.period;
        this.createCountdownUI();
        this.startCountdown();
      }
    } catch (error) {
      console.error("Error fetching current period:", error);
    }
  }

  createCountdownUI() {
    // Create container
    const container = document.createElement("div");
    container.id = "periodCountdownContainer";
    container.style.cssText = `
      position: fixed;
      top: calc(env(safe-area-inset-top, 0) + 10px);
      right: 20px;
      background: linear-gradient(135deg, #8B6F47 0%, #A0826D 100%);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(60, 42, 33, 0.3);
      z-index: 1001;
      min-width: 180px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    `;

    // Create period name label
    const label = document.createElement("div");
    label.style.cssText = `
      font-size: 12px;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    label.textContent = this.currentPeriod?.name || "Current Period";

    // Create timer display
    const timer = document.createElement("div");
    timer.id = "periodCountdownTimer";
    timer.style.cssText = `
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 1px;
    `;
    timer.textContent = "00:00";

    container.appendChild(label);
    container.appendChild(timer);

    // Add to body
    document.body.appendChild(container);
    this.countdownElement = timer;
  }

  startCountdown() {
    if (!this.currentPeriod) return;

    // Update immediately
    this.updateCountdown();

    // Update every second
    this.updateInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    if (!this.currentPeriod) return;

    const currentTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }),
    );
    const endTime = this.parseTime(this.currentPeriod.end, currentTime);

    const timeRemaining = endTime - currentTime;

    if (timeRemaining <= 0) {
      // Period has ended
      this.countdownElement.textContent = "00:00";
      this.countdownElement.parentElement.style.opacity = "0.6";
      return;
    }

    // Calculate minutes and seconds
    const totalSeconds = Math.floor(timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Format as MM:SS
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    this.countdownElement.textContent = formattedTime;

    // Change color if less than 10 minutes remaining
    const container = this.countdownElement.parentElement;
    if (minutes < 10) {
      container.style.background =
        "linear-gradient(135deg, #D64545 0%, #E56B6B 100%)";
    } else {
      container.style.background =
        "linear-gradient(135deg, #8B6F47 0%, #A0826D 100%)";
    }
  }

  parseTime(timeString, referenceDate) {
    // Parse time string like "2:30 PM" or "9:00 AM"
    const timeParts = timeString.match(/(\d+):(\d+)\s(AM|PM)/);
    if (!timeParts) return null;

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3];

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    const parsedTime = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      hours,
      minutes,
    );

    return parsedTime;
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize countdown when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.periodCountdown = new PeriodCountdown();
  });
} else {
  window.periodCountdown = new PeriodCountdown();
}
