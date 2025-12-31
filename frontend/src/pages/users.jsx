"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
// import AdminSidebar from "../components/AdminSidebar"; // ✅ CORRECT RELATIVE PATH
import "../styles/admin-dashboard.css";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // ✅ Correct API call with /api prefix
  useEffect(() => {
    axios.get("http://localhost:5000/api/admin/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      {/* <AdminSidebar /> */}
      <div className="dashboard-content">
        <h2>All Users</h2>
        <input
          type="text"
          placeholder="🔍 Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Shop</th>
              <th>Location</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.shop_name}</td>
                <td>{u.shop_location}</td>
                <td>{u.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
