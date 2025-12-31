'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/sales.css';

export default function SellItem() {
  const [parts, setParts] = useState([]);
  const [loggedInEmail, setLoggedInEmail] = useState(null);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sellQuantities, setSellQuantities] = useState({});
  const [selectedParts, setSelectedParts] = useState([]);
  const [showBill, setShowBill] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstRate, setGstRate] = useState(18); // Default GST rate 18%
  
  const router = useRouter();

  // Check login
  useEffect(() => {
    const emailFromStorage = localStorage.getItem('email');
    if (!emailFromStorage) {
      alert('Please login first!');
      router.push('/login');
      return;
    }
    setLoggedInEmail(emailFromStorage);
  }, []);

  // Fetch shop info
  useEffect(() => {
    if (!loggedInEmail) return;
    fetch(`http://localhost:5000/api/shop_owners?email=${loggedInEmail}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setShopName(data[0].shop_name || 'My Shop');
          setShopAddress(data[0].shop_location || '');
          setShopPhone(data[0].phone || '');
          setGstNumber(data[0].gst_number || '');
        }
      })
      .catch(() => {
        setShopName('My Shop');
        setShopAddress('');
        setShopPhone('');
        setGstNumber('');
      });
  }, [loggedInEmail]);

  // Fetch parts
  useEffect(() => {
    if (!loggedInEmail) return;
    fetch(`http://localhost:5000/api/my-parts/${loggedInEmail}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => setParts(data))
      .catch(() => alert('Failed to fetch your parts'));
  }, [loggedInEmail]);

  const handleSellQuantityChange = (id, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      setSellQuantities((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSelectPart = (part) => {
    setSelectedParts((prev) => {
      if (prev.find((p) => p.id === part.id)) {
        return prev.filter((p) => p.id !== part.id);
      } else {
        return [...prev, part];
      }
    });
  };

  const handleGenerateBill = () => {
    if (selectedParts.length === 0) {
      alert('Please select at least one item to generate bill.');
      return;
    }
    setShowBill(true);
  };

  const calculateGSTBreakdown = (subtotal) => {
    const sgst = (subtotal * gstRate) / 200; // Half of total GST
    const cgst = (subtotal * gstRate) / 200; // Half of total GST
    const totalGst = sgst + cgst;
    const grandTotal = subtotal + totalGst;
    
    return {
      subtotal,
      sgst,
      cgst,
      totalGst,
      grandTotal
    };
  };

  const handleConfirmSell = async () => {
    if (!customerName.trim()) {
      alert('Please enter customer name before confirming bill.');
      return;
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    try {
      let successCount = 0;
      
      for (const part of selectedParts) {
        const sellQty = Number(sellQuantities[part.id] || 0);
        if (!sellQty || sellQty <= 0) continue;

        // 1. Update part quantity
        const updateRes = await fetch(`http://localhost:5000/api/sell-part/${part.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': loggedInEmail,
          },
          body: JSON.stringify({ sellQuantity: sellQty }),
        });

        if (updateRes.ok) {
          // 2. Record sale in history
          const subtotal = sellQty * part.price;
          const gstBreakdown = calculateGSTBreakdown(subtotal);
          
          await fetch('http://localhost:5000/api/record-sale', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              part_id: part.id,
              part_number: part.part_number,
              part_name: part.name,
              customer_name: customerName,
              quantity_sold: sellQty,
              selling_price: part.price,
              total_amount: gstBreakdown.grandTotal,
              gst_rate: gstRate,
              sgst_amount: gstBreakdown.sgst,
              cgst_amount: gstBreakdown.cgst,
              shop_email: loggedInEmail,
              invoice_number: invoiceNumber
            }),
          });
          
          successCount++;
        }
      }

      if (successCount > 0) {
        // Generate and download PDF
        generatePDF(invoiceNumber);
        
        alert(`✅ ${successCount} Confirm Sale!`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert('❌ Failed to complete the sale. Please try again.');
      }

    } catch (error) {
      console.error('Sale error:', error);
      alert('❌ Error completing sale. Please try again.');
    }
  };

  // Extract PDF generation to separate function
  const generatePDF = (invoiceNumber) => {
    const doc = new jsPDF();

    // Shop info (centered)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.setFontSize(22);
    const pageWidth = doc.internal.pageSize.getWidth();
    const shopNameText = shopName || 'My Shop';
    const shopAddressText = shopAddress || '';
    const shopPhoneText = shopPhone || '';
    
    doc.text(shopNameText, (pageWidth - doc.getTextWidth(shopNameText)) / 2, 15);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(shopAddressText, (pageWidth - doc.getTextWidth(shopAddressText)) / 2, 22);

    // GST Number
    if (gstNumber) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${gstNumber}`, (pageWidth - doc.getTextWidth(`GSTIN: ${gstNumber}`)) / 2, 28);
    }

    // Phone number
    const phoneStr = shopPhone.toString().trim();
    doc.setFont('helvetica', 'bold');
    doc.text('Phone: ' + phoneStr, (pageWidth - doc.getTextWidth('Phone: ' + phoneStr)) / 2, 34);

    // Customer, Date & Time
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    let hours = today.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutes = today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes();
    const timeStr = `${hours}:${minutes} ${ampm}`;

    doc.setFont('helvetica', 'bold');
    doc.text(`Customer: ${customerName}`, 14, 44);
    doc.text(`Date: ${dateStr}  Time: ${timeStr}`, 14, 50);
    doc.text(`Invoice No: ${invoiceNumber}`, 14, 56);

    // Bill type and GST rate
    doc.text(`Tax Invoice (B2C)`, pageWidth - 60, 44);
    doc.text(`GST Rate: ${gstRate}%`, pageWidth - 60, 50);

    // Table columns and rows
    const tableColumn = ['Part No', 'Part Name', 'Qty', 'Price', 'CGST', 'SGST', 'Total'];
    const tableRows = [];

    selectedParts.forEach((part) => {
      const qty = Number(sellQuantities[part.id] || 0);
      if (qty <= 0) return;
      const subtotal = qty * part.price;
      const gstBreakdown = calculateGSTBreakdown(subtotal);
      
      tableRows.push([
        part.part_number || '-',
        part.name,
        qty.toString(),
        '₹' + part.price.toString(),
        '₹' + gstBreakdown.cgst.toFixed(2),
        '₹' + gstBreakdown.sgst.toFixed(2),
        '₹' + gstBreakdown.grandTotal.toFixed(2),
      ]);
    });

    autoTable(doc, {
      startY: 62,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { cellPadding: 3, fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 }, // Part No
        1: { cellWidth: 30 }, // Name
        2: { cellWidth: 15 }, // Qty
        3: { cellWidth: 20 }, // Price
        4: { cellWidth: 20 }, // CGST
        5: { cellWidth: 20 }, // SGST
        6: { cellWidth: 25 }  // Total
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 70;

    // Calculate grand total
    const grandTotal = selectedParts.reduce((total, part) => {
      const qty = Number(sellQuantities[part.id] || 0);
      if (qty <= 0) return total;
      const subtotal = qty * part.price;
      const gstBreakdown = calculateGSTBreakdown(subtotal);
      return total + gstBreakdown.grandTotal;
    }, 0);

    // Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Grand Total:`, 120, finalY + 15);
    doc.text(`₹${grandTotal.toFixed(2)}`, pageWidth - 20, finalY + 15, { align: 'right' });

    // Amount in Words
    doc.setFontSize(9);
    doc.setTextColor(100);
    const amountInWords = convertToWords(grandTotal);
    doc.text(`Amount in Words: ${amountInWords}`, 14, finalY + 25);

    // Thank you message
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Thank you for your business!', 14, finalY + 35);

    // Terms and conditions
    doc.setFontSize(8);
    doc.setTextColor(255, 0, 0);
    const terms = [
      'Terms & Conditions:',
      '1. Goods once sold will not be taken back or exchanged.',
      '2. Warranty claims must be made with original invoice.',
      '3. All disputes subject to local jurisdiction only.'
    ];
    
    terms.forEach((term, index) => {
      doc.text(term, 14, finalY + 45 + (index * 4));
    });

    doc.save(`Invoice_${customerName}_${invoiceNumber}.pdf`);
  };

  // Function to convert number to words (for amount in words)
  const convertToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero Rupees';
    
    let n = ('0'.repeat(2 * 3 - (Math.floor(num).toString().length % 3)) + Math.floor(num)).match(/.{3}/g);
    let str = '';
    
    for (let i = 0; i < n.length; i++) {
      if (n[i] !== '000') {
        str += (function() {
          let x = '';
          if (Number(n[i][0]) !== 0) {
            x += a[Number(n[i][0])] + 'Hundred ';
          }
          if (Number(n[i].substr(1)) < 20) {
            x += a[Number(n[i].substr(1))];
          } else {
            x += b[Number(n[i][1])] + ' ' + a[Number(n[i][2])];
          }
          return x;
        })() + ['', 'Thousand ', 'Lakh ', 'Crore '][n.length - i - 1];
      }
    }
    
    return str.trim() + ' Rupees Only';
  };

  const filteredParts =
    searchTerm.trim() === ''
      ? []
      : parts.filter((part) => {
          const search = searchTerm.toLowerCase();
          return (
            part.part_number?.toLowerCase().includes(search) ||
            part.name.toLowerCase().includes(search) ||
            part.description.toLowerCase().includes(search) ||
            part.price.toString().includes(search)
          );
        });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (filteredParts.length === 0) return;
      const currentPart = filteredParts[highlightIndex];
      if (!currentPart) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < filteredParts.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredParts.length - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSellQuantities((prev) => {
          const currentQty = Number(prev[currentPart.id] || 0);
          const maxQty = currentPart.quantity_owned;
          return { ...prev, [currentPart.id]: currentQty < maxQty ? currentQty + 1 : maxQty };
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSellQuantities((prev) => {
          const currentQty = Number(prev[currentPart.id] || 0);
          return { ...prev, [currentPart.id]: currentQty > 0 ? currentQty - 1 : 0 };
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectPart(currentPart);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredParts, highlightIndex]);

  return (
    <div className="home-container">
      <h1> Sales My Spare Parts</h1>

      {/* GST Configuration */}
      <div className="gst-configuration">
        <div className="gst-input-group">
          <label htmlFor="gstNumber">GST Number:</label>
          <input
            id="gstNumber"
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder="Enter GSTIN (Optional)"
            className="gst-input"
          />
        </div>
        <div className="gst-input-group">
          <label htmlFor="gstRate">GST Rate (%):</label>
          <select
            id="gstRate"
            value={gstRate}
            onChange={(e) => setGstRate(Number(e.target.value))}
            className="gst-select"
          >
            <option value={0}>0% (Exempt)</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
            <option value={28}>28%</option>
          </select>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Search parts by name, Part number or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      </div>

      {filteredParts.length === 0 ? (
        searchTerm ? (
          <p className="no-result">No items found for "{searchTerm}".</p>
        ) : (
          <p className="hint-text">Type something to search your items...</p>
        )
      ) : (
        <div className="table-container">
          <table className="parts-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th style={{ width: '50px' }}>Select</th>
                <th style={{ width: '100px' }}>Image</th>
                <th style={{ width: '100px' }}>Part No</th>
                <th style={{ width: '150px' }}>Name</th>
                <th style={{ width: '250px' }}>Description</th>
                <th style={{ width: '100px' }}>Price</th>
                <th style={{ width: '50px' }}>Qty</th>
                <th style={{ width: '120px' }}>Availability</th>
                <th style={{ width: '70px' }}>Sell Qty</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part, index) => (
                <tr
                  key={part.id}
                  className={highlightIndex === index ? 'highlighted-row' : ''}
                >
                  <td>{index + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedParts.some((p) => p.id === part.id)}
                      onChange={() => handleSelectPart(part)}
                    />
                  </td>
                  <td>
                    <img
                      src={part.image}
                      alt={part.name}
                      className="table-image"
                      onError={(e) => (e.target.src = '/placeholder.jpg')}
                    />
                  </td>
                  <td>{part.part_number || '-'}</td>
                  <td>{part.name}</td>
                  <td>{part.description}</td>
                  <td>₹{part.price}</td>
                  <td>{part.quantity_owned}</td>
                  <td>
                    {part.quantity_owned === 0 ? (
                      <span style={{ color: 'red', fontWeight: 'bold' }}>❌ Out of Stock</span>
                    ) : part.quantity_owned <= 5 ? (
                      <span style={{ color: 'orange', fontWeight: 'bold' }}>🟠 Limited</span>
                    ) : (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>🛒 Available</span>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max={part.quantity_owned}
                      value={sellQuantities[part.id] || ''}
                      onChange={(e) => handleSellQuantityChange(part.id, e.target.value)}
                      placeholder="0"
                      style={{ width: '60px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedParts.length > 0 && !showBill && (
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button className="sell-btn" onClick={handleGenerateBill}>
                🧾 Generate Tax Invoice
              </button>
            </div>
          )}
        </div>
      )}

      {showBill && selectedParts.length > 0 && (
        <div className="bill-container">
          <h2>🧾 Tax Invoice Summary</h2>

          <div className="customer-input-container">
            <label htmlFor="customerName">Customer Name:</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name..."
              className="customer-input"
            />
          </div>

          <div className="gst-summary">
            <p><strong>GST Rate:</strong> {gstRate}% (SGST: {gstRate/2}% + CGST: {gstRate/2}%)</p>
            {gstNumber && <p><strong>GSTIN:</strong> {gstNumber}</p>}
          </div>

          <table className="bill-table">
            <thead>
              <tr>
                <th>Part No</th>
                <th>Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedParts.map((part) => {
                const qty = Number(sellQuantities[part.id] || 0);
                if (qty <= 0) return null;
                
                const subtotal = qty * part.price;
                const gstBreakdown = calculateGSTBreakdown(subtotal);
                
                return (
                  <tr key={part.id}>
                    <td>{part.part_number || '-'}</td>
                    <td>{part.name}</td>
                    <td>{qty}</td>
                    <td>₹{part.price}</td>
                    <td>₹{gstBreakdown.cgst.toFixed(2)}</td>
                    <td>₹{gstBreakdown.sgst.toFixed(2)}</td>
                    <td>₹{gstBreakdown.grandTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button
            className="confirm-btn"
            onClick={handleConfirmSell}
            disabled={!customerName.trim()}
          >
            ✅ Confirm, Sales & Download Invoice
          </button>
        </div>
      )}
    </div>
  );
}