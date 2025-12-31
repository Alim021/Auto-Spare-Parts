"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  FiUsers, 
  FiPackage, 
  FiShoppingBag, 
  FiDollarSign,
  FiTrendingUp,
  FiRefreshCw,
  FiCalendar
} from "react-icons/fi";
import { 
  MdPersonAdd, 
  MdInventory, 
  MdStore, 
  MdAttachMoney,
  MdShowChart
} from "react-icons/md";
import "../../styles/Dashboard.css";

export default function Dashboard({ stats }) {
  const [recentUsers, setRecentUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [currentRotationIndex, setCurrentRotationIndex] = useState(0);
  const [rotationInterval, setRotationInterval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all users
      const usersRes = await axios.get("http://localhost:5000/api/admin/users");
      const users = usersRes.data;

      // Store all users
      setAllUsers(users);

      // Sort users by creation date (newest first)
      const sortedUsers = [...users].sort((a, b) => {
        const dateA = new Date(a.created_at || a.id || 0);
        const dateB = new Date(b.created_at || b.id || 0);
        return dateB - dateA;
      });

      // Show only latest 5 users
      const latestUsers = sortedUsers.slice(0, 5);
      setRecentUsers(latestUsers);

      setError("");
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data. Please check your server connection.");
    } finally {
      setLoading(false);
    }
  };

  // Function to rotate through users (show different sets)
  const startUserRotation = () => {
    // Clear existing interval
    if (rotationInterval) {
      clearInterval(rotationInterval);
    }

    // Only start rotation if we have more than 5 users
    if (allUsers.length > 5) {
      const interval = setInterval(() => {
        setCurrentRotationIndex(prevIndex => {
          const nextIndex = (prevIndex + 5) % allUsers.length;
          
          // Get next 5 users for rotation
          const rotatedUsers = [];
          for (let i = 0; i < 5; i++) {
            const userIndex = (nextIndex + i) % allUsers.length;
            rotatedUsers.push(allUsers[userIndex]);
          }
          
          setRecentUsers(rotatedUsers);
          return nextIndex;
        });
      }, 15000); // Rotate every 15 seconds

      setRotationInterval(interval);
    }
  };

  // Function to show latest users (reset rotation)
  const showLatestUsers = () => {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      setRotationInterval(null);
    }
    
    // Sort users by creation date (newest first) and take only 5
    const sortedUsers = [...allUsers].sort((a, b) => {
      const dateA = new Date(a.created_at || a.id || 0);
      const dateB = new Date(b.created_at || b.id || 0);
      return dateB - dateA;
    }).slice(0, 5);
    
    setRecentUsers(sortedUsers);
    setCurrentRotationIndex(0);
  };

  // Function to show next set of users
  const showNextUsers = () => {
    if (allUsers.length <= 5) return;
    
    const nextIndex = (currentRotationIndex + 5) % allUsers.length;
    const rotatedUsers = [];
    
    for (let i = 0; i < 5; i++) {
      const userIndex = (nextIndex + i) % allUsers.length;
      rotatedUsers.push(allUsers[userIndex]);
    }
    
    setRecentUsers(rotatedUsers);
    setCurrentRotationIndex(nextIndex);
  };

  // Function to show previous set of users
  const showPreviousUsers = () => {
    if (allUsers.length <= 5) return;
    
    const prevIndex = currentRotationIndex - 5 < 0 
      ? allUsers.length - (5 - (currentRotationIndex % 5))
      : currentRotationIndex - 5;
    
    const rotatedUsers = [];
    
    for (let i = 0; i < 5; i++) {
      const userIndex = (prevIndex + i) % allUsers.length;
      rotatedUsers.push(allUsers[userIndex]);
    }
    
    setRecentUsers(rotatedUsers);
    setCurrentRotationIndex(prevIndex);
  };

  useEffect(() => {
    loadDashboard();
    
    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
  }, []);

  // Start rotation when allUsers is loaded
  useEffect(() => {
    if (allUsers.length > 5) {
      startUserRotation();
    }
    
    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
  }, [allUsers.length]);

  const formatNumber = (num) => {
    if (!num) return "₹0";
    if (num >= 1000000) return `₹${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch (e) {
      return "Recently";
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Prepare data for charts
  const barChartData = [
    { name: "Users", count: stats.totalUsers },
    { name: "Items", count: stats.totalItems },
  ];

  const pieChartData = [
    { name: "Shops", value: stats.activeShops },
    { name: "Individual Users", value: Math.max(0, stats.totalUsers - stats.activeShops) },
  ];

  const COLORS = ['#0088FE', '#00C49F'];

  // Calculate number of user sets for pagination
  const userSetsCount = Math.ceil(allUsers.length / 5);
  const currentSet = Math.floor(currentRotationIndex / 5) + 1;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
            Make sure your backend server is running on http://localhost:5000
          </p>
          <button onClick={loadDashboard} className="retry-btn">
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            <MdShowChart /> Dashboard Overview
          </h1>
          <p className="dashboard-subtitle">
            Real-time statistics from your application
          </p>
        </div>
        <div className="header-right">
          <button onClick={loadDashboard} className="refresh-btn">
            <FiRefreshCw /> Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards - Using props from parent */}
      <div className="stats-grid">
        <div className="stat-card users-card">
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalUsers}</h3>
            <span className="stat-label">Total Users</span>
            <div className="stat-subtext">
              Registered in your system
            </div>
          </div>
        </div>

        <div className="stat-card items-card">
          <div className="stat-icon">
            <FiPackage />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalItems}</h3>
            <span className="stat-label">Total Items</span>
            <div className="stat-subtext">
              Spare parts listed
            </div>
          </div>
        </div>

        <div className="stat-card shops-card">
          <div className="stat-icon">
            <MdStore />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.activeShops}</h3>
            <span className="stat-label">Active Shops</span>
            <div className="stat-subtext">
              {stats.totalUsers > 0 
                ? `${Math.round((stats.activeShops / stats.totalUsers) * 100)}% of users` 
                : "No users"}
            </div>
          </div>
        </div>

        {/* <div className="stat-card revenue-card">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{formatNumber(stats.totalRevenue)}</h3>
            <span className="stat-label">Total Inventory Value</span>
            <div className="stat-subtext">
              Combined value of all items
            </div>
          </div>
        </div> */}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Users vs Items Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <FiTrendingUp /> Users vs Items
            </h3>
            <span className="chart-subtitle">Real comparison from your data</span>
          </div>
          <div className="chart-container">
            {stats.totalUsers > 0 || stats.totalItems > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value}`, "Count"]}
                    labelStyle={{ color: '#333' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p>No data available for chart</p>
              </div>
            )}
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <MdShowChart /> User Distribution
            </h3>
            <span className="chart-subtitle">Shops vs Individual Users</span>
          </div>
          <div className="chart-container">
            {stats.totalUsers > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} users`, "Count"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p>No user data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users with Rotation */}
      <div className="activity-card">
        <div className="activity-header">
          <div className="activity-header-left">
            <h3 className="activity-title">
              <MdPersonAdd /> Recent Users
            </h3>
            <div className="activity-count-wrapper">
              <span className="activity-count">
                Showing 5 of {allUsers.length} users
              </span>
              {allUsers.length > 5 && (
                <span className="rotation-status">
                  • Auto-rotating every 15s
                </span>
              )}
            </div>
          </div>
          
          {/* Rotation Controls */}
          {allUsers.length > 5 && (
            <div className="rotation-controls">
              <div className="pagination-info">
                Set {currentSet} of {userSetsCount}
              </div>
              <div className="pagination-buttons">
                <button 
                  className="pagination-btn"
                  onClick={showPreviousUsers}
                  title="Previous 5 users"
                >
                  ←
                </button>
                <button 
                  className="pagination-btn latest-btn"
                  onClick={showLatestUsers}
                  title="Show latest users"
                >
                  <FiCalendar /> Latest
                </button>
                <button 
                  className="pagination-btn"
                  onClick={showNextUsers}
                  title="Next 5 users"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="activity-list">
          {recentUsers.length === 0 ? (
            <div className="empty-state">
              <p>No users found in the system</p>
            </div>
          ) : (
            <>
              {recentUsers.map((user, index) => (
                <div key={`${user.id || user.email}-${index}`} className="activity-item">
                  <div className="activity-avatar">
                    {getInitials(user.name)}
                  </div>
                  <div className="activity-info">
                    <div className="activity-main">
                      <strong className="activity-name">
                        {user.name || "Unnamed User"}
                      </strong>
                      <span className="activity-email">{user.email}</span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-shop">
                        {user.shop_name || "No shop specified"}
                      </span>
                      <span className="activity-time">
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* New User Badge - Show for users added in last 24 hours */}
                  {(() => {
                    try {
                      const userDate = new Date(user.created_at || user.id || 0);
                      const now = new Date();
                      const diffHours = Math.abs(now - userDate) / (1000 * 60 * 60);
                      
                      if (diffHours < 24) {
                        return (
                          <span className="new-user-badge">
                            NEW
                          </span>
                        );
                      }
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              ))}
              
              {/* Auto-rotation indicator - Only show if rotation is active */}
              {allUsers.length > 5 && rotationInterval && (
                <div className="rotation-indicator">
                  <div className="rotation-text">
                    <span className="rotation-icon">↻</span>
                    Next rotation in 15 seconds
                  </div>
                  <div className="rotation-progress">
                    <div className="rotation-progress-bar"></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}