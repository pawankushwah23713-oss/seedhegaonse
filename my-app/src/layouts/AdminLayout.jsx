// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAdminLogout = () => {
    onLogout();
    navigate('/auth');
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="admin-wrapper">
      {/* ── MOBILE BACKDROP OVERLAY ── */}
      <div 
        className={`admin-overlay ${isSidebarOpen ? 'show' : ''}`} 
        onClick={closeSidebar}
      />

      {/* ── LEFT SIDEBAR ── */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-header-title-row">
            <h2 className="admin-logo">👑 Admin Panel</h2>
            <button className="admin-close-btn" onClick={closeSidebar} aria-label="Close Sidebar">
              ✕
            </button>
          </div>
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
            onClick={closeSidebar}
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            📊 <span>Dashboard Overview</span>
          </NavLink>

          <NavLink 
            to="/admin/orders" 
            onClick={closeSidebar}
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            📦 <span>Customer Orders</span>
          </NavLink>

          <NavLink 
            to="/admin/products" 
            onClick={closeSidebar}
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            🍬 <span>Manage Sweets</span>
          </NavLink>

          <NavLink 
            to="/admin/add-product" 
            onClick={closeSidebar}
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            ➕ <span>Add New Sweet</span>
          </NavLink>

          
           <NavLink 
            to="/admin/admincontact" 
            onClick={closeSidebar}
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}
          >
            📧 <span>Customer Inquiries</span>
          </NavLink>

          
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-link live-store-btn" target="_blank" onClick={closeSidebar}>
            🌐 <span>Home</span>
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
          <div className="topbar-left">
            <button 
              className="admin-hamburger-btn" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle Menu"
            >
              ☰
            </button>
            <h3 className="topbar-title">Admin Management System</h3>
          </div>
          <div className="topbar-right">
            <span className="status-indicator online"></span>
            <span className="status-text">Server: Connected</span>
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