'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import '../styles/navbar.css';

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const email = localStorage.getItem('email');
      setIsLoggedIn(!!email);
    };

    checkAuth();

    window.addEventListener('login-success', checkAuth);
    window.addEventListener('logout-success', checkAuth);

    return () => {
      window.removeEventListener('login-success', checkAuth);
      window.removeEventListener('logout-success', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('email');
    window.dispatchEvent(new Event('logout-success'));
    setIsLoggedIn(false);
    router.push('/home'); // ✅ go to clean home page
  };

  const isActive = (path) => pathname === path;
  const handleLinkClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-brand1">Auto Spare Parts</div>

        <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✖' : '☰'}
        </div>

        <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link
              href="/home"
              className={isActive("/home") ? "active" : ""}
              onClick={handleLinkClick}
            >
              Home
            </Link>
          </li>

          {/* ✅ USER NAVIGATION */}
          {isLoggedIn && (
            <>
              <li>
                <Link href="/profile"
                  className={isActive("/profile") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  My Account
                </Link>
              </li>
              
              <li>
                <Link
                  href="/add-part"
                  className={isActive("/add-part") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  ➕ Add Part
                </Link>
              </li>
              <li>
                <Link href="/my-items"
                  className={isActive("/my-items") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  My Items
                </Link>
              </li>
              {/* New Sell Button */}
              <li>
                <Link
                  href="/sales"
                  className={isActive("/sales") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  💰 Sales
                </Link>
              </li>
              <li>
              <Link
                href="/history"
                className={isActive("/history") ? "active" : ""}
                onClick={handleLinkClick}
              >
                📜 Sales History
              </Link>
            </li>

              
              <li>
                <button onClick={handleLogout} className="logout-btn">
                  🔓 Logout
                </button>
              </li>
            </>
          )}

          {/* ✅ GUEST NAVIGATION */}
          {!isLoggedIn && (
            <>
              <li>
                <Link
                  href="/login"
                  className={isActive("/login") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className={isActive("/register") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  href="/admin-login"
                  className={isActive("/admin-login") ? "active" : ""}
                  onClick={handleLinkClick}
                >
                  🔑 Admin Login
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
