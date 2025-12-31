'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../styles/home.css';

export default function MyItems() {
  const [parts, setParts] = useState([]);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
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

    fetch(`http://localhost:5000/api/my-parts/${loggedInEmail}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => setParts(data))
      .catch((err) => {
        console.error(err);
        alert('Failed to fetch your parts');
      });
  }, [loggedInEmail]);

  const handleDelete = async (id) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:5000/api/delete-part/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': loggedInEmail,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert('Item deleted successfully!');
        setParts(parts.filter((p) => p.id !== id));
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  return (
    <div className="home-container">
      <h1>📦 My Spare Parts</h1>
{/* 
      <button className="back-btn" onClick={() => router.push('/add-part')}>
        🔙 BACK
      </button> */}

      {parts.length === 0 ? (
        <p className="no-result">No items found. Go add some!</p>
      ) : (
        <div className="parts-grid">
          {parts.map((part, index) => (
            <div key={index} className="part-card">
              <img src={part.image} alt={part.name} className="part-image" />
              <h3>{part.name}</h3>
              <p>{part.description}</p>

              {/* ✅ Display Price and Original Price */}
              <p>
                <strong>Price:</strong> ₹{part.price}{' '}
                {part.originalPrice && (
                  <span
                    style={{
                      textDecoration: 'line-through',
                      color: 'gray',
                      marginLeft: '8px',
                    }}
                  >
                    ₹{part.originalPrice}
                  </span>
                )}
              </p>

              <p><strong>Shop:</strong> {part.shopName}</p>

              {/* ✅ Check availability */}
              {part.available ? (
                <a
                  href={part.shopLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shop-link-btn"
                >
                  🛒 Visit {part.shopName}
                </a>
              ) : (
                <p className="unavailable-text">❌ Currently Unavailable</p>
              )}

              <button
                className="delete-btn"
                onClick={() => handleDelete(part.id)}
              >
                ❌ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
