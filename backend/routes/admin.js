const express = require("express");
const router = express.Router();
// CHANGE: MySQL se mongoose aur models import
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const ShopOwner = require('../models/ShopOwner');
const Part = require('../models/Part');
const Admin = require('../models/Admin');

// ===============================
// ADMIN LOGIN
// ===============================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // CHANGE: MySQL query se MongoDB findOne
    const admin = await Admin.findOne({ email: email });
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // CHANGE: Plain text compare se bcrypt compare
    // OLD: if (password !== admin.password)
    // NEW:
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
});

// ===============================
// GET ALL USERS
// ===============================
router.get("/admin/users", async (req, res) => {
  try {
    // CHANGE: MySQL query se MongoDB find
    const users = await ShopOwner.find({})
      .select('name email shop_name shop_location phone gst_number')
      .sort({ _id: -1 });
    
    const formatted = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      shop_name: u.shop_name,
      shop_location: u.shop_location,
      phone: u.phone,
      gst_number: u.gst_number,
      gst_status: u.gst_number ? "Registered" : "Not Registered",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ message: "DB error", error: err.message });
  }
});

// ===============================
// DELETE USER + HIS PARTS (using email)
// ===============================
router.delete("/admin/users/:email", async (req, res) => {
  const userEmail = req.params.email;

  try {
    // Step 1: Verify user exists
    const user = await ShopOwner.findOne({ email: userEmail });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Step 2: Delete spare parts added by user
    await Part.deleteMany({ email: userEmail });

    // Step 3: Delete user
    await ShopOwner.deleteOne({ email: userEmail });

    res.json({
      message: "User and all related spare parts deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

// ===============================
// GET ALL PARTS
// ===============================
router.get("/parts", async (req, res) => {
  try {
    // CHANGE: MySQL JOIN se MongoDB aggregation
    const partsWithShopInfo = await Part.aggregate([
      {
        $lookup: {
          from: "shopowners", // Collection name (lowercase plural)
          localField: "email",
          foreignField: "email",
          as: "shopInfo"
        }
      },
      {
        $unwind: {
          path: "$shopInfo",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          originalPrice: 1,
          image: 1,
          shopName: 1,
          shopLocation: 1,
          email: 1,
          createdAt: 1,
          shop_name: "$shopInfo.shop_name",
          shop_gst_number: "$shopInfo.gst_number"
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(partsWithShopInfo);
  } catch (err) {
    console.error("Get parts error:", err);
    return res.status(500).json({ message: "DB error", error: err.message });
  }
});

// ===============================
// DASHBOARD STATS
// ===============================
router.get("/dashboard-stats", async (req, res) => {
  try {
    // CHANGE: Multiple queries se Promise.all
    const [
      total_users,
      total_parts,
      gst_registered_users,
    ] = await Promise.all([
      ShopOwner.countDocuments(),
      Part.countDocuments(),
      ShopOwner.countDocuments({ gst_number: { $ne: null, $ne: "" } }),
    ]);

    // Inventory value calculate karna hai
    // Note: Part model me quantity field add karna hoga
    const inventoryAggregation = await Part.aggregate([
      {
        $group: {
          _id: null,
          total_inventory_value: {
            $sum: { $multiply: ["$price", "$quantity"] }
          }
        }
      }
    ]);

    const total_inventory_value = inventoryAggregation[0]?.total_inventory_value || 0;

    res.json({
      total_users,
      total_parts,
      gst_registered_users,
      total_inventory_value
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res.status(500).json({ message: "DB error", error: err.message });
  }
});

// ===============================
// GET RECENT USERS
// ===============================
router.get("/recent-users", async (req, res) => {
  try {
    // CHANGE: MySQL query se MongoDB find with limit
    const users = await ShopOwner.find({})
      .select('name email')
      .sort({ _id: -1 })
      .limit(5);
    
    const formatted = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Recent users error:", err);
    return res.status(500).json({ message: "DB error", error: err.message });
  }
});

// ===============================
// GET RECENT PARTS
// ===============================
router.get("/recent-parts", async (req, res) => {
  try {
    // CHANGE: MySQL query se MongoDB find with limit
    const parts = await Part.find({})
      .select('name description')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const formatted = parts.map(p => ({
      id: p._id,
      name: p.name,
      description: p.description
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Recent parts error:", err);
    return res.status(500).json({ message: "DB error", error: err.message });
  }
});

// ===============================
// DIAGNOSE TABLES (MongoDB version)
// ===============================
router.get("/diagnose", async (req, res) => {
  try {
    const results = {
      collections: [],
      shopOwner_schema: [],
      part_schema: [],
      admin_schema: []
    };

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    results.collections = collections.map(c => c.name);

    // Get sample documents to see schema
    const shopOwnerSample = await ShopOwner.findOne();
    results.shopOwner_schema = shopOwnerSample ? Object.keys(shopOwnerSample.toObject()) : [];

    const partSample = await Part.findOne();
    results.part_schema = partSample ? Object.keys(partSample.toObject()) : [];

    const adminSample = await Admin.findOne();
    results.admin_schema = adminSample ? Object.keys(adminSample.toObject()) : [];

    res.json(results);
  } catch (err) {
    console.error("Diagnose error:", err);
    res.json({ error: err.message });
  }
});

module.exports = router;