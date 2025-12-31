'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/history.css';

export default function SalesHistory() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'month'
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      alert('Please login first!');
      router.push('/login');
      return;
    }
    
    fetchSalesHistory(email);
    fetchSalesStats(email);
  }, [router, filter]);

  const fetchSalesHistory = async (email) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/sales-history/${email}`);
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      } else {
        alert('Failed to fetch sales history');
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
      alert('Error loading sales history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesStats = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sales-stats/${email}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error);
    }
  };

  const filterSales = (sales) => {
    const now = new Date();
    let filtered = sales;

    // Date filtering
    switch (filter) {
      case 'today':
        filtered = sales.filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = sales.filter(sale => new Date(sale.sale_date) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = sales.filter(sale => new Date(sale.sale_date) >= monthAgo);
        break;
      default:
        filtered = sales;
    }

    // Search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.part_name.toLowerCase().includes(term) ||
        sale.part_number.toLowerCase().includes(term) ||
        sale.customer_name.toLowerCase().includes(term) ||
        sale.invoice_number.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const filteredSales = filterSales(sales);

  if (loading) {
    return (
      <div className="history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading sales history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>📊 Sales History</h1>
        <p>Track all your part sales and revenue</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.total_revenue || 0)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.total_items_sold || 0}</h3>
            <p>Items Sold</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧾</div>
          <div className="stat-info">
            <h3>{stats.total_sales || 0}</h3>
            <p>Total Sales</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.total_customers || 0}</h3>
            <p>Customers</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Time Period:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
        
        <div className="search-group">
          <input
            type="text"
            placeholder="🔍 Search by part, customer, or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="sales-table-container">
        {filteredSales.length === 0 ? (
          <div className="no-sales">
            <p>No sales records found</p>
            <p className="hint">Start selling parts to see your history here</p>
          </div>
        ) : (
          <>
            <div className="table-header">
              <h3>Recent Sales ({filteredSales.length})</h3>
            </div>
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Invoice No</th>
                  <th>Customer</th>
                  <th>Part Number</th>
                  <th>Part Name</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>GST Rate</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, index) => (
                  <tr key={sale.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                    <td>{formatDate(sale.sale_date)}</td>
                    <td className="invoice-number">{sale.invoice_number}</td>
                    <td className="customer-name">{sale.customer_name}</td>
                    <td className="part-number">{sale.part_number || '-'}</td>
                    <td className="part-name">{sale.part_name}</td>
                    <td className="quantity">{sale.quantity_sold}</td>
                    <td className="price">{formatCurrency(sale.selling_price)}</td>
                    <td className="gst-rate">{sale.gst_rate}%</td>
                    <td className="total-amount">{formatCurrency(sale.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Export Button */}
      {filteredSales.length > 0 && (
        <div className="export-section">
          <button 
            className="export-btn"
            onClick={() => alert('Export functionality coming soon!')}
          >
            📥 Export to Excel
          </button>
        </div>
      )}
    </div>
  );
}