const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const ShopOwner = require('../models/ShopOwner');
const Part = require('../models/Part');

function validateGSTNumber(gstNumber) {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber);
}

// ✅ Register shop owner
router.post('/register', async (req, res) => {
  const { name, email, password, phone, shop_name, shop_location, gst_number } = req.body;

  if (!name || !email || !password || !phone || !shop_name || !shop_location) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (gst_number && !validateGSTNumber(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  try {
    const existingUser = await ShopOwner.findOne({ email: email });
    
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await ShopOwner.create({
      name,
      email,
      password: hashedPassword,
      shop_name,
      shop_location,
      phone,
      gst_number: gst_number || null
    });

    return res.status(201).json({ 
      message: 'Shop owner registered successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await ShopOwner.findOne({ email: email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    return res.status(200).json({ 
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
        shop_name: user.shop_name,
        gst_number: user.gst_number
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await ShopOwner.find({})
      .select('name email phone shop_name shop_location gst_number created_at')
      .sort({ created_at: -1 });
    
    return res.status(200).json(users);
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Get user profile
router.get('/user-profile/:email', async (req, res) => {
  const email = req.params.email;
  
  try {
    const user = await ShopOwner.findOne({ email: email });
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      shop_name: user.shop_name,
      shop_location: user.shop_location,
      gst_number: user.gst_number
    });
  } catch (err) {
    console.error("Get user profile error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Get shop owners by email
router.get('/shop_owners', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ message: 'Email parameter is required' });
  }

  try {
    const shopOwners = await ShopOwner.find({ email: email });
    
    if (shopOwners.length === 0) {
      return res.status(404).json({ message: 'Shop owner not found' });
    }
    
    return res.status(200).json(shopOwners);
  } catch (err) {
    console.error("Get shop owners error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Update Profile
router.put('/update-profile/:email', async (req, res) => {
  const currentEmail = req.params.email;
  const { name, shop_name, phone, shop_location, email, gst_number } = req.body;

  if (!name || !shop_name || !phone || !shop_location || !email) {
    return res.status(400).json({ message: 'All fields are required including new_email' });
  }

  if (gst_number && !validateGSTNumber(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  try {
    if (email !== currentEmail) {
      const existingEmailUser = await ShopOwner.findOne({ 
        email: email,
        _id: { $ne: null }
      });
      
      if (existingEmailUser) {
        return res.status(409).json({ message: 'New email already exists' });
      }
    }

    const updatedUser = await ShopOwner.findOneAndUpdate(
      { email: currentEmail },
      {
        name,
        shop_name,
        phone,
        shop_location,
        email,
        gst_number: gst_number || null
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: 'Update failed', error: err.message });
  }
});

// ✅ Update GST number only
router.put('/update-gst/:email', async (req, res) => {
  const email = req.params.email;
  const { gst_number } = req.body;

  if (!gst_number) {
    return res.status(400).json({ message: 'GST number is required' });
  }

  if (!validateGSTNumber(gst_number)) {
    return res.status(400).json({ message: 'Invalid GST number format' });
  }

  try {
    const updatedUser = await ShopOwner.findOneAndUpdate(
      { email: email },
      { gst_number: gst_number },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'GST number updated successfully',
      gst_number: updatedUser.gst_number
    });
  } catch (err) {
    console.error("Update GST error:", err);
    return res.status(500).json({ message: 'GST update failed', error: err.message });
  }
});

// ✅ Delete user + items
router.delete('/users/:email', async (req, res) => {
  const email = req.params.email;

  try {
    const user = await ShopOwner.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Part.deleteMany({ email: email });
    await ShopOwner.deleteOne({ email: email });

    return res.status(200).json({ message: 'User and items deleted successfully' });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: 'User delete failed', error: err.message });
  }
});

// ✅ Get shops with GST numbers
router.get('/shops-with-gst', async (req, res) => {
  try {
    const shops = await ShopOwner.find({ 
      gst_number: { $ne: null, $ne: "" } 
    })
    .select('name shop_name email phone gst_number shop_location created_at')
    .sort({ created_at: -1 });
    
    return res.status(200).json(shops);
  } catch (err) {
    console.error("Get shops with GST error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Get shops without GST numbers
router.get('/shops-without-gst', async (req, res) => {
  try {
    const shops = await ShopOwner.find({ 
      $or: [
        { gst_number: null },
        { gst_number: "" }
      ]
    })
    .select('name shop_name email phone shop_location created_at')
    .sort({ created_at: -1 });
    
    return res.status(200).json(shops);
  } catch (err) {
    console.error("Get shops without GST error:", err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ GST validation
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

module.exports = router;