"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/auth.css';

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    shop_name: '',
    email: '',
    phone: '',
    shop_location: '',
    password: '',
    gst_number: ''  // New GST field
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Only allow digits for phone field
    if (name === 'phone') {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    // Convert GST number to uppercase
    if (name === 'gst_number') {
      setForm(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // GST number validation function
  const validateGST = (gstNumber) => {
    if (!gstNumber) return true; // GST is optional
    
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Shop name validation
    if (!form.shop_name.trim()) {
      newErrors.shop_name = 'Shop name is required';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Shop location validation
    if (!form.shop_location.trim()) {
      newErrors.shop_location = 'Shop location is required';
    }

    // Phone validation
    if (!form.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // GST number validation (optional but if provided, validate format)
    if (form.gst_number && !validateGST(form.gst_number)) {
      newErrors.gst_number = 'Please enter a valid GST number (15 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/login');
        }, 3000);
      } else {
        alert(data.message || "Registration failed. Please try again.");
      }

    } catch (error) {
      console.error('Registration error:', error);
      alert("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="auth-container">
      {/* Success Popup */}
      {showSuccess && (
        <div className="success-popup show">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h3>Registration Successful!</h3>
            <p>Welcome to our platform, <strong>{form.name}</strong>!</p>
            <p>Your shop <strong>"{form.shop_name}"</strong> has been registered.</p>
            <p>Redirecting to login page...</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
      )}

      <div className="auth-card">
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Register Your Shop</h2>
            <p>Create your shop owner account</p>
          </div>

          <div className="form-row">
            <div className="input-group">
              <input
                id="name"
                name="name"
                placeholder="Enter your full name *"
                onChange={handleChange}
                value={form.name}
                required
                disabled={loading}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="input-group">
              <input
                id="shop_name"
                name="shop_name"
                placeholder="Enter shop name *"
                onChange={handleChange}
                value={form.shop_name}
                required
                disabled={loading}
                className={errors.shop_name ? 'error' : ''}
              />
              {errors.shop_name && <span className="error-text">{errors.shop_name}</span>}
            </div>
          </div>

          <div className="input-group">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email *"
              onChange={handleChange}
              value={form.email}
              required
              disabled={loading}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter 10-digit phone number *"
              pattern="\d{10}"
              maxLength="10"
              onChange={handleChange}
              value={form.phone}
              required
              disabled={loading}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="input-group">
            <input
              id="shop_location"
              name="shop_location"
              placeholder="Enter shop address *"
              onChange={handleChange}
              value={form.shop_location}
              required
              disabled={loading}
              className={errors.shop_location ? 'error' : ''}
            />
            {errors.shop_location && <span className="error-text">{errors.shop_location}</span>}
          </div>

          <div className="input-group">
            <input
              id="gst_number"
              name="gst_number"
              placeholder="GST Number *"
              onChange={handleChange}
              value={form.gst_number}
              required
              disabled={loading}
              className={errors.gst_number ? 'error' : ''}
              maxLength="15"
            />
            {errors.gst_number && <span className="error-text">{errors.gst_number}</span>}
            {/* <span className="gst-hint">Format: 27ABCDE1234F1Z5 (15 characters)</span> */}
          </div>

          <div className="input-group">
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password *"
              onChange={handleChange}
              value={form.password}
              required
              disabled={loading}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            {/* <span className="password-hint">Must be at least 6 characters</span> */}
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating Account...
              </>
            ) : (
              'Register Shop'
            )}
          </button>

          <div className="form-footer">
            <p>Already have an account? <a href="/login">Sign in here</a></p>
          </div>
        </form>
      </div>
    </div>
  );
}