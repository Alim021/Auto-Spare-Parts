'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/editprofile.css';

export default function EditProfile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    shop_name: '',
    shop_location: '',
    gst_number: ''
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      alert("Please login first!");
      router.push("/login");
      return;
    }

    fetchUserProfile(email);
  }, [router]);

  const fetchUserProfile = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/shop_owners?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const userData = data[0];
          setProfile({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            shop_name: userData.shop_name || '',
            shop_location: userData.shop_location || '',
            gst_number: userData.gst_number || ''
          });
        }
      } else {
        alert("Failed to fetch profile data");
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert("Error loading profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!profile.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (profile.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!profile.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(profile.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Shop name validation
    if (!profile.shop_name.trim()) {
      newErrors.shop_name = 'Shop name is required';
    }

    // Shop location validation
    if (!profile.shop_location.trim()) {
      newErrors.shop_location = 'Shop location is required';
    }

    // GST number validation (optional but validate format if provided)
    if (profile.gst_number && !validateGSTNumber(profile.gst_number)) {
      newErrors.gst_number = 'Invalid GST number format (e.g., 27ABCDE1234F1Z5)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateGSTNumber = (gstNumber) => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const currentEmail = localStorage.getItem('email');

    try {
      const updateData = {
        ...profile,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      };

      const res = await fetch(`http://localhost:5000/api/update-profile/${currentEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
        
        // Update localStorage if email changed
        if (profile.email !== currentEmail) {
          localStorage.setItem('email', profile.email);
        }
        
        router.push('/profile');
      } else {
        alert(data.message || "Update failed.");
      }
    } catch (error) {
      console.error('Update error:', error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    const email = localStorage.getItem('email');

    try {
      const res = await fetch(`http://localhost:5000/api/update-profile/${email}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          shop_name: profile.shop_name,
          shop_location: profile.shop_location,
          gst_number: profile.gst_number
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Password updated successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setActiveTab('profile');
      } else {
        alert(data.message || "Password update failed.");
      }
    } catch (error) {
      console.error('Password update error:', error);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  if (loading && !profile.name) {
    return (
      <div className="edit-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <h1>✏️ Update Profile</h1>
        <p>Update your personal and shop information</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          🏪 Profile Details
        </button>
        <button 
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          🔒 Change Password
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form className="edit-profile-form" onSubmit={handleProfileSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={profile.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={profile.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter 10-digit phone number"
                  value={profile.phone}
                  onChange={handleChange}
                  maxLength="10"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Shop Information</h3>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="shop_name">Shop Name *</label>
                <input
                  id="shop_name"
                  type="text"
                  name="shop_name"
                  placeholder="Enter your shop name"
                  value={profile.shop_name}
                  onChange={handleChange}
                  className={errors.shop_name ? 'error' : ''}
                />
                {errors.shop_name && <span className="error-text">{errors.shop_name}</span>}
              </div>

              <div className="input-group full-width">
                <label htmlFor="shop_location">Shop Location *</label>
                <input
                  id="shop_location"
                  type="text"
                  name="shop_location"
                  placeholder="Enter complete shop address"
                  value={profile.shop_location}
                  onChange={handleChange}
                  className={errors.shop_location ? 'error' : ''}
                />
                {errors.shop_location && <span className="error-text">{errors.shop_location}</span>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>GST Information</h3>
            <div className="form-grid">
              <div className="input-group full-width">
                <label htmlFor="gst_number">GST Number</label>
                <input
                  id="gst_number"
                  type="text"
                  name="gst_number"
                  placeholder="Enter GST number (e.g., 27ABCDE1234F1Z5)"
                  value={profile.gst_number}
                  onChange={handleChange}
                  className={errors.gst_number ? 'error' : ''}
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.gst_number && <span className="error-text">{errors.gst_number}</span>}
                <span className="field-hint">15-character GSTIN (Optional)</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form className="edit-profile-form" onSubmit={handlePasswordSubmit}>
          <div className="form-section">
            <h3>Change Password</h3>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="currentPassword">Current Password *</label>
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={errors.currentPassword ? 'error' : ''}
                />
                {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="newPassword">New Password *</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={errors.newPassword ? 'error' : ''}
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
            <div className="password-requirements">
              <p>Password must be at least 6 characters long</p>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Updating...' : '🔒 Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}