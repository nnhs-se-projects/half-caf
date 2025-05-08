/**
 * Sends the credentials from the Google Sign-In popup to the server for authentication
 *
 * @param {Object} res - the response object from the Google Sign-In popup
 */

// const UserInfo = require("../server/model/User");

// eslint-disable-next-line no-unused-vars
async function handleCredentialResponse(res) {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  const userAgent = navigator.userAgent.toLowerCase();
  const isFirefox = userAgent.includes("firefox");
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

  if (isFirefox && isStandalone) {
    // In Firefox standalone PWAs, popups may fail.
    // Open a new tab to process sign-in.
    const authUrl = "/auth?token=" + encodeURIComponent(res.credential);
    window.open(authUrl, "_blank");
  } else {
    await fetch("/auth", {
      method: "POST",
      body: JSON.stringify({ token: res.credential, rememberMe: isMobile }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    window.location = "/redirectUser";
  }
}

// Improved mobile app notification bell functionality
document.addEventListener("DOMContentLoaded", function () {
  // First, wait for everything to be fully loaded
  window.addEventListener("load", function () {
    const ua = navigator.userAgent;
    let isEmbeddedBrowser = false;
    if (ua.includes("Instagram")) {
      // Tested and works
      console.log("In Instagram in-app browser");
      isEmbeddedBrowser = true;
    } else if (ua.includes("FBAV")) {
      console.log("In Facebook app");
      isEmbeddedBrowser = true;
      isEmbeddedBrowser = true;
    } else if (ua.includes("Snapchat")) {
      // Tested and works
      console.log("In Snapchat in-app browser");
      isEmbeddedBrowser = true;
    }
    if (isEmbeddedBrowser) {
      this.document.getElementById("embeddedWarning").innerText =
        "This site may not work properly in this app. Please open in Safari if you are on iOS or any other browser on Android.";
    }
    // Reduced delay to 300ms (was 1000ms)
    setTimeout(() => {
      const mobileAppNotifier = document.getElementById("mobileAppNotifier");

      // Only proceed if on desktop and element exists
      if (
        mobileAppNotifier &&
        window.matchMedia("(min-width: 769px)").matches
      ) {
        // Make the container visible with display block
        mobileAppNotifier.style.display = "block";

        // Reduced delay to 10ms (was 50ms)
        setTimeout(() => {
          mobileAppNotifier.style.opacity = "1";
        }, 10);

        // Add click event listener
        const notificationBell = document.querySelector(".notification-bell");
        if (notificationBell) {
          notificationBell.addEventListener("click", showMobileAppHologram);
        }
      }
    }, 300); // 300ms delay after page load (was 1000ms)
  });
});

/**
 * Creates and displays a holographic popup with mobile app installation information
 */
function showMobileAppHologram() {
  // Remove existing hologram if present
  const existingHologram = document.getElementById("appHologram");
  if (existingHologram) {
    existingHologram.remove();
    return;
  }

  // Create holographic popup
  const hologram = document.createElement("div");
  hologram.id = "appHologram";
  hologram.className = "hologram-container";

  hologram.innerHTML = `
    <div class="hologram-content">
      <div class="hologram-close">&times;</div>
      
      <div class="hologram-header">
        <div class="coffee-cup">
          <div class="steam-1"></div>
          <div class="steam-2"></div>
          <div class="steam-3"></div>
          <div class="cup-body"></div>
          <div class="cup-handle"></div>
        </div>
        <h2>Half Caf <span class="mobile-tag">Mobile</span></h2>
      </div>
      
      <div class="hologram-body">
        <div class="scanner-line"></div>
        
        <h3>Get The Full Experience On Your Phone</h3>
        <p>Install our web app on your mobile device for easy coffee ordering!</p>
        
        <div class="install-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Visit on Safari</h4>
              <p>Open this site on your iPhone using Safari browser</p>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Tap Share Icon</h4>
              <p>Tap the share button at the bottom of your screen</p>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Add to Home</h4>
              <p>Select "Add to Home Screen" and tap "Add"</p>
            </div>
          </div>
        </div>
        
        <div class="qr-section">
          <div class="qr-hologram">
            <img src="/img/qrcode_nnhshalfcaf.com.png" class="qr-code" alt="QR Code for nnhshalfcaf.com">
            <div class="qr-glare"></div>
          </div>
          <p>Scan to visit on mobile</p>
        </div>
      </div>
      
      <div class="hologram-rays"></div>
    </div>
  `;

  document.body.appendChild(hologram);

  // Make it visible immediately after DOM insertion (was 10ms delay)
  requestAnimationFrame(() => {
    hologram.classList.add("visible");
  });

  // Close button functionality
  hologram.querySelector(".hologram-close").addEventListener("click", () => {
    hologram.classList.remove("visible");
    setTimeout(() => {
      hologram.remove();
    }, 500);
  });

  // Add hologram styles
  const hologramStyles = document.createElement("style");
  hologramStyles.textContent = `
    .hologram-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease; /* Reduced from 0.5s to 0.2s */
    }
    
    .hologram-container.visible {
      opacity: 1;
    }
    
    .hologram-content {
      width: 85%;
      max-width: 550px;
      background: rgba(15, 20, 30, 0.9);
      border: 2px solid rgba(111, 78, 55, 0.8);
      border-radius: 12px;
      padding: 25px;
      color: #fff;
      position: relative;
      box-shadow: 
        0 0 25px rgba(167, 114, 76, 0.5),
        0 0 40px rgba(167, 114, 76, 0.3),
        inset 0 0 20px rgba(167, 114, 76, 0.3);
      animation: float 6s infinite ease-in-out;
      transform: perspective(800px) rotateX(3deg);
      overflow: hidden;
    }
    
    @keyframes float {
      0%, 100% { transform: perspective(800px) rotateX(3deg) translateY(0); }
      50% { transform: perspective(800px) rotateX(3deg) translateY(-10px); }
    }
    
    .hologram-close {
      position: absolute;
      top: 15px;
      right: 15px;
      font-size: 28px;
      cursor: pointer;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(111, 78, 55, 0.4);
      transition: all 0.2s; /* Faster transition (was 0.3s) */
      z-index: 10;
    }
    
    .hologram-close:hover {
      background: rgba(111, 78, 55, 0.7);
      transform: rotate(90deg);
    }
    
    .hologram-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(167, 114, 76, 0.5);
    }
    
    .hologram-header h2 {
      margin: 0;
      font-size: 28px;
      color: white;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
      animation: glow 2s infinite alternate;
    }
    
    @keyframes glow {
      0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
      100% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(167, 114, 76, 0.7); }
    }
    
    .mobile-tag {
      background: #6F4E37;
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 14px;
      vertical-align: middle;
    }
    
    .coffee-cup {
      position: relative;
      width: 40px;
      height: 45px;
    }
    
    .cup-body {
      position: absolute;
      width: 30px;
      height: 35px;
      background: linear-gradient(140deg, #a7724c, #6F4E37);
      border-radius: 5px 5px 15px 15px;
      overflow: hidden;
    }
    
    .cup-body:after {
      content: '';
      position: absolute;
      width: 70%;
      height: 10px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      top: 5px;
      left: 15%;
    }
    
    .cup-handle {
      position: absolute;
      right: 0;
      top: 8px;
      width: 12px;
      height: 20px;
      border: 2.5px solid #6F4E37;
      border-left: none;
      border-radius: 0 15px 15px 0;
    }
    
    .steam-1, .steam-2, .steam-3 {
      position: absolute;
      background: rgba(255, 255, 255, 0.8);
      filter: blur(2px);
      border-radius: 50%;
      width: 3px;
    }
    
    .steam-1 {
      height: 12px;
      top: -10px;
      left: 7px;
      animation: steamFloat 3s infinite ease-out;
    }
    
    .steam-2 {
      height: 10px;
      top: -8px;
      left: 15px;
      animation: steamFloat 3s infinite ease-out 0.4s;
    }
    
    .steam-3 {
      height: 8px;
      top: -7px;
      left: 23px;
      animation: steamFloat 3s infinite ease-out 0.7s;
    }
    
    @keyframes steamFloat {
      0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.8; }
      50% { transform: translateY(-15px) translateX(-2px) scale(1.5); opacity: 0.4; }
      100% { transform: translateY(-30px) translateX(5px) scale(2); opacity: 0; }
    }
    
    .hologram-body {
      position: relative;
      z-index: 2;
    }
    
    .scanner-line {
      position: absolute;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, 
        rgba(255,255,255,0) 0%, 
        rgba(255,255,255,0.8) 50%, 
        rgba(255,255,255,0) 100%);
      top: 0;
      left: 0;
      animation: scan 3s infinite linear;
      z-index: 1;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
    }
    
    @keyframes scan {
      0% { top: 0; }
      100% { top: 100%; }
    }
    
    .hologram-body h3 {
      margin-top: 0;
      color: #a7724c;
      text-align: center;
      font-size: 22px;
      text-shadow: 0 0 10px rgba(167, 114, 76, 0.6);
    }
    
    .hologram-body p {
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      margin-bottom: 25px;
    }
    
    .install-steps {
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin: 25px 0;
    }
    
    .step {
      display: flex;
      align-items: center;
      gap: 15px;
      background: rgba(111, 78, 55, 0.2);
      border-radius: 10px;
      padding: 12px 15px;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;
    }
    
    .step::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, 
        rgba(255,255,255,0) 0%, 
        rgba(255,255,255,0.1) 50%, 
        rgba(255,255,255,0) 100%);
      animation: shimmer 3s infinite;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    .step:hover {
      background: rgba(111, 78, 55, 0.3);
      transform: scale(1.02) translateX(5px);
    }
    
    .step-number {
      width: 35px;
      height: 35px;
      background: #a7724c;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      box-shadow: 0 0 10px rgba(167, 114, 76, 0.5);
    }
    
    .step-content h4 {
      margin: 0 0 5px 0;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .step-content p {
      margin: 0;
      font-size: 14px;
      opacity: 0.7;
      text-align: left;
    }
    
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 30px;
    }
    
    .qr-hologram {
      width: 120px;
      height: 120px;
      position: relative;
      perspective: 500px;
      transform-style: preserve-3d;
    }
    
    .qr-code {
      width: 100%;
      height: 100%;
      background: 
        repeating-linear-gradient(
          45deg,
          rgba(167, 114, 76, 0.3) 0px,
          rgba(167, 114, 76, 0.3) 3px,
          transparent 3px,
          transparent 6px
        );
      animation: qrRotate 8s infinite linear;
      border: 2px solid rgba(167, 114, 76, 0.5);
      box-shadow: 0 0 15px rgba(167, 114, 76, 0.4);
      position: relative;
    }
    
    .qr-code::before {
      content: '📱';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 30px;
      opacity: 0.7;
    }
    
    .qr-glare {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(255,255,255,0.2) 0%, 
        rgba(255,255,255,0) 30%, 
        rgba(255,255,255,0) 70%, 
        rgba(255,255,255,0.2) 100%);
      animation: glareMove 5s infinite alternate;
    }
    
    @keyframes qrRotate {
      0% { transform: rotateY(0deg); }
      100% { transform: rotateY(360deg); }
    }
    
    @keyframes glareMove {
      0% { opacity: 0.1; transform: rotate(0deg); }
      100% { opacity: 0.4; transform: rotate(180deg); }
    }
    
    .qr-section p {
      margin-top: 15px;
      font-size: 14px;
      opacity: 0.7;
      color: #fff;
    }
    
    .hologram-rays {
      position: absolute;
      top: -100%;
      left: -50%;
      width: 200%;
      height: 300%;
      background: 
        repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 20px,
          rgba(167, 114, 76, 0.03) 20px,
          rgba(167, 114, 76, 0.03) 40px
        );
      transform: rotate(25deg);
      pointer-events: none;
      z-index: 1;
      animation: rayRotate 60s infinite linear;
    }
    
    @keyframes rayRotate {
      0% { transform: rotate(25deg); }
      100% { transform: rotate(385deg); }
    }
  `;

  document.head.appendChild(hologramStyles);
}
