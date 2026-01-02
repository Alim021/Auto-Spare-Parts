"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/home.css";
import "../../styles/myitems.css";

export default function MyPartsPage() {
  const [parts, setParts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPart, setEditingPart] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    part_number: "",
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    quantity_owned: "",
    shopName: "",
    shopLocation: "",
    image: null,
    imagePreview: "",
  });

  const router = useRouter();

  // API URL
  const API_BASE_URL = "https://auto-spare-parts.onrender.com";

  useEffect(() => {
    // Email get karein without useSearchParams
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromParams = urlParams.get("email");
    const emailFromStorage = localStorage.getItem("email");

    if (emailFromParams) {
      setLoggedInEmail(emailFromParams);
    } else if (emailFromStorage) {
      setLoggedInEmail(emailFromStorage);
    } else {
      alert("Please login first!");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!loggedInEmail) return;

    setLoading(true);

    Promise.all([
      fetch(`${API_BASE_URL}/api/shop_owners?email=${loggedInEmail}`).then(
        (res) => {
          if (!res.ok) throw new Error("Failed to fetch user profile");
          return res.json();
        }
      ),
      fetch(`${API_BASE_URL}/api/spare_parts?email=${loggedInEmail}`).then(
        (res) => {
          if (!res.ok) throw new Error("Failed to fetch spare parts");
          return res.json();
        }
      ),
    ])
      .then(([userData, partsData]) => {
        setUserProfile(userData[0]);
        setParts(partsData);
      })
      .catch((err) => {
        console.error(err);
        alert(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loggedInEmail]);

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/spare_parts/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": loggedInEmail,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Item deleted successfully!");
        setParts(parts.filter((p) => p.id !== id));
        if (editingPart && editingPart.id === id) {
          setEditingPart(null);
        }
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

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

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpdateForm((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingPart) return;

    const formData = new FormData();
    formData.append("part_number", updateForm.part_number);
    formData.append("name", updateForm.name);
    formData.append("description", updateForm.description);
    formData.append("price", updateForm.price);
    formData.append("originalPrice", updateForm.originalPrice);
    formData.append("quantity_owned", updateForm.quantity_owned);
    formData.append("shopName", updateForm.shopName);
    formData.append("shopLocation", updateForm.shopLocation);
    if (updateForm.image) {
      formData.append("image", updateForm.image);
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/update-part/${editingPart.id}`,
        {
          method: "PUT",
          headers: {
            "x-user-email": loggedInEmail,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Part updated successfully!");

        const updatedPart = {
          ...editingPart,
          ...updateForm,
          price: Number(updateForm.price),
          originalPrice: Number(updateForm.originalPrice),
          quantity_owned: Number(updateForm.quantity_owned),
          image: updateForm.imagePreview || editingPart.image,
        };

        setParts(parts.map((p) => (p.id === editingPart.id ? updatedPart : p)));
        setEditingPart(null);
      } else {
        alert(data.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const filteredParts = parts.filter((part) => {
    const search = searchTerm.toLowerCase();

    const availability =
      part.quantity_owned === 0
        ? "out of stock"
        : part.quantity_owned <= 5
        ? "limited stock"
        : "available";

    return (
      (part.part_number?.toLowerCase().includes(search)) ||
      (part.name?.toLowerCase().includes(search)) ||
      (part.description?.toLowerCase().includes(search)) ||
      (part.shopName?.toLowerCase().includes(search) || part.shop_name?.toLowerCase().includes(search)) ||
      (part.price?.toString().includes(search)) ||
      availability.includes(search)
    );
  });

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

  return (
    <div className="home-container">
      <h1>📦 {userProfile ? `${userProfile.shop_name} Shopkeeper` : "Auto Spare Parts"}</h1>

      <button onClick={() => window.history.back()} className="back-button">
        ← Back
      </button>

      {userProfile && (
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            backgroundColor: "lightseagreen",
            color: "white",
            borderRadius: "8px",
          }}
        >
          <p><strong>Name:</strong> {userProfile.name}</p>
          <p><strong>Shop Name:</strong> {userProfile.shop_name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Mobile Number:</strong> {userProfile.phone}</p>
        </div>
      )}

      <h1>📦 My Spare Parts</h1>

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
          <p className="no-result">No items found. Try a different search!</p>
          <button 
            className="clear-filters-btn"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="parts-table">
            <thead>
              <tr>
                <th style={{ width: '10px' }}>#</th>
                <th style={{ width: '100px' }}>Image</th>
                <th style={{ width: '120px' }}>Part Number</th>
                <th style={{ width: '150px' }}>Name</th>
                <th style={{ width: '250px' }}>Description</th>
                <th style={{ width: '110px' }}>Price</th>
                <th style={{ width: '50px' }}>Qty</th>
                <th style={{ width: '150px' }}>Shop</th>
                <th style={{ width: '130px' }}>Availability</th>
                <th style={{ width: '100px' }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredParts.map((part, index) => (
                <tr key={part.id}>
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
                  <td className="description-cell">{part.description}</td>
                  <td>
                    ₹{part.price}{' '}
                    {part.originalPrice && part.originalPrice > part.price && (
                      <span className="strike-price">₹{part.originalPrice}</span>
                    )}
                  </td>
                  <td>{part.quantity_owned}</td>
                  <td>{part.shopName || part.shop_name || '-'}</td>
                  <td>
                    {part.quantity_owned === 0 ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>
                        ❌ Out of Stock
                      </span>
                    ) : part.quantity_owned > 0 && part.quantity_owned <= 5 ? (
                      <span style={{ color: 'orange', fontWeight: 'bold' }}>
                        🟠 Limited Stock
                      </span>
                    ) : (
                      part.shopLocation ? (
                        <a
                          href={part.shopLocation}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'green',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                          }}
                        >
                          🛒 Available
                        </a>
                      ) : (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>
                          ✅ Available
                        </span>
                      )
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
                    required
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
                    placeholder="Price"
                    required
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
                    placeholder="Quantity Owned"
                    required
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