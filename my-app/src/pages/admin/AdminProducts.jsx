// src/pages/admin/AdminProducts.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ── EDIT MODAL STATE ──
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // 1. FETCH ALL PRODUCTS
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data);
      } else {
        throw new Error(data.message || 'Failed to fetch sweets');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. DELETE SWEET HANDLER
  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`do you want to  "${name}" delete this product`);
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Delete failed');

      // State se product remove karo bina reload kiye
      setProducts((prev) => prev.filter((item) => item._id !== id));
      setMessage(`"${name}" deleted successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. OPEN EDIT MODAL
  const handleOpenEdit = (product) => {
    setCurrentEditItem({ ...product });
    setEditImagePreview(`${SERVER_HOST}${product.image}`);
    setEditImageFile(null);
    setEditModalOpen(true);
  };

  // 4. HANDLE EDIT IMAGE CHANGE
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  // 5. SUBMIT EDIT FORM
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const data = new FormData();
      data.append('name', currentEditItem.name);
      data.append('originRegion', currentEditItem.originRegion);
      data.append('price', currentEditItem.price);
      data.append('category', currentEditItem.category);
      data.append('description', currentEditItem.description || '');
      data.append('inStock', currentEditItem.inStock);

      if (editImageFile) {
        data.append('image', editImageFile);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/products/${currentEditItem._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Update failed');

      // State update
      setProducts((prev) =>
        prev.map((item) => (item._id === result.product._id ? result.product : item))
      );

      setMessage('🎉 Product updated successfully!');
      setEditModalOpen(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-heading" style={{ margin: 0 }}>🍬 All Sweets & Products</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Total Sweets Available: <b>{products.length}</b>
          </p>
        </div>
        <button onClick={() => navigate('/admin/add-product')} className="admin-primary-btn">
          + Add New Sweet
        </button>
      </div>

      {/* Notifications */}
      {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600 }}>{message}</div>}
      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      {/* Main Table */}
      <div className="admin-content-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading Sweets...</p>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>No sweet products found in database.</p>
            <button onClick={() => navigate('/admin/add-product')} className="admin-primary-btn" style={{ marginTop: '10px' }}>
              Add Your First Sweet
            </button>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Sweet Name</th>
                <th>Origin (Gaon/City)</th>
                <th>Category</th>
                <th>Price (₹)</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item._id}>
                  <td>
                    <img
                      src={`${SERVER_HOST}${item.image}`}
                      alt={item.name}
                      style={{ width: '50px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=Sweet'; }}
                    />
                  </td>
                  <td><b>{item.name}</b></td>
                  <td>{item.originRegion}</td>
                  <td><span className="badge badge-pending" style={{ textTransform: 'capitalize' }}>{item.category}</span></td>
                  <td><b>₹{item.price}</b></td>
                  <td>
                    <span className={`badge ${item.inStock ? 'badge-success' : 'badge-pending'}`}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        disabled={actionLoading}
                        style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── EDIT MODAL POPUP ── */}
      {editModalOpen && currentEditItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', width: '90%', maxWidth: '580px', borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>✏️ Edit Sweet Product</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="admin-form">
              <div className="form-group">
                <label>Sweet Name</label>
                <input
                  type="text"
                  value={currentEditItem.name}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Origin</label>
                  <input
                    type="text"
                    value={currentEditItem.originRegion}
                    onChange={(e) => setCurrentEditItem({ ...currentEditItem, originRegion: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={currentEditItem.price}
                    onChange={(e) => setCurrentEditItem({ ...currentEditItem, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={currentEditItem.category}
                    onChange={(e) => setCurrentEditItem({ ...currentEditItem, category: e.target.value })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="ladoo">Laddu</option>
                    <option value="peda">Peda</option>
                    <option value="petha">Petha</option>
                    <option value="halwa">Halwa</option>
                    <option value="barfi">Barfi</option>
                    <option value="special">Special</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Status</label>
                  <select
                    value={currentEditItem.inStock}
                    onChange={(e) => setCurrentEditItem({ ...currentEditItem, inStock: e.target.value === 'true' })}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  value={currentEditItem.description || ''}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, description: e.target.value })}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {/* Image Preview & Replacement */}
              <div className="form-group">
                <label>Product Image (Optional to change)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                  <img
                    src={editImagePreview}
                    alt="Preview"
                    style={{ width: '80px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <input type="file" accept="image/*" onChange={handleEditImageChange} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{ padding: '10px 18px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-primary-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Update Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;