const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const register = async (req, res) => {
  try {
    console.log("REGISTER HIT", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isPremium: user.isPremium,    // ← ADDED
      token: generateToken(user._id),
    });
  } catch (err) {
    console.log("REGISTER ERROR", err);
    return res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    console.log("LOGIN HIT", req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isPremium: user.isPremium,    // ← ADDED
      token: generateToken(user._id),
    });
  } catch (err) {
    console.log("LOGIN ERROR", err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login };