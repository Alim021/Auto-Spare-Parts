"use client";

// THESE TWO LINES ARE CRITICAL - MUST BE AT THE TOP
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/home.css";
import "../../styles/myitems.css";

export default function MyPartsPage() {
  const [parts, setParts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPart, setEditingPart] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    part_number: "", name: "", description: "", price: "", 
    originalPrice: "", quantity_owned: "", shopName: "", 
    shopLocation: "", image: null, imagePreview: "",
  });

  const router = useRouter();
  
  // DIRECT URL - No conditions
  const API_BASE_URL = "https://auto-spare-parts.onrender.com";

  // Get email without useSearchParams - SAFE METHOD
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const getEmail = () => {
      try {
        // Method 1: URL parameters
        const urlSearchParams = new URLSearchParams(window.location.search);
        const emailFromUrl = urlSearchParams.get('email');
        if (emailFromUrl) return emailFromUrl;
        
        // Method 2: localStorage
        const emailFromStorage = localStorage.getItem('email');
        if (emailFromStorage) return emailFromStorage;
        
        return null;
      } catch (error) {
        console.error("Error getting email:", error);
        return null;
      }
    };
    
    const email = getEmail();
    if (email) {
      setLoggedInEmail(email);
    } else {
      alert("Please login first!");
      router.push("/login");
      return;
    }
  }, [router]);

  // Fetch data
  useEffect(() => {
    if (!loggedInEmail) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [userResponse, partsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/shop_owners?email=${loggedInEmail}`),
          fetch(`${API_BASE_URL}/api/spare_parts?email=${loggedInEmail}`)
        ]);
        
        if (!userResponse.ok || !partsResponse.ok) {
          throw new Error("Network response was not ok");
        }
        
        const userData = await userResponse.json();
        const partsData = await partsResponse.json();
        
        setUserProfile(userData[0] || null);
        setParts(Array.isArray(partsData) ? partsData : []);
        
      } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [loggedInEmail]);

  // Delete handler
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/spare_parts/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": loggedInEmail,
        },
      });
      
      if (response.ok) {
        alert("Item deleted successfully!");
        setParts(prevParts => prevParts.filter(part => part.id !== id));
        if (editingPart && editingPart.id === id) {
          setEditingPart(null);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Open update form
  const openUpdateForm = (part) => {
    setEditingPart(part);
    setUpdateForm({
      part_number: part.part_number || "",
      name: part.name || "",
      description: part.description || "",
      price: part.price || "",
      originalPrice: part.originalPrice || "",
      quantity_owned: part.quantity_owned || "",
      shopName: part.shopName || part.shop_name || "",
      shopLocation: part.shopLocation || "",
      image: null,
      imagePreview: part.image || "",
    });
  };

  // Handle form changes
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpdateForm(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  // Handle form submission
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingPart) return;
    
    try {
      const formData = new FormData();
      formData.append("part_number", updateForm.part_number);
      formData.append("name", updateForm.name);
      formData.append("description", updateForm.description);
      formData.append("price", updateForm.price);
      formData.append("originalPrice", updateForm.originalPrice || "");
      formData.append("quantity_owned", updateForm.quantity_owned);
      formData.append("shopName", updateForm.shopName);
      formData.append("shopLocation", updateForm.shopLocation || "");
      
      if (updateForm.image) {
        formData.append("image", updateForm.image);
      }
      
      const response = await fetch(
        `${API_BASE_URL}/api/update-part/${editingPart.id}`,
        {
          method: "PUT",
          headers: {
            "x-user-email": loggedInEmail,
          },
          body: formData,
        }
      );
      
      if (response.ok) {
        alert("Part updated successfully!");
        
        const updatedPart = {
          ...editingPart,
          ...updateForm,
          price: Number(updateForm.price),
          originalPrice: updateForm.originalPrice ? Number(updateForm.originalPrice) : null,
          quantity_owned: Number(updateForm.quantity_owned),
          image: updateForm.imagePreview || editingPart.image,
        };
        
        setParts(prevParts => 
          prevParts.map(part => 
            part.id === editingPart.id ? updatedPart : part
          )
        );
        setEditingPart(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to update part");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  // Filter parts based on search term
  const filteredParts = parts.filter(part => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase();
    const availability = part.quantity_owned === 0 ? "out of stock" :
                        part.quantity_owned <= 5 ? "limited stock" : "available";
    
    return (
      (part.part_number && part.part_number.toLowerCase().includes(search)) ||
      (part.name && part.name.toLowerCase().includes(search)) ||
      (part.description && part.description.toLowerCase().includes(search)) ||
      (part.shopName && part.shopName.toLowerCase().includes(search)) ||
      (part.shop_name && part.shop_name.toLowerCase().includes(search)) ||
      (part.price && part.price.toString().includes(search)) ||
      availability.includes(search)
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your parts...</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="home-container">
      <h1>📦 {userProfile ? `${userProfile.shop_name} Shopkeeper` : "Auto Spare Parts"}</h1>

      <button onClick={() => window.history.back()} className="back-button">
        ← Back
      </button>

      {userProfile && (
        <div className="profile-info">
          <p><strong>Name:</strong> {userProfile.name}</p>
          <p><strong>Shop Name:</strong> {userProfile.shop_name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Mobile Number:</strong> {userProfile.phone}</p>
        </div>
      )}

      <h1>📦 My Spare Parts ({parts.length})</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Search by part number, name, description, shop, price or availability..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </div>

      {filteredParts.length === 0 ? (
        <div className="empty-state">
          <p className="no-result">
            {searchTerm ? "No items found for your search." : "No parts available."}
          </p>
          {searchTerm && (
            <button 
              className="clear-filters-btn"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="parts-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Part Number</th>
                <th>Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Shop</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredParts.map((part, index) => (
                <tr key={part.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    <img
                      src={part.image || "/placeholder.jpg"}
                      alt={part.name}
                      className="table-image"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                        e.target.onerror = null;
                      }}
                    />
                  </td>
                  <td>{part.part_number || '-'}</td>
                  <td>{part.name}</td>
                  <td className="description-cell">
                    {part.description || "No description"}
                  </td>
                  <td>
                    ₹{part.price}
                    {part.originalPrice && part.originalPrice > part.price && (
                      <span className="strike-price"> (₹{part.originalPrice})</span>
                    )}
                  </td>
                  <td>{part.quantity_owned}</td>
                  <td>{part.shopName || part.shop_name || '-'}</td>
                  <td>
                    {part.quantity_owned === 0 ? (
                      <span className="out-of-stock">❌ Out of Stock</span>
                    ) : part.quantity_owned > 0 && part.quantity_owned <= 5 ? (
                      <span className="limited-stock">🟠 Limited Stock</span>
                    ) : part.shopLocation ? (
                      <a
                        href={part.shopLocation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="available-link"
                      >
                        🛒 Available
                      </a>
                    ) : (
                      <span className="available">✅ Available</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="update-btn"
                      onClick={() => openUpdateForm(part)}
                      style={{ marginRight: '8px' }}
                    >
                      ✏️ Update
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(part.id)}
                    >
                      ❌ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingPart && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Update Part: {editingPart.name}</h2>
            <form onSubmit={handleUpdateSubmit} className="update-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Part Number</label>
                  <input
                    type="text"
                    name="part_number"
                    value={updateForm.part_number}
                    onChange={handleUpdateChange}
                    placeholder="Part Number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Part Name</label>
                  <input
                    type="text"
                    name="name"
                    value={updateForm.name}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Part Name"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={updateForm.description}
                    onChange={handleUpdateChange}
                    placeholder="Description"
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={updateForm.price}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Price"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={updateForm.originalPrice}
                    onChange={handleUpdateChange}
                    placeholder="Original Price (optional)"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity_owned"
                    value={updateForm.quantity_owned}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Quantity Owned"
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    name="shopName"
                    value={updateForm.shopName}
                    onChange={handleUpdateChange}
                    placeholder="Shop Name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Shop Location URL</label>
                  <input
                    type="text"
                    name="shopLocation"
                    value={updateForm.shopLocation}
                    onChange={handleUpdateChange}
                    placeholder="Shop Location URL"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Part Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="file-input"
                  />
                  {updateForm.imagePreview && (
                    <div className="image-preview">
                      <img
                        src={updateForm.imagePreview}
                        alt="Preview"
                        className="preview-image"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setEditingPart(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}