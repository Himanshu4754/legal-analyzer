const premiumOnly = (req, res, next) => {
  if (!req.user.isPremium) {
    return res.status(403).json({
      message: "This feature requires a Premium subscription",
      upgradeRequired: true,
    });
  }
  next();
};

const checkDocumentLimit = async (req, res, next) => {
  if (req.user.isPremium) return next();
  
  if (req.user.documentsCount >= 3) {
    return res.status(403).json({
      message: "Free plan limit reached. Upgrade to Premium for unlimited documents.",
      upgradeRequired: true,
    });
  }
  next();
};

module.exports = { premiumOnly, checkDocumentLimit };