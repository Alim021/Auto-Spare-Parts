"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../../styles/home.css";
import "../../styles/myitems.css";

export default function MyPartsPage() {
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loggedInEmail, setLoggedInEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const router = useRouter();
  const API_BASE_URL = "https://auto-spare-parts.onrender.com";

  // Client-side mount check
  useEffect(() => {
    setMounted(true);
    
    // Email get karein
    const getEmail = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const emailFromParams = params.get("email");
        const emailFromStorage = localStorage.getItem("email");
        
        return emailFromParams || emailFromStorage;
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
    }
  }, [router]);

  // Data fetch
  useEffect(() => {
    if (!mounted || !loggedInEmail) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [userRes, partsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/shop_owners?email=${loggedInEmail}`),
          fetch(`${API_BASE_URL}/api/spare_parts?email=${loggedInEmail}`)
        ]);
        
        const userData = await userRes.json();
        const partsData = await partsRes.json();
        
        setUserProfile(userData[0] || null);
        setParts(Array.isArray(partsData) ? partsData : []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mounted, loggedInEmail]);

  // Delete function
  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/spare_parts/${id}`, {
        method: "DELETE",
        headers: { "x-user-email": loggedInEmail },
      });
      
      if (res.ok) {
        alert("Deleted!");
        setParts(prev => prev.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Filter
  const filteredParts = parts.filter(part => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      (part.name || "").toLowerCase().includes(search) ||
      (part.part_number || "").toLowerCase().includes(search) ||
      (part.description || "").toLowerCase().includes(search) ||
      (part.shopName || "").toLowerCase().includes(search)
    );
  });

  // Mount check
  if (!mounted) {
    return <div className="loading-state">Initializing...</div>;
  }

  // Loading
  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="home-container">
      <h1>📦 {userProfile ? `${userProfile.shop_name} Shopkeeper` : "My Parts"}</h1>
      
      <button onClick={() => router.back()} className="back-button">
        ← Back
      </button>
      
      {userProfile && (
        <div className="profile-info">
          <p><strong>Shop:</strong> {userProfile.shop_name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
        </div>
      )}
      
      <h2>📦 My Parts ({parts.length})</h2>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </div>
      
      {filteredParts.length === 0 ? (
        <div className="empty-state">
          <p>No parts found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="parts-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Part #</th>
                <th>Name</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Shop</th>
                <th>Status</th>
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
                    />
                  </td>
                  <td>{part.part_number || "-"}</td>
                  <td>{part.name}</td>
                  <td>₹{part.price}</td>
                  <td>{part.quantity_owned}</td>
                  <td>{part.shopName || part.shop_name || "-"}</td>
                  <td>
                    {part.quantity_owned === 0 ? "❌ Out" :
                     part.quantity_owned <= 5 ? "⚠️ Low" : "✅ In Stock"}
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(part.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}