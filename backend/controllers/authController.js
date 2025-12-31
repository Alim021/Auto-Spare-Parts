const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ShopOwner = require('../models/ShopOwner');

exports.register = async (req, res) => {
  const { shop_name, email, password, shop_location, contact_number } = req.body;

  if (!shop_name || !email || !password || !shop_location || !contact_number) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const existingUser = await ShopOwner.findOne({ email: email });
    
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await ShopOwner.create({
      shop_name,
      email,
      password: hashedPassword,
      shop_location,
      phone: contact_number
    });

    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await ShopOwner.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
};