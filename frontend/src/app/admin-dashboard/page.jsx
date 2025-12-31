"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import AdminSidebar from "../../components/AdminSidebar";
import Dashboard from "./Dashboard";
import "../../styles/admin-dashboard.css";
import { 
  FiSearch, 
  FiTrash2, 
  FiEye,
  FiArrowLeft,
  FiDownload,
  FiFilter,
  FiRefreshCw
} from "react-icons/fi";
import { 
  MdOutlineInventory2, 
  MdStore, 
  MdPerson, 
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdAttachMoney
} from "react-icons/md";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loading, setLoading] = useState({ 
    users: true, 
    items: true, 
    general: true 
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    activeShops: 0,
    totalRevenue: 0
  });
  const [filter, setFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [deletedUserName, setDeletedUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setDeletedUserName("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const fetchAllData = async () => {
    setLoading({ users: true, items: true, general: true });
    
    try {
      const [usersRes, itemsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/users"),
        axios.get("http://localhost:5000/api/parts")
      ]);
      
      setUsers(usersRes.data);
      setItems(itemsRes.data);
      calculateStats(usersRes.data, itemsRes.data);
      setLoading({ users: false, items: false, general: false });
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading({ users: false, items: false, general: false });
    }
  };

  const calculateStats = (usersData, itemsData) => {
    const uniqueShops = new Set(usersData.map(u => u.shop_name).filter(Boolean));
    const totalRevenue = itemsData.reduce((sum, item) => sum + (item.price || 0), 0);
    
    setStats({
      totalUsers: usersData.length,
      totalItems: itemsData.length,
      activeShops: uniqueShops.size,
      totalRevenue: totalRevenue
    });
  };

  const handleDeleteUser = async (email, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${name}"  and all associated items? `
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${email}`);
      setUsers(prev => prev.filter(u => u.email !== email));
      setItems(prev => prev.filter(i => i.email !== email));
      setDeletedUserName(name);
      setShowSuccess(true);
    } catch (error) {
      alert("Error deleting user: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    const confirmDelete = window.confirm(
      `Delete "${itemName}"?`
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/parts/${itemId}`);
      setItems(prev => prev.filter(i => i.id !== itemId));
      alert("Item deleted successfully.");
    } catch (error) {
      alert("Error deleting item.");
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Calculate derived data FIRST
  const emailToShopName = users.reduce((acc, user) => {
    acc[user.email] = user.shop_name || "No Shop Name";
    return acc;
  }, {});

  const userEmailToTotalParts = {};
  items.forEach((item) => {
    if (item.email) {
      userEmailToTotalParts[item.email] = (userEmailToTotalParts[item.email] || 0) + 1;
    }
  });

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.shop_name?.toLowerCase().includes(s) ||
      u.phone?.toLowerCase().includes(s) ||
      u.gst_number?.toLowerCase().includes(s)
    );
  });

  const filteredItems = items.filter((item) => {
    const s = search.toLowerCase();
    const shop = emailToShopName[item.email] || "Unknown Shop";

    if (filter === "out-of-stock" && item.quantity_owned > 0) return false;
    if (filter === "limited-stock" && (item.quantity_owned === 0 || item.quantity_owned > 5)) return false;
    if (filter === "available" && item.quantity_owned <= 5) return false;

    return (
      item.name?.toLowerCase().includes(s) ||
      item.description?.toLowerCase().includes(s) ||
      item.part_number?.toLowerCase().includes(s) ||
      shop.toLowerCase().includes(s)
    );
  });

  // Now define sortedUsers AFTER filteredUsers
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const selectedUserParts = items.filter(
    (item) => item.email === selectedUser?.email
  );

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-dashboard">
      {/* Success Popup */}
      {showSuccess && (
        <div className="success-popup show">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h3>User Deleted Successfully!</h3>
            <p><strong>{deletedUserName}</strong> and all associated items have been removed from the system.</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
      )}

      <AdminSidebar setCurrentPage={setCurrentPage} />

      <div className="dashboard-content">
        {loading.general && currentPage === "dashboard" && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        )}

        {currentPage === "dashboard" && !loading.general && <Dashboard stats={stats} />}

        {/* User Profile Section */}
        {selectedUser && (
          <div className="profile-section">
            <div className="profile-header">
              <button className="back-btn" onClick={() => setSelectedUser(null)}>
                <FiArrowLeft /> Back to Users
              </button>
              <div className="header-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => exportToCSV(selectedUserParts, `user-${selectedUser.email}-parts`)}
                >
                  <FiDownload /> Export Parts
                </button>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-header-info">
                <div className="avatar">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2>{selectedUser.name}</h2>
                  <p className="user-email">
                    <MdEmail /> {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="profile-grid">
                <div className="profile-info-card">
                  <div className="info-item">
                    <MdPerson />
                    <div>
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{selectedUser.name}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <MdPhone />
                    <div>
                      <span className="info-label">Phone</span>
                      <span className="info-value">{selectedUser.phone || "Not provided"}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <MdStore />
                    <div>
                      <span className="info-label">Shop Name</span>
                      <span className="info-value">{selectedUser.shop_name || "No shop name"}</span>
                    </div>
                  </div>
                  
                  <div className="info-item location-item">
                    <MdLocationOn />
                    <div>
                      <span className="info-label">Location</span>
                      <div className="location-link-wrapper">
                        <a 
                          href="https://maps.app.goo.gl/rPQA2WxN8XorK5gj7" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="location-link-btn"
                        >
                          View on Google Maps
                        </a>
                        {selectedUser.shop_location && (
                          <div className="location-text">
                            {selectedUser.shop_location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="profile-stats-card">
                  <h3>User Statistics</h3>
                  <div className="stat-item">
                    <div className="stat-icon">
                      <MdOutlineInventory2 />
                    </div>
                    <div className="stat-details">
                      <span className="stat-value">{selectedUserParts.length}</span>
                      <span className="stat-label">Total Parts</span>
                    </div>
                  </div>
                  {/* <div className="stat-item">
                    <div className="stat-icon">
                      <MdAttachMoney />
                    </div>
                    <div className="stat-details">
                      <span className="stat-value">₹{
                        selectedUserParts.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()
                      }</span>
                      <span className="stat-label">Total Inventory Value</span>
                    </div>
                  </div> */}
                </div>
              </div>

              {/* User's Parts Table - HSN Code removed here too */}
              <div className="user-parts-section">
                <h3>User's Spare Parts</h3>
                
                {selectedUserParts.length === 0 ? (
                  <div className="empty-state">
                    <MdOutlineInventory2 className="empty-icon" />
                    <p>No parts uploaded by this user yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Image</th>
                          <th>Part Name</th>
                          <th>Part No.</th>
                          <th>Price</th>
                          <th>Qty</th>
                          <th>Description</th>
                          <th>GST</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserParts.map((item, idx) => (
                          <tr key={item.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <img
                                src={item.image || "/placeholder.jpg"}
                                alt={item.name}
                                className="table-image"
                                onError={(e) => {
                                  e.target.src = "/placeholder.jpg";
                                }}
                              />
                            </td>
                            <td className="part-name">{item.name}</td>
                            <td><code>{item.part_number}</code></td>
                            <td className="price-cell">₹{item.price}</td>
                            <td>
                              <span className={`quantity-badge ${
                                item.quantity_owned === 0 ? 'out-of-stock' :
                                item.quantity_owned <= 5 ? 'limited-stock' : 'available'
                              }`}>
                                {item.quantity_owned || 0}
                              </span>
                            </td>
                            <td className="description-cell">
                              {item.description || "No description"}
                            </td>
                            <td>{item.gst_rate || 18}%</td>
                            <td>
                              {item.quantity_owned === 0 ? (
                                <span className="status-badge out-of-stock">
                                  ❌ Out of Stock
                                </span>
                              ) : item.quantity_owned <= 5 ? (
                                <span className="status-badge limited-stock">
                                  ⚠ Limited Stock
                                </span>
                              ) : (
                                <span className="status-badge available">
                                  ✔ Available
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                title="Delete Item"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        {!selectedUser && currentPage === "users" && (
          <div className="page-container">
            <div className="page-header">
              <h2><MdPerson /> All Users ({users.length})</h2>
              <div className="header-actions">
                <div className="search-box">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, shop..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button 
                  className="btn-secondary"
                  onClick={() => exportToCSV(users, 'users-export')}
                  disabled={users.length === 0}
                >
                  <FiDownload /> Export CSV
                </button>
                <button 
                  className="btn-secondary"
                  onClick={fetchAllData}
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            {loading.users ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <p>No users found. {search && "Try a different search term."}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th onClick={() => handleSort('name')}>
                        Owner {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('email')}>
                        Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('shop_name')}>
                        Shop {sortConfig.key === 'shop_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Phone</th>
                      <th>GST</th>
                      <th>Total Parts</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u, index) => (
                      <tr key={u.id || u.email}>
                        <td>{index + 1}</td>
                        <td className="user-name-cell">
                          <div className="user-avatar-small">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <div className="shop-info">
                            <MdStore className="shop-icon" />
                            <span>{u.shop_name || "No shop"}</span>
                          </div>
                        </td>
                        <td>{u.phone || "Not provided"}</td>
                        <td><code>{u.gst_number || "N/A"}</code></td>
                        <td>
                          <span className="parts-count">
                            {userEmailToTotalParts[u.email] || 0}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn view-btn"
                              onClick={() => setSelectedUser(u)}
                              title="View Profile"
                            >
                              <FiEye />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteUser(u.email, u.name)}
                              title="Delete User"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Items List - HSN Code column removed here */}
        {!selectedUser && currentPage === "items" && (
          <div className="page-container">
            <div className="page-header">
              <h2><MdOutlineInventory2 /> All Items ({items.length})</h2>
              <div className="header-actions">
                <div className="search-box">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search parts by name, description, shop..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-dropdown">
                  <FiFilter />
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Items</option>
                    <option value="available">Available</option>
                    <option value="limited-stock">Limited Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
                <button 
                  className="btn-secondary"
                  onClick={() => exportToCSV(items, 'items-export')}
                  disabled={items.length === 0}
                >
                  <FiDownload /> Export CSV
                </button>
              </div>
            </div>

            {loading.items ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                <p>No items found. {search && "Try a different search term."}</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Image</th>
                      <th>Part</th>
                      <th>Part No.</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Shop</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, index) => {
                      const shop = emailToShopName[item.email];
                      return (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>
                            <img
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              className="table-image"
                              onError={(e) => {
                                e.target.src = "/placeholder.jpg";
                              }}
                            />
                          </td>
                          <td className="part-name">{item.name}</td>
                          <td><code>{item.part_number}</code></td>
                          <td className="price-cell">₹{item.price}</td>
                          <td>
                            <span className={`quantity-badge ${
                              item.quantity_owned === 0 ? 'out-of-stock' :
                              item.quantity_owned <= 5 ? 'limited-stock' : 'available'
                            }`}>
                              {item.quantity_owned || 0}
                            </span>
                          </td>
                          <td>
                            <div className="shop-info">
                              <MdStore className="shop-icon" />
                              <span>{shop}</span>
                            </div>
                          </td>
                          <td className="description-cell">
                            {item.description || "No description"}
                          </td>
                          <td>
                            {item.quantity_owned === 0 ? (
                              <span className="status-badge out-of-stock">
                                ❌ Out of Stock
                              </span>
                            ) : item.quantity_owned <= 5 ? (
                              <span className="status-badge limited-stock">
                                ⚠ Limited Stock
                              </span>
                            ) : (
                              <span className="status-badge available">
                                ✔ Available
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                title="Delete Item"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}