const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createCheckoutSession,
  getSubscriptionStatus,
  upgradeUser,
  handleWebhook,
} = require("../controllers/stripeController");

// Webhook needs raw body
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

router.post("/create-checkout-session", protect, createCheckoutSession);
router.get("/status", protect, getSubscriptionStatus);
router.post("/upgrade-test", protect, upgradeUser);

module.exports = router;