"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../styles/addpart.css";

export default function AddPart() {
  const [parts, setParts] = useState([
    {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      image: "",
      shopName: "",
      shopLocation: "",
      file: null,
      quantity_owned: "",
      part_number: "",
      gst_rate: "18", // Default GST rate
      hsn_code: ""    // HSN code field
    },
  ]);

  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [shopInfo, setShopInfo] = useState({ shopName: "", shopLocation: "" });

  const router = useRouter();

  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) {
      setSubmitError("Please login first.");
      router.push("/login");
      return;
    }
    setEmail(userEmail);

    // Fetch shop info if available
    fetchShopInfo(userEmail);
  }, [router]);

  const fetchShopInfo = async (userEmail) => {
    try {
      const response = await fetch(`http://localhost:5000/api/shop_owners?email=${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const shop = data[0];
          setShopInfo({
            shopName: shop.shop_name || "",
            shopLocation: shop.shop_location || ""
          });
          
          // Auto-fill shop info for all parts
          setParts(prevParts => prevParts.map(part => ({
            ...part,
            shopName: shop.shop_name || "",
            shopLocation: shop.shop_location || ""
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching shop info:", error);
    }
  };

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedParts = [...parts];
    
    // Auto-calculate discount if both prices are available
    if ((name === "price" || name === "originalPrice") && updatedParts[index].price && updatedParts[index].originalPrice) {
      const price = name === "price" ? value : updatedParts[index].price;
      const originalPrice = name === "originalPrice" ? value : updatedParts[index].originalPrice;
      
      if (price && originalPrice && parseFloat(originalPrice) > 0) {
        const discount = ((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice) * 100).toFixed(1);
        // You can store discount in state if needed
      }
    }

    updatedParts[index][name] = value;
    setParts(updatedParts);
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setSubmitError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setSubmitError("Image size should be less than 5MB.");
      return;
    }

    const updatedParts = [...parts];
    updatedParts[index].image = URL.createObjectURL(file);
    updatedParts[index].file = file;
    setParts(updatedParts);
    setSubmitError(""); // Clear error on successful image selection
  };

  const handleAddMore = () => {
    setParts([
      ...parts,
      {
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        image: "",
        shopName: shopInfo.shopName,
        shopLocation: shopInfo.shopLocation,
        file: null,
        quantity_owned: "",
        part_number: "",
        gst_rate: "18", // Default GST rate for new parts
        hsn_code: ""
      },
    ]);
  };

  const removePart = (index) => {
    if (parts.length > 1) {
      const updatedParts = parts.filter((_, i) => i !== index);
      setParts(updatedParts);
    }
  };

  const validatePart = (part) => {
    if (!part.part_number.trim()) return "Part number is required";
    if (!part.name.trim()) return "Part name is required";
    if (!part.description.trim()) return "Description is required";
    if (!part.quantity_owned || parseInt(part.quantity_owned) < 0) return "Valid quantity is required";
    if (!part.price || parseFloat(part.price) <= 0) return "Valid selling price is required";
    if (!part.originalPrice || parseFloat(part.originalPrice) <= 0) return "Valid original price is required";
    if (parseFloat(part.price) > parseFloat(part.originalPrice)) return "Selling price cannot be higher than original price";
    if (!part.file) return "Image is required";
    if (!part.shopName.trim()) return "Shop name is required";
    if (!part.shopLocation.trim()) return "Shop location is required";
    if (!part.gst_rate) return "GST rate is required";
    if (part.hsn_code && !/^\d{4,8}$/.test(part.hsn_code)) return "HSN code must be 4-8 digits";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setSubmitError("Please login first.");
      router.push("/login");
      return;
    }

    setLoading(true);
    setSubmitSuccess("");
    setSubmitError("");

    // Validate all parts
    for (let i = 0; i < parts.length; i++) {
      const error = validatePart(parts[i]);
      if (error) {
        setSubmitError(`Part ${i + 1}: ${error}`);
        setLoading(false);
        return;
      }
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const part of parts) {
        try {
          const formData = new FormData();
          formData.append("name", part.name);
          formData.append("description", part.description);
          formData.append("price", part.price);
          formData.append("originalPrice", part.originalPrice);
          formData.append("shopName", part.shopName);
          formData.append("shopLocation", part.shopLocation);
          formData.append("email", email);
          formData.append("image", part.file);
          formData.append("quantity_owned", part.quantity_owned);
          formData.append("part_number", part.part_number);
          formData.append("gst_rate", part.gst_rate);
          formData.append("hsn_code", part.hsn_code);

          const res = await fetch("http://localhost:5000/api/add-part", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to add part ${part.name}:`, data.message);
          }
        } catch (err) {
          errorCount++;
          console.error(`Error adding part ${part.name}:`, err);
        }
      }

      if (successCount > 0) {
        setSubmitSuccess(`${successCount} part(s) added successfully!${errorCount > 0 ? ` ${errorCount} part(s) failed.` : ''}`);
        
        // Reset form
        setParts([
          {
            name: "",
            description: "",
            price: "",
            originalPrice: "",
            image: "",
            shopName: shopInfo.shopName,
            shopLocation: shopInfo.shopLocation,
            file: null,
            quantity_owned: "",
            part_number: "",
            gst_rate: "18",
            hsn_code: ""
          },
        ]);

        setTimeout(() => {
          setSubmitSuccess("");
        }, 5000);
      } else {
        setSubmitError("All parts failed to add. Please try again.");
      }

    } catch (err) {
      console.error("Upload Error:", err);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearPart = (index) => {
    const updatedParts = [...parts];
    updatedParts[index] = {
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      image: "",
      shopName: shopInfo.shopName,
      shopLocation: shopInfo.shopLocation,
      file: null,
      quantity_owned: "",
      part_number: "",
      gst_rate: "18",
      hsn_code: ""
    };
    setParts(updatedParts);
  };

  // Common HSN codes for auto parts
  const commonHsnCodes = [
    { code: "8708", description: "Parts for motor vehicles" },
    { code: "8409", description: "Engines and parts" },
    { code: "8413", description: "Pumps for liquids" },
    { code: "8483", description: "Transmission shafts" },
    { code: "8511", description: "Electrical ignition equipment" },
    { code: "8539", description: "Electrical lighting equipment" },
    { code: "8707", description: "Bodies for motor vehicles" },
    { code: "8714", description: "Parts for motorcycles" }
  ];

  if (!email) {
    return (
      <div className="addpart-container">
        <div className="loading-message">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="addpart-container">
      <form className="addpart-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>Add Spare Parts</h2>
          <p>Add multiple parts to your shop with GST details</p>
        </div>

        {/* Message Alerts */}
        {submitError && (
          <div className="alert error">
            <span className="alert-icon">⚠️</span>
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="alert success">
            <span className="alert-icon">✅</span>
            {submitSuccess}
          </div>
        )}

        <div className="parts-container">
          {parts.map((part, index) => (
            <div key={index} className="part-card">
              <div className="card-header">
                <h3>Part {index + 1}</h3>
                <div className="card-actions">
                  {parts.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => removePart(index)}
                      title="Remove part"
                    >
                      🗑️
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="clear-btn"
                    onClick={() => clearPart(index)}
                    title="Clear fields"
                  >
                    �️
                  </button>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <label>Part Number *</label>
                  <input
                    type="text"
                    name="part_number"
                    placeholder="Enter part number"
                    value={part.part_number}
                    onChange={(e) => handleChange(index, e)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Part Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter part name"
                    value={part.name}
                    onChange={(e) => handleChange(index, e)}
                    required
                  />
                </div>

                <div className="input-group full-width">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    placeholder="Describe the part, features, compatibility..."
                    value={part.description}
                    onChange={(e) => handleChange(index, e)}
                    rows="3"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity_owned"
                    placeholder="Available quantity"
                    value={part.quantity_owned}
                    onChange={(e) => handleChange(index, e)}
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Original Price (₹) *</label>
                  <input
                    type="number"
                    name="originalPrice"
                    placeholder="Original price"
                    value={part.originalPrice}
                    onChange={(e) => handleChange(index, e)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Selling price"
                    value={part.price}
                    onChange={(e) => handleChange(index, e)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                {part.price && part.originalPrice && parseFloat(part.originalPrice) > 0 && (
                  <div className="discount-badge">
                    Discount: {((parseFloat(part.originalPrice) - parseFloat(part.price)) / parseFloat(part.originalPrice) * 100).toFixed(1)}%
                  </div>
                )}

                {/* GST Rate Field */}
                <div className="input-group">
                  <label>GST Rate (%) *</label>
                  <select
                    name="gst_rate"
                    value={part.gst_rate}
                    onChange={(e) => handleChange(index, e)}
                    required
                    className="gst-select"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                {/* HSN Code Field */}
                <div className="input-group">
                  <label>HSN Code</label>
                  <div className="hsn-input-container">
                    <input
                      type="text"
                      name="hsn_code"
                      placeholder="Enter HSN code"
                      value={part.hsn_code}
                      onChange={(e) => handleChange(index, e)}
                      maxLength="8"
                      pattern="[0-9]{4,8}"
                      title="4-8 digit HSN code"
                    />
                    <select 
                      className="hsn-suggestions"
                      onChange={(e) => {
                        if (e.target.value) {
                          const updatedParts = [...parts];
                          updatedParts[index].hsn_code = e.target.value;
                          setParts(updatedParts);
                        }
                      }}
                      value=""
                    >
                      <option value="">Common HSN codes</option>
                      {commonHsnCodes.map((hsn, i) => (
                        <option key={i} value={hsn.code}>
                          {hsn.code} - {hsn.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="field-hint">4-8 digits (e.g., 8708)</span>
                </div>

                <div className="input-group full-width">
                  <label>Part Image *</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e)}
                      required
                    />
                    <span className="file-hint">Max 5MB, JPG/PNG/WebP</span>
                  </div>
                  {part.image && (
                    <div className="image-preview">
                      <img src={part.image} alt="Part preview" />
                      <span className="preview-text">Preview</span>
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    name="shopName"
                    placeholder="Your shop name"
                    value={part.shopName}
                    onChange={(e) => handleChange(index, e)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Shop Location *</label>
                  <input
                    type="text"
                    name="shopLocation"
                    placeholder="Shop address or Google Maps link"
                    value={part.shopLocation}
                    onChange={(e) => handleChange(index, e)}
                    required
                  />
                </div>
              </div>

              {/* GST Calculation Preview */}
              {part.price && part.gst_rate && (
                <div className="gst-preview">
                  <h4>GST Calculation Preview</h4>
                  <div className="gst-breakdown">
                    <span>Base Price: ₹{parseFloat(part.price).toFixed(2)}</span>
                    <span>SGST ({part.gst_rate/2}%): ₹{(part.price * part.gst_rate / 200).toFixed(2)}</span>
                    <span>CGST ({part.gst_rate/2}%): ₹{(part.price * part.gst_rate / 200).toFixed(2)}</span>
                    <span className="total">Total: ₹{(parseFloat(part.price) * (1 + parseFloat(part.gst_rate)/100)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleAddMore} 
            className="add-more-btn"
            disabled={loading}
          >
            ➕ Add Another Part
          </button>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Adding Parts...
              </>
            ) : (
              `Add All Parts (${parts.length})`
            )}
          </button>
        </div>

        <div className="form-footer">
          <p>Total parts to add: <strong>{parts.length}</strong></p>
          <p className="gst-note">* GST details will be used for tax invoices and compliance</p>
        </div>
      </form>
    </div>
  );
}