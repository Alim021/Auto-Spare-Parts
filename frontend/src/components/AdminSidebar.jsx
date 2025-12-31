'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/admin-dashboard.css'; // or navbar.css if separated

export default function AdminNavbar({ setCurrentPage }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('email');
    setShowLogoutPopup(true);

    setTimeout(() => {
      router.push('/home');
    }, 2000); // 2-second delay before redirect
  };

  return (
    <>
      {showLogoutPopup && (
        <div className="success-popup">
          <p>Logout Successfully</p>
        </div>
      )}

      <nav className="navbar">
        <div className="admin-navbar">
          <div className="admin-navbar-title">Admin Panel</div>
          <ul className="admin-navbar-links">
            <li onClick={() => setCurrentPage("dashboard")}>Dashboard</li>
            <li onClick={() => setCurrentPage("users")}>All Users</li>
            <li onClick={() => setCurrentPage("items")}>All Items</li>
            <li onClick={handleLogout}>🔓 Logout</li>
          </ul>
        </div>
      </nav>
    </>
  );
}
