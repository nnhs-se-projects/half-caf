/**
 * Email service for sending notifications
 */

const nodemailer = require("nodemailer");

// Configure Gmail transporter
// Requires EMAIL_USER and EMAIL_PASS (app password) environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Product owner email for out-of-stock notifications
const PRODUCT_OWNER_EMAIL = "mskarr@naperville203.org";

/**
 * Send email notification when ingredients go out of stock
 * @param {Array} outOfStockIngredients - Array of ingredient objects with name, newQuantity
 */
async function sendOutOfStockEmail(outOfStockIngredients) {
  if (!outOfStockIngredients || outOfStockIngredients.length === 0) {
    return;
  }

  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn(
      "Email credentials not configured. Skipping out-of-stock notification.",
    );
    console.warn("Out of stock ingredients:", outOfStockIngredients);
    return;
  }

  const ingredientList = outOfStockIngredients
    .map((ing) => `• ${ing.name} (current quantity: ${ing.newQuantity})`)
    .join("\n");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: PRODUCT_OWNER_EMAIL,
    subject: "Half Caf - Ingredient Out of Stock Alert",
    text: `The following ingredient(s) have gone out of stock after a recent order:\n\n${ingredientList}\n\nPlease restock these items as soon as possible.\n\n- Half Caf Inventory System`,
    html: `
      <h2>Ingredient Out of Stock Alert</h2>
      <p>The following ingredient(s) have gone out of stock after a recent order:</p>
      <ul>
        ${outOfStockIngredients.map((ing) => `<li><strong>${ing.name}</strong> (current quantity: ${ing.newQuantity})</li>`).join("")}
      </ul>
      <p>Please restock these items as soon as possible.</p>
      <br>
      <p><em>- Half Caf Inventory System</em></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Out-of-stock notification email sent successfully");
  } catch (error) {
    console.error("Error sending out-of-stock email:", error);
  }
}

module.exports = { sendOutOfStockEmail };
