'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiSearch, 
  FiTrash2, 
  FiEdit2, 
  FiEye, 
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiPlus,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { 
  MdInventory, 
  MdStore, 
  MdAttachMoney, 
  MdLocationOn,
  MdDescription
} from 'react-icons/md';
import '../styles/myitems.css';

export default function MyItems() {
  const [parts, setParts] = useState([]);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPart, setEditingPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    outOfStock: 0,
    limited: 0,
    totalValue: 0
  });
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const emailFromStorage = localStorage.getItem('email');
    if (!emailFromStorage) {
      alert('Please login first!');
      router.push('/login');
      return;
    }
    setLoggedInEmail(emailFromStorage);
  }, []);

  useEffect(() => {
    if (!loggedInEmail) return;
    fetchMyParts();
  }, [loggedInEmail]);

  const fetchMyParts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/my-parts/${loggedInEmail}`);
      if (!response.ok) throw new Error('Failed to fetch parts');
      const data = await response.json();
      setParts(data);
      calculateStats(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load your parts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items) => {
    const total = items.length;
    const available = items.filter(item => item.quantity_owned > 5).length;
    const limited = items.filter(item => item.quantity_owned > 0 && item.quantity_owned <= 5).length;
    const outOfStock = items.filter(item => item.quantity_owned === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity_owned), 0);
    
    setStats({ total, available, limited, outOfStock, totalValue });
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/delete-part/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': loggedInEmail },
      });

      if (res.ok) {
        alert('Item deleted successfully!');
        setParts(prev => prev.filter(p => p.id !== id));
        fetchMyParts(); // Refresh stats
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  const [updateForm, setUpdateForm] = useState({
    part_number: '',
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    quantity_owned: '',
    shopName: '',
    shopLocation: '',
    image: null,
    imagePreview: '',
  });

  const openUpdateForm = (part) => {
    setEditingPart(part);
    setUpdateForm({
      part_number: part.part_number || '',
      name: part.name,
      description: part.description,
      price: part.price,
      originalPrice: part.originalPrice,
      quantity_owned: part.quantity_owned,
      shopName: part.shopName,
      shopLocation: part.shopLocation,
      image: null,
      imagePreview: part.image,
    });
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpdateForm(prev => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingPart) return;

    const formData = new FormData();
    formData.append('part_number', updateForm.part_number);
    formData.append('name', updateForm.name);
    formData.append('description', updateForm.description);
    formData.append('price', updateForm.price);
    formData.append('originalPrice', updateForm.originalPrice);
    formData.append('quantity_owned', updateForm.quantity_owned);
    formData.append('shopName', updateForm.shopName);
    formData.append('shopLocation', updateForm.shopLocation);
    if (updateForm.image) {
      formData.append('image', updateForm.image);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/update-part/${editingPart.id}`, {
        method: 'PUT',
        headers: { 'x-user-email': loggedInEmail },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert('Part updated successfully!');
        
        const updatedParts = parts.map(p => 
          p.id === editingPart.id ? { ...p, ...updateForm } : p
        );
        setParts(updatedParts);
        setEditingPart(null);
        fetchMyParts(); // Refresh stats
      } else {
        alert(data.message || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredParts = parts.filter((part) => {
    const search = searchTerm.toLowerCase();
    
    if (filter === 'out-of-stock' && part.quantity_owned > 0) return false;
    if (filter === 'limited-stock' && (part.quantity_owned === 0 || part.quantity_owned > 5)) return false;
    if (filter === 'available' && part.quantity_owned <= 5) return false;

    return (
      part.part_number?.toLowerCase().includes(search) ||
      part.name.toLowerCase().includes(search) ||
      part.description.toLowerCase().includes(search) ||
      part.shopName.toLowerCase().includes(search) ||
      part.price.toString().includes(search) ||
      part.quantity_owned.toString().includes(search)
    );
  });

  const sortedParts = [...filteredParts].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParts = sortedParts.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    if (parts.length === 0) {
      alert('No data to export!');
      return;
    }

    const headers = ['Part Number', 'Name', 'Description', 'Price', 'Quantity', 'Shop Name', 'Status'];
    const rows = parts.map(part => [
      part.part_number || '',
      part.name,
      part.description,
      part.price,
      part.quantity_owned,
      part.shopName,
      part.quantity_owned === 0 ? 'Out of Stock' : 
      part.quantity_owned <= 5 ? 'Limited Stock' : 'Available'
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-parts-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your items...</p>
      </div>
    );
  }

  return (
    <div className="my-items-container">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <MdInventory /> My Spare Parts
          </h1>
          <p className="page-subtitle">
            Manage all your listed spare parts in one place
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => router.push('/add-part')}
          >
            <FiPlus /> Add New Part
          </button>
          <button 
            className="btn-secondary"
            onClick={fetchMyParts}
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-card">
          <div className="stat-icon">
            <MdInventory />
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Items</p>
          </div>
        </div>
        
        <div className="stat-card available-card">
          <div className="stat-icon">
            <FiEye />
          </div>
          <div className="stat-content">
            <h3>{stats.available}</h3>
            <p>Available</p>
          </div>
        </div>
        
        <div className="stat-card limited-card">
          <div className="stat-icon">
            <FiFilter />
          </div>
          <div className="stat-content">
            <h3>{stats.limited}</h3>
            <p>Limited Stock</p>
          </div>
        </div>
        
        <div className="stat-card outofstock-card">
          <div className="stat-icon">
            <FiTrash2 />
          </div>
          <div className="stat-content">
            <h3>{stats.outOfStock}</h3>
            <p>Out of Stock</p>
          </div>
        </div>
        
        <div className="stat-card value-card">
          <div className="stat-icon">
            <MdAttachMoney />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalValue)}</h3>
            <p>Total Inventory Value</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search parts by name, number, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-dropdown">
            <FiFilter />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Items</option>
              <option value="available">Available</option>
              <option value="limited-stock">Limited Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          
          <button 
            className="btn-secondary"
            onClick={exportToCSV}
            disabled={parts.length === 0}
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchMyParts} className="retry-btn">
            <FiRefreshCw /> Retry
          </button>
        </div>
      )}

      {/* Parts Table */}
      <div className="table-container">
        {sortedParts.length === 0 ? (
          <div className="empty-state">
            <MdInventory className="empty-icon" />
            <h3>No parts found</h3>
            <p>{searchTerm || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Start by adding your first spare part!'}</p>
            <button 
              className="btn-primary"
              onClick={() => router.push('/upload-parts')}
            >
              <FiPlus /> Add Your First Part
            </button>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="parts-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Image</th>
                    <th onClick={() => handleSort('part_number')}>
                      Part Number {sortConfig.key === 'part_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('name')}>
                      Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('description')}>
                      Description {sortConfig.key === 'description' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('price')}>
                      Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('quantity_owned')}>
                      Qty {sortConfig.key === 'quantity_owned' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('shopName')}>
                      Shop {sortConfig.key === 'shopName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedParts.map((part, index) => (
                    <tr key={part.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>
                        <img
                          src={part.image || '/placeholder.jpg'}
                          alt={part.name}
                          className="table-image"
                          onError={(e) => {
                            e.target.src = '/placeholder.jpg';
                            e.target.onerror = null;
                          }}
                        />
                      </td>
                      <td className="part-number-cell">
                        <code>{part.part_number || '-'}</code>
                      </td>
                      <td className="part-name-cell">
                        <strong>{part.name}</strong>
                      </td>
                      <td className="description-cell">
                        <MdDescription className="desc-icon" />
                        <span title={part.description}>
                          {part.description.length > 50 
                            ? `${part.description.substring(0, 50)}...`
                            : part.description
                          }
                        </span>
                      </td>
                      <td className="price-cell">
                        <div className="price-info">
                          <span className="selling-price">{formatCurrency(part.price)}</span>
                          {part.originalPrice && part.originalPrice > part.price && (
                            <span className="original-price">
                              {formatCurrency(part.originalPrice)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`quantity-badge ${
                          part.quantity_owned === 0 ? 'out-of-stock' :
                          part.quantity_owned <= 5 ? 'limited-stock' : 'available'
                        }`}>
                          {part.quantity_owned}
                        </span>
                      </td>
                      <td className="shop-cell">
                        <div className="shop-info">
                          <MdStore className="shop-icon" />
                          <div>
                            <div className="shop-name">{part.shopName}</div>
                            {part.shopLocation && (
                              <a 
                                href={part.shopLocation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="location-link"
                              >
                                <MdLocationOn /> View Location
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {part.quantity_owned === 0 ? (
                          <span className="status-badge out-of-stock">
                            ❌ Out of Stock
                          </span>
                        ) : part.quantity_owned <= 5 ? (
                          <span className="status-badge limited-stock">
                            ⚠ Limited Stock
                          </span>
                        ) : (
                          <span className="status-badge available">
                            ✔ Available
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => openUpdateForm(part)}
                            title="Edit Item"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(part.id, part.name)}
                            title="Delete Item"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft /> Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Update Modal */}
      {editingPart && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update Part: {editingPart.name}</h2>
              <button 
                className="close-btn"
                onClick={() => setEditingPart(null)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="update-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Part Number *</label>
                  <input
                    type="text"
                    name="part_number"
                    value={updateForm.part_number}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Enter part number"
                  />
                </div>
                
                <div className="form-group">
                  <label>Part Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={updateForm.name}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Enter part name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity_owned"
                    value={updateForm.quantity_owned}
                    onChange={handleUpdateChange}
                    required
                    min={0}
                    placeholder="Enter quantity"
                  />
                </div>
                
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={updateForm.price}
                    onChange={handleUpdateChange}
                    required
                    min={0}
                    step="0.01"
                    placeholder="Enter selling price"
                  />
                </div>
                
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={updateForm.originalPrice}
                    onChange={handleUpdateChange}
                    min={0}
                    step="0.01"
                    placeholder="Enter original price"
                  />
                </div>
                
                <div className="form-group">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    name="shopName"
                    value={updateForm.shopName}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Enter shop name"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Shop Location (Google Maps URL) *</label>
                  <input
                    type="url"
                    name="shopLocation"
                    value={updateForm.shopLocation}
                    onChange={handleUpdateChange}
                    required
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={updateForm.description}
                    onChange={handleUpdateChange}
                    required
                    placeholder="Enter detailed description"
                    rows={3}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Update Image (optional)</label>
                  <div className="image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    <div className="upload-label">
                      Choose new image
                    </div>
                  </div>
                  
                  {updateForm.imagePreview && (
                    <div className="image-preview-container">
                      <img
                        src={updateForm.imagePreview}
                        alt="Preview"
                        className="image-preview"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingPart(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}