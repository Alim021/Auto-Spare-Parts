"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
// import AdminSidebar from "../components/AdminSidebar"; // ❌ Removed navbar
import "../styles/admin-dashboard.css";

export default function ItemsPage() {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/parts");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="admin-dashboard">
      {/* <AdminSidebar /> */}
      <div className="dashboard-content">
        <h2>All Spare Parts</h2>
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Brand</th>
              <th>Price</th>
              <th>Availability</th>
              <th>Owner Email</th>
            </tr>
          </thead>
          <tbody>
            {items.map((part) => (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>{part.brand}</td>
                <td>₹{part.price}</td>
                <td>{part.availability}</td>
                <td>{part.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
