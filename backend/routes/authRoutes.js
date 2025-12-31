const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const ShopOwner = require('../models/ShopOwner');

function validateGSTNumber(gstNumber) {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 🔐 REGISTER Route with GST number
router.post('/register', async (req, res) => {
  const { name, shop_name, email, password, shop_location, phone, gst_number } = req.body;

  if (!shop_name || !name || !email || !password || !shop_location || !phone) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  if (gst_number && !validateGSTNumber(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  try {
    const existingUser = await ShopOwner.findOne({ email: email });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await ShopOwner.create({
      shop_name,
      name,
      email,
      password: hashedPassword,
      shop_location,
      phone,
      gst_number: gst_number || null
    });

    res.status(201).json({ 
      message: 'Registration successful!',
      user: {
        id: newUser._id,
        name,
        email,
        shop_name,
        gst_number: gst_number || null
      }
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// 🔐 LOGIN Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await ShopOwner.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      shop_name: user.shop_name,
      shop_location: user.shop_location,
      phone: user.phone,
      gst_number: user.gst_number,
      created_at: user.created_at
    };

    res.status(200).json({ 
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ message: 'Authentication error' });
  }
});

// 🔐 FORGOT PASSWORD Route
router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Please provide email and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await ShopOwner.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await ShopOwner.findOneAndUpdate(
      { email: email },
      { password: hashedPassword }
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
});

// 🔐 UPDATE PROFILE Route
router.put('/update-profile/:email', async (req, res) => {
  const currentEmail = req.params.email;
  const { name, shop_name, phone, shop_location, email, gst_number, currentPassword, newPassword } = req.body;

  if (!name || !shop_name || !phone || !shop_location || !email) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  if (gst_number && !validateGSTNumber(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }

  try {
    const user = await ShopOwner.findOne({ email: currentEmail });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {
      name,
      shop_name,
      phone,
      shop_location,
      email,
      gst_number: gst_number || null
    };

    if (currentPassword && newPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedNewPassword;
    }

    if (email !== currentEmail) {
      const existingEmailUser = await ShopOwner.findOne({ 
        email: email,
        _id: { $ne: user._id }
      });
      
      if (existingEmailUser) {
        return res.status(409).json({ message: 'New email already exists' });
      }
    }

    const updatedUser = await ShopOwner.findOneAndUpdate(
      { email: currentEmail },
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ 
      message: 'Profile updated successfully',
      updated_fields: currentPassword && newPassword ? 'Profile and password' : 'Profile'
    });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    return res.status(500).json({ message: 'Server error during profile update' });
  }
});

// 🔐 VALIDATE GST NUMBER Route
router.post('/validate-gst', (req, res) => {
  const { gst_number } = req.body;
  
  if (!gst_number) {
    return res.status(400).json({ message: 'GST number is required' });
  }

  const isValid = validateGSTNumber(gst_number);
  
  if (isValid) {
    return res.status(200).json({ 
      valid: true, 
      message: 'Valid GST number format' 
    });
  } else {
    return res.status(200).json({ 
      valid: false, 
      message: 'Invalid GST number format. Expected format: 27ABCDE1234F1Z5' 
    });
  }
});

// 🔐 CHECK EMAIL AVAILABILITY Route
router.get('/check-email/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const user = await ShopOwner.findOne({ email: email });
    
    const isAvailable = !user;
    
    res.status(200).json({ 
      available: isAvailable,
      message: isAvailable ? 'Email is available' : 'Email already exists'
    });
  } catch (error) {
    console.error("❌ Email check error:", error);
    return res.status(500).json({ message: 'Database error' });
  }
});

module.exports = router;