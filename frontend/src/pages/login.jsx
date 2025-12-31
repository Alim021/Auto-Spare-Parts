"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../styles/auth.css";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    forgotEmail: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shopkeeperName, setShopkeeperName] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (error) setError("");
    if (forgotError) setForgotError("");
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store email in localStorage
        localStorage.setItem("email", formData.email);
        
        // Remember email if checkbox is checked
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", formData.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

        window.dispatchEvent(new Event("login-success"));

        // Fetch profile to get shopkeeper name
        try {
          const profileRes = await fetch(`http://localhost:5000/api/shop_owners?email=${formData.email}`);
          const profileData = await profileRes.json();
          const name = profileData[0]?.name || formData.email.split("@")[0];
          setShopkeeperName(name);
        } catch (err) {
          console.error("Profile fetch error:", err);
          setShopkeeperName(formData.email.split("@")[0]);
        }

        setShowSuccess(true);

        // Navigate to home after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          router.push("/home");
        }, 2000);
      } else {
        setError(data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password submit
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setLoading(true);

    // Validation
    if (!formData.forgotEmail) {
      setForgotError("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.forgotEmail)) {
      setForgotError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!formData.newPassword) {
      setForgotError("Please enter a new password");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.newPassword)) {
      setForgotError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setForgotError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.forgotEmail,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setForgotSuccess("Password updated successfully! You can now login with your new password.");
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          forgotEmail: "",
          newPassword: "",
          confirmPassword: ""
        }));

        setTimeout(() => {
          setIsForgotMode(false);
          setForgotSuccess("");
        }, 3000);
      } else {
        setForgotError(data.message || "Failed to update password. Please try again.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setForgotError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsForgotMode(!isForgotMode);
    setError("");
    setForgotError("");
    setForgotSuccess("");
    setFormData({
      email: formData.email,
      password: "",
      forgotEmail: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  return (
    <div className="auth-container">
      {/* Success Popup */}
      {showSuccess && (
        <div className="success-popup show">
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h3>Login Successful!</h3>
            <p>Welcome back, <strong>{shopkeeperName}</strong>!</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
      )}

      <div className={`auth-card ${isForgotMode ? 'forgot-mode' : ''}`}>
        {!isForgotMode ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your shop owner account</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="input-group">
              {/* <label htmlFor="email">Email Address</label> */}
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              {/* <label htmlFor="password">Password</label> */}
              <div className="password-input">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.value)}
                  disabled={loading}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
              
              <button
                type="button"
                className="forgot-link"
                onClick={toggleMode}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

          
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleForgotSubmit}>
            <div className="form-header">
              <h2>Reset Password</h2>
              <p>Enter your email and new password</p>
            </div>

            {forgotError && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {forgotSuccess}
              </div>
            )}

            <div className="input-group">
              {/* <label htmlFor="forgotEmail">Email Address</label> */}
              <input
                id="forgotEmail"
                type="email"
                placeholder="Enter your registered email"
                value={formData.forgotEmail}
                onChange={(e) => handleInputChange('forgotEmail', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              {/* <label htmlFor="newPassword">New Password</label> */}
              <div className="password-input">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={loading}
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {/* <span className="password-hint">Must be at least 8 characters</span> */}
            </div>

            <div className="input-group">
              {/* <label htmlFor="confirmPassword">Confirm Password</label> */}
              <div className="password-input">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>

            <div className="form-footer">
              <button
                type="button"
                className="back-link"
                onClick={toggleMode}
                disabled={loading}
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}