'use client';

import { useState, useEffect, useRef } from "react";
import { 
  FiSearch, 
  FiShoppingBag, 
  FiMapPin, 
  FiPackage,
  FiRefreshCw,
  FiFilter,
  FiChevronDown,
  FiChevronUp
} from "react-icons/fi";
import { 
  MdStore, 
  MdAttachMoney, 
  MdInventory,
  MdLocationOn,
  MdDescription,
  MdExpandMore,
  MdExpandLess
} from "react-icons/md";
import "../styles/home.css";

export default function Home() {
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const intervalRef = useRef(null);

  // Function to fetch parts from backend
  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/all-parts");
      
      if (!res.ok) throw new Error("Failed to fetch parts");
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setParts(data);
        setError("");
      } else {
        throw new Error("Invalid data format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Couldn't load spare parts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
    
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchParts();
    }, 30000);
    
    return () => clearInterval(intervalRef.current);
  }, []);

  // Toggle description expansion
  const toggleDescription = (partId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [partId]: !prev[partId]
    }));
  };

  // Filter and sort parts
  const filteredParts = parts
    .filter((part) => {
      // Filter by availability
      if (filter === "available" && part.quantity_owned <= 5) return false;
      if (filter === "limited" && (part.quantity_owned === 0 || part.quantity_owned > 5)) return false;
      if (filter === "out-of-stock" && part.quantity_owned > 0) return false;

      // Search filter
      const search = searchTerm.toLowerCase();
      return (
        part.name.toLowerCase().includes(search) ||
        part.part_number?.toLowerCase().includes(search) ||
        part.description.toLowerCase().includes(search) ||
        part.shopName.toLowerCase().includes(search) ||
        part.price.toString().includes(search)
      );
    })
    .sort((a, b) => {
      // Sorting logic
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "quantity":
          return b.quantity_owned - a.quantity_owned;
        case "recent":
        default:
          return 0;
      }
    });

  // Get availability status
  const getAvailabilityStatus = (qty) => {
    if (qty === 0) return { text: "Out of Stock", color: "#dc2626", icon: "❌" };
    if (qty <= 5) return { text: "Limited Stock", color: "#d97706", icon: "⚠️" };
    return { text: "Available", color: "#059669", icon: "✅" };
  };

  // Format currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get total stats
  const stats = {
    total: parts.length,
    available: parts.filter(p => p.quantity_owned > 5).length,
    limited: parts.filter(p => p.quantity_owned > 0 && p.quantity_owned <= 5).length,
    outOfStock: parts.filter(p => p.quantity_owned === 0).length
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">
          <MdInventory /> Auto Spare Parts Hub
        </h1>
        <p className="hero-subtitle">
          Find genuine spare parts from trusted sellers across India
        </p>
      </div>

      {/* Quick Stats */}
      {/* <div className="quick-stats">
        <div className="stat-item">
          <FiPackage />
          <span>{stats.total} Total Parts</span>
        </div>
        <div className="stat-item">
          <FiShoppingBag style={{ color: '#059669' }} />
          <span>{stats.available} Available</span>
        </div>
        <div className="stat-item">
          <FiFilter style={{ color: '#d97706' }} />
          <span>{stats.limited} Limited</span>
        </div>
      </div> */}

      {/* Search and Filter Bar */}
      <div className="search-filter-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by part name, part number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          {/* <div className="filter-group">
            <FiFilter />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Items</option>
              <option value="available">Available</option>
              <option value="limited">Limited Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          
          <div className="filter-group">
            <FiPackage />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="recent">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="quantity">Quantity Available</option>
            </select>
          </div> */}
          
          {/* <button 
            className="refresh-btn"
            onClick={fetchParts}
            title="Refresh parts list"
          > Refresh 
            <FiRefreshCw />
          </button> */}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchParts} className="retry-btn">
            <FiRefreshCw /> Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading spare parts...</p>
        </div>
      ) : (
        <>
          {/* Results Summary */}
          {/* <div className="results-summary">
            <p>
              Showing <strong>{filteredParts.length}</strong> of <strong>{parts.length}</strong> parts
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div> */}

          {/* Parts Grid */}
          {filteredParts.length === 0 ? (
            <div className="empty-state">
              <MdInventory className="empty-icon" />
              <h3>No parts found</h3>
              <p>Try adjusting your search or filter criteria.</p>
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setFilter("all");
                  setSortBy("recent");
                }}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="parts-grid">
              {filteredParts.map((part) => {
                const availability = getAvailabilityStatus(part.quantity_owned);
                const isExpanded = expandedDescriptions[part.id || part._id];
                const hasLongDescription = part.description && part.description.length > 150;
                
                return (
                  <div key={part.id || part._id} className="part-card">
                    {/* Card Header with Availability */}
                    <div className="card-header">
                      <div className="availability-badge" style={{ backgroundColor: availability.color }}>
                        {availability.icon} {availability.text}
                      </div>
                      {part.part_number && (
                        <div className="part-number">
                          <code>#{part.part_number}</code>
                        </div>
                      )}
                    </div>

                    {/* Part Image */}
                    <div className="image-container">
                      <img
                        src={part.image || "/placeholder.jpg"}
                        alt={part.name}
                        className="part-image"
                        onError={(e) => {
                          e.target.src = "/placeholder.jpg";
                          e.target.onerror = null;
                        }}
                      />
                    </div>

                    {/* Card Body */}
                    <div className="card-body">
                      <h3 className="part-title">{part.name}</h3>
                      
                      {/* Description Section - FULL TEXT */}
                      <div className="description-section">
                        <div className="description-header">
                          {/* <MdDescription className="desc-icon" /> */}
                          {/* <strong>Description:</strong> */}
                        </div>
                        
                        <div className={`description-content ${isExpanded ? 'expanded' : ''}`}>
                          {part.description || "No description available"}
                        </div>
                        
                        {hasLongDescription && (
                          <button
                            className="expand-btn"
                            onClick={() => toggleDescription(part.id || part._id)}
                          >
                            {isExpanded ? (
                              <>
                                <MdExpandLess /> Show Less
                              </>
                            ) : (
                              <>
                                <MdExpandMore /> Read More
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Price Section */}
                      <div className="price-section">
                        {part.originalPrice && part.originalPrice > part.price ? (
                          <>
                            <div className="original-price">
                              {formatPrice(part.originalPrice)}
                            </div>
                            <div className="discounted-price">
                              {formatPrice(part.price)}
                            </div>
                            <div className="discount-badge">
                              {Math.round((1 - part.price / part.originalPrice) * 100)}% OFF
                            </div>
                          </>
                        ) : (
                          <div className="current-price">
                            {formatPrice(part.price)}
                          </div>
                        )}
                      </div>

                      {/* Shop Info */}
                      <div className="shop-info">
                        <div className="shop-name">
                          <MdStore /> {part.shopName}
                        </div>
                        <div className="stock-info">
                          <FiPackage /> {part.quantity_owned} in stock
                        </div>
                      </div>

                      {/* Location Button */}
                      {part.shopLocation && (
                        <a
                          href={part.shopLocation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="location-btn"
                        >
                          <MdLocationOn /> View Shop Location
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Note */}
          <div className="footer-note">
            <p>
              <strong>Note:</strong> Parts are auto-refreshed every 30 seconds. 
              Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}