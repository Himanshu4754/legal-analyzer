const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

// Create checkout session
const createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Create or get stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Legal Analyzer Premium",
              description: "Unlimited documents, PDF reports, contract comparison, and more",
            },
            unit_amount: 49900, // ₹499
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?payment=cancelled`,
      metadata: { userId: user._id.toString() },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get user subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "isPremium premiumSince documentsCount"
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manually upgrade user (for testing)
const upgradeUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPremium: true, premiumSince: new Date() },
      { new: true }
    );
    res.json({ message: "Upgraded to premium", isPremium: user.isPremium });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stripe webhook
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;

    await User.findByIdAndUpdate(userId, {
      isPremium: true,
      premiumSince: new Date(),
    });

    console.log(`User ${userId} upgraded to premium`);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    await User.findOneAndUpdate(
      { stripeCustomerId: customer.id },
      { isPremium: false }
    );
  }

  res.json({ received: true });
};

module.exports = {
  createCheckoutSession,
  getSubscriptionStatus,
  upgradeUser,
  handleWebhook,
};