'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/profile.css';

export default function Profile() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalParts: 0, availableParts: 0, outOfStock: 0 });
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      alert("Please login first!");
      router.push("/login");
      return;
    }

    fetchUserProfile(email);
    fetchUserStats(email);
  }, [router]);

  const fetchUserProfile = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/shop_owners?email=${email}`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      if (data.length > 0) {
        setUserProfile(data[0]);
      } else {
        alert("User profile not found");
      }
    } catch (err) {
      console.error(err);
      alert("Could not load profile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/my-parts/${email}`);
      if (response.ok) {
        const parts = await response.json();
        const totalParts = parts.length;
        const availableParts = parts.filter(part => part.quantity_owned > 0).length;
        const outOfStock = parts.filter(part => part.quantity_owned === 0).length;
        
        setStats({ totalParts, availableParts, outOfStock });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleEdit = () => {
    router.push('/edit-profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('email');
    window.dispatchEvent(new Event('login-success'));
    router.push('/login');
  };

  const getGSTStatus = (gstNumber) => {
    return gstNumber ? 'Registered' : 'Not Registered';
  };

  const getGSTStatusColor = (gstNumber) => {
    return gstNumber ? 'status-registered' : 'status-not-registered';
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <h2>Profile Not Found</h2>
          <p>Unable to load your profile. Please try again.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="header-content">
          <div className="avatar-section">
            <div className="user-avatar">
              {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <h1>{userProfile.name}</h1>
              <p className="user-role">Shop Owner</p>
              <p className="user-email">{userProfile.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="edit-btn" onClick={handleEdit}>
              ✏️ Update Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-section">
        <h2>Shop Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{stats.totalParts}</h3>
              <p>Total Parts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats.availableParts}</h3>
              <p>Available</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>{stats.outOfStock}</h3>
              <p>Out of Stock</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏪</div>
            <div className="stat-info">
              <h3>1</h3>
              <p>Shop</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="profile-details">
        <div className="details-section">
          <h2>Personal Information</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Full Name</label>
              <div className="detail-value">{userProfile.name}</div>
            </div>
            <div className="detail-item">
              <label>Email Address</label>
              <div className="detail-value">{userProfile.email}</div>
            </div>
            <div className="detail-item">
              <label>Phone Number</label>
              <div className="detail-value">{userProfile.phone}</div>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h2>Shop Information</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Shop Name</label>
              <div className="detail-value">{userProfile.shop_name}</div>
            </div>
            <div className="detail-item full-width">
              <label>Shop Location</label>
              <div className="detail-value">{userProfile.shop_location}</div>
            </div>
          </div>
        </div>

        {/* GST Information */}
        <div className="details-section">
          <h2>GST Information</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>GST Status</label>
              <div className={`detail-value ${getGSTStatusColor(userProfile.gst_number)}`}>
                {getGSTStatus(userProfile.gst_number)}
              </div>
            </div>
            {userProfile.gst_number && (
              <div className="detail-item full-width">
                <label>GST Number</label>
                <div className="detail-value gst-number">
                  {userProfile.gst_number}
                </div>
              </div>
            )}
          </div>
          {!userProfile.gst_number && (
            <div className="gst-notice">
              <p>🚨 Your shop is not GST registered. Add your GST number to enable tax invoicing.</p>
              <button 
                className="add-gst-btn"
                onClick={() => router.push('/edit-profile?tab=gst')}
              >
                Add GST Number
              </button>
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="details-section">
          <h2>Account Information</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Member Since</label>
              <div className="detail-value">
                {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Not available'}
              </div>
            </div>
            <div className="detail-item">
              <label>Account Status</label>
              <div className="detail-value status-active">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => router.push('/add-part')}
          >
            <span className="action-icon">➕</span>
            <span>Add New Part</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => router.push('/my-items')}
          >
            <span className="action-icon">📋</span>
            <span>View My Parts</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => router.push('/sell')}
          >
            <span className="action-icon">💰</span>
            <span>Sales Parts</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => router.push('/history')}
          >
            <span className="action-icon">⚙️</span>
            <span> View Sales History</span>
          </button>
        </div>
      </div>
    </div>
  );
}