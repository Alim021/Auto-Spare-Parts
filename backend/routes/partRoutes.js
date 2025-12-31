const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Part = require('../models/Part');
const SalesHistory = require('../models/SalesHistory');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../frontend/public'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// ✅ GET all parts
router.get('/all-parts', async (req, res) => {
  try {
    const parts = await Part.find({}).sort({ createdAt: -1 });
    return res.status(200).json(parts);
  } catch (err) {
    console.error('❌ DB Error (all-parts):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ GET parts by email
router.get('/my-parts/:email', async (req, res) => {
  const userEmail = req.params.email;
  
  try {
    const parts = await Part.find({ email: userEmail }).sort({ createdAt: -1 });
    return res.status(200).json(parts);
  } catch (err) {
    console.error('❌ DB Error (my-parts):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ POST new part
router.post('/add-part', upload.single('image'), async (req, res) => {
  const {
    name,
    description,
    price,
    originalPrice,
    shopName,
    shopLocation,
    email,
    quantity_owned,
    part_number,
    gst_rate,
    hsn_code
  } = req.body;

  if (
    !name || !description || !price || !originalPrice || !shopName || 
    !shopLocation || !email || !quantity_owned || !part_number
  ) {
    return res.status(400).json({ 
      message: 'Please fill all required fields including quantity and part number' 
    });
  }

  const validGSTRates = ['0', '5', '12', '18', '28'];
  const gstRate = gst_rate && validGSTRates.includes(gst_rate) ? gst_rate : '18';

  if (hsn_code && !/^\d{4,8}$/.test(hsn_code)) {
    return res.status(400).json({ message: 'HSN code must be 4-8 digits' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Image upload failed' });
  }

  const imagePath = '/' + req.file.filename;

  try {
    const newPart = await Part.create({
      name,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice),
      image: imagePath,
      shopName,
      shopLocation,
      email,
      quantity_owned: Number(quantity_owned),
      part_number,
      gst_rate: gstRate,
      hsn_code: hsn_code || null
    });

    return res.status(201).json({ 
      message: 'Part added successfully!',
      part_id: newPart._id 
    });
  } catch (err) {
    console.error('❌ DB Error (add-part):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ DELETE part by ID
router.delete('/delete-part/:id', async (req, res) => {
  const partId = req.params.id;
  const email = req.headers['x-user-email'];

  try {
    const part = await Part.findOne({ _id: partId, email: email });
    
    if (!part) {
      return res.status(403).json({ message: 'You are not allowed to delete this part' });
    }

    await Part.findByIdAndDelete(partId);
    
    return res.status(200).json({ message: 'Part deleted successfully!' });
  } catch (err) {
    console.error('❌ DB Error (delete-part):', err);
    return res.status(500).json({ message: 'Failed to delete part' });
  }
});

// ✅ UPDATE part by ID
router.put('/update-part/:id', upload.single('image'), async (req, res) => {
  const partId = req.params.id;
  const email = req.headers['x-user-email'];

  try {
    const part = await Part.findOne({ _id: partId, email: email });
    
    if (!part) {
      return res.status(403).json({ message: 'You are not allowed to update this part' });
    }

    const {
      name,
      description,
      price,
      originalPrice,
      quantity_owned,
      shopName,
      shopLocation,
      part_number,
      gst_rate,
      hsn_code
    } = req.body;

    if (
      !name || !description || !price || !originalPrice || !quantity_owned || 
      !shopName || !shopLocation || !part_number
    ) {
      return res.status(400).json({ message: 'Please fill all required fields including part number' });
    }

    const validGSTRates = ['0', '5', '12', '18', '28'];
    const gstRate = gst_rate && validGSTRates.includes(gst_rate) ? gst_rate : '18';

    if (hsn_code && !/^\d{4,8}$/.test(hsn_code)) {
      return res.status(400).json({ message: 'HSN code must be 4-8 digits' });
    }

    const updateData = {
      name,
      description,
      price: Number(price),
      originalPrice: Number(originalPrice),
      quantity_owned: Number(quantity_owned),
      shopName,
      shopLocation,
      part_number,
      gst_rate: gstRate,
      hsn_code: hsn_code || null
    };

    if (req.file) {
      updateData.image = '/' + req.file.filename;
    }

    const updatedPart = await Part.findByIdAndUpdate(
      partId,
      updateData,
      { new: true }
    );

    return res.status(200).json({ 
      message: 'Part updated successfully!',
      part: updatedPart 
    });
  } catch (err) {
    console.error('❌ DB Error (update-part):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ SELL part
router.put('/sell-part/:id', async (req, res) => {
  const partId = req.params.id;
  const email = req.headers['x-user-email'];
  const { sellQuantity } = req.body;

  if (!email) {
    return res.status(401).json({ message: 'Unauthorized: No user email provided' });
  }
  if (!sellQuantity || sellQuantity <= 0) {
    return res.status(400).json({ message: 'Invalid sell quantity' });
  }

  try {
    const part = await Part.findOne({ _id: partId, email: email });
    
    if (!part) {
      return res.status(404).json({ message: 'Part not found or you do not own this part' });
    }

    if (part.quantity_owned < sellQuantity) {
      return res.status(400).json({ message: 'Sell quantity exceeds available quantity' });
    }

    const newQuantity = part.quantity_owned - sellQuantity;
    
    const updatedPart = await Part.findByIdAndUpdate(
      partId,
      { quantity_owned: newQuantity },
      { new: true }
    );

    return res.status(200).json({ 
      message: 'Sell successful', 
      quantity_owned: newQuantity,
      part_name: part.name 
    });
  } catch (err) {
    console.error('❌ DB Error (sell-part):', err);
    return res.status(500).json({ message: 'Database error during update' });
  }
});

// ✅ Get parts with GST details
router.get('/parts-with-gst/:email', async (req, res) => {
  const userEmail = req.params.email;
  
  try {
    const parts = await Part.find({ 
      email: userEmail, 
      gst_rate: { $ne: null } 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json(parts);
  } catch (err) {
    console.error('❌ DB Error (parts-with-gst):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Update GST and HSN
router.put('/update-part-gst/:id', async (req, res) => {
  const partId = req.params.id;
  const email = req.headers['x-user-email'];
  const { gst_rate, hsn_code } = req.body;

  if (!email) {
    return res.status(401).json({ message: 'Unauthorized: No user email provided' });
  }

  try {
    const part = await Part.findOne({ _id: partId, email: email });
    
    if (!part) {
      return res.status(403).json({ message: 'You are not allowed to update this part' });
    }

    const validGSTRates = ['0', '5', '12', '18', '28'];
    const gstRate = gst_rate && validGSTRates.includes(gst_rate) ? gst_rate : '18';

    if (hsn_code && !/^\d{4,8}$/.test(hsn_code)) {
      return res.status(400).json({ message: 'HSN code must be 4-8 digits' });
    }

    const updatedPart = await Part.findByIdAndUpdate(
      partId,
      { 
        gst_rate: gstRate,
        hsn_code: hsn_code || null 
      },
      { new: true }
    );

    return res.status(200).json({ 
      message: 'GST details updated successfully!',
      part: updatedPart 
    });
  } catch (err) {
    console.error('❌ DB Error (update-part-gst):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Get parts by HSN code
router.get('/parts-by-hsn/:hsn_code', async (req, res) => {
  const hsnCode = req.params.hsn_code;
  
  try {
    const parts = await Part.find({ hsn_code: hsnCode }).sort({ createdAt: -1 });
    return res.status(200).json(parts);
  } catch (err) {
    console.error('❌ DB Error (parts-by-hsn):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Get GST summary
router.get('/gst-summary/:email', async (req, res) => {
  const userEmail = req.params.email;
  
  try {
    const gstSummary = await Part.aggregate([
      {
        $match: {
          email: userEmail,
          gst_rate: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$gst_rate",
          part_count: { $sum: 1 },
          total_inventory_value: {
            $sum: { $multiply: ["$price", "$quantity_owned"] }
          }
        }
      },
      {
        $project: {
          gst_rate: "$_id",
          part_count: 1,
          total_inventory_value: 1,
          _id: 0
        }
      },
      { $sort: { gst_rate: 1 } }
    ]);

    return res.status(200).json(gstSummary);
  } catch (err) {
    console.error('❌ DB Error (gst-summary):', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// ✅ Record sale
router.post('/record-sale', async (req, res) => {
  const {
    part_id,
    part_number,
    part_name,
    customer_name,
    quantity_sold,
    selling_price,
    total_amount,
    gst_rate,
    sgst_amount,
    cgst_amount,
    shop_email,
    invoice_number
  } = req.body;

  try {
    const saleRecord = await SalesHistory.create({
      part_id,
      part_number,
      part_name,
      customer_name,
      quantity_sold: Number(quantity_sold),
      selling_price: Number(selling_price),
      total_amount: Number(total_amount),
      gst_rate,
      sgst_amount: Number(sgst_amount),
      cgst_amount: Number(cgst_amount),
      shop_email,
      invoice_number,
      sale_date: new Date()
    });

    res.json({ 
      message: 'Sale recorded successfully', 
      sale_id: saleRecord._id 
    });
  } catch (err) {
    console.error('❌ Error recording sale:', err);
    return res.status(500).json({ 
      message: 'Failed to record sale history', 
      error: err.message 
    });
  }
});

// ✅ Get sales history
router.get('/sales-history/:email', async (req, res) => {
  const email = req.params.email;
  
  try {
    const salesHistory = await SalesHistory.find({ shop_email: email })
      .sort({ sale_date: -1 });
    
    res.json(salesHistory);
  } catch (err) {
    console.error('❌ Error fetching sales history:', err);
    return res.status(500).json({ message: 'Failed to fetch sales history' });
  }
});

// ✅ Get sales statistics
router.get('/sales-stats/:email', async (req, res) => {
  const email = req.params.email;
  
  try {
    const salesStats = await SalesHistory.aggregate([
      {
        $match: { shop_email: email }
      },
      {
        $group: {
          _id: null,
          total_sales: { $sum: 1 },
          total_items_sold: { $sum: "$quantity_sold" },
          total_revenue: { $sum: "$total_amount" },
          total_gst_collected: { $sum: { $add: ["$sgst_amount", "$cgst_amount"] } },
          total_customers: { $addToSet: "$customer_name" }
        }
      },
      {
        $project: {
          _id: 0,
          total_sales: 1,
          total_items_sold: 1,
          total_revenue: 1,
          total_gst_collected: 1,
          total_customers: { $size: "$total_customers" }
        }
      }
    ]);

    res.json(salesStats[0] || {});
  } catch (err) {
    console.error('❌ Error fetching sales stats:', err);
    return res.status(500).json({ message: 'Failed to fetch sales statistics' });
  }
});

module.exports = router;