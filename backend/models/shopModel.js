// CHANGE: MySQL connection se mongoose aur ShopOwner model import
const mongoose = require('mongoose');
const ShopOwner = require('./ShopOwner'); // Ye model file already bana hai

exports.createShopOwner = async (data) => {
  try {
    // CHANGE: MySQL INSERT se MongoDB create
    const newShopOwner = await ShopOwner.create({
      shop_name: data.shop_name,
      email: data.email,
      password: data.password, // Note: Password already hashed hoga
      shop_location: data.shop_location,
      phone: data.contact_number // CHANGE: contact_number se phone
    });
    
    return { success: true, id: newShopOwner._id };
  } catch (error) {
    console.error("Error creating shop owner:", error);
    throw error;
  }
};

exports.findByEmail = async (email) => {
  try {
    // CHANGE: MySQL query se MongoDB findOne
    const shopOwner = await ShopOwner.findOne({ email: email });
    return shopOwner;
  } catch (error) {
    console.error("Error finding shop owner by email:", error);
    throw error;
  }
};

// OPTIONAL: Agar aur methods chahiye to
exports.findById = async (id) => {
  try {
    const shopOwner = await ShopOwner.findById(id);
    return shopOwner;
  } catch (error) {
    console.error("Error finding shop owner by ID:", error);
    throw error;
  }
};

exports.updateShopOwner = async (id, data) => {
  try {
    const updatedShopOwner = await ShopOwner.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
    return updatedShopOwner;
  } catch (error) {
    console.error("Error updating shop owner:", error);
    throw error;
  }
};

exports.deleteShopOwner = async (id) => {
  try {
    await ShopOwner.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    console.error("Error deleting shop owner:", error);
    throw error;
  }
};