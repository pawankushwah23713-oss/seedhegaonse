// src/layouts/AdminLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    onLogout();
    navigate('/auth');
  };

  return (
    <div className="admin-wrapper">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2 className="admin-logo">👑 Admin Panel</h2>
          <span className="admin-store-tag">Seedhe Gaon Se</span>
        </div>

        <div className="admin-profile-badge">
          <div className="admin-avatar">{user?.name ? user.name[0].toUpperCase() : 'A'}</div>
          <div className="admin-info">
            <p className="admin-name">{user?.name || 'Administrator'}</p>
            <span className="admin-role-badge">Super Admin</span>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="admin-nav-links">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            📊 <span>Dashboard Overview</span>
          </NavLink>

          <NavLink 
            to="/admin/orders" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            📦 <span>Customer Orders</span>
          </NavLink>

          <NavLink 
            to="/admin/products" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            🍬 <span>Manage Sweets</span>
          </NavLink>

          <NavLink 
            to="/admin/add-product" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            ➕ <span>Add New Sweet</span>
          </NavLink>

          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            👥 <span>Registered Users</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-link live-store-btn" target="_blank">
            🌐 <span>View Live Store</span>
          </Link>

          <button onClick={handleAdminLogout} className="admin-link logout-btn">
            🚪 <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── RIGHT MAIN CONTENT (Pages will load here via Outlet) ── */}
      <main className="admin-main-viewport">
        {/* Top Header */}
        <header className="admin-topbar">
          <h3 className="topbar-title">Admin Management System</h3>
          <div className="topbar-right">
            <span className="status-indicator online"></span>
            <span>Server: Connected</span>
          </div>
        </header>

        {/* DYNAMIC SUB-PAGES LOAD HERE */}
        <div className="admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;