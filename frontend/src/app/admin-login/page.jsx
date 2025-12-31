"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../styles/admin-login.css";

export default function AdminLogin() {
  const [isReady, setIsReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null; // 💥 Prevents hydration mismatch fully
  }

  const handleLogin = (e) => {
    e.preventDefault();

    if (email === "sayyad0022@gmail.com" && password === "963749") {
      localStorage.setItem("admin", "true");
      setShowSuccess(true);

      setTimeout(() => {
        router.push("/admin-dashboard");
      }, 2000);
    } else {
      setError("Invalid admin credentials");
      setShowSuccess(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="auth-container">
      {showSuccess && (
        <div className="success-popup">
          <p>
            <span className="success-icon">✅</span><br />
            Admin login successfully.<br />
            Welcome, Alim!
          </p>
        </div>
      )}

      <form className="auth-form">
        <h2>Admin Login</h2>

        {error && <p className="error">{error}</p>}

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          autoComplete="off"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="button-group">
          <button type="button" onClick={handleBack} className="back-button">
            Back
          </button>

          <button type="submit" onClick={handleLogin}>
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
