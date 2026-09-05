// src/pages/admin/AdminOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// Audio Chime for new live orders
const playOrderChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.log('Audio autoplay waiting for user interaction:', err);
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'N/A';
  const diffSec = Math.floor((new Date() - d) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

// IST Date Helper
const isSameDayIST = (d1, d2) => {
  if (!d1 || !d2) return false;
  return new Date(d1).toLocaleDateString('en-IN') === new Date(d2).toLocaleDateString('en-IN');
};

// Pick a mithai-themed icon for a category/product name
const categoryIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('laddu') || n.includes('ladoo')) return '🟡';
  if (n.includes('barfi') || n.includes('burfi')) return '◻️';
  if (n.includes('halwa')) return '🟠';
  if (n.includes('gulab') || n.includes('jamun')) return '🟤';
  if (n.includes('peda')) return '🟨';
  if (n.includes('sandesh') || n.includes('rasgulla') || n.includes('rasmalai')) return '⚪';
  if (n.includes('cake')) return '🎂';
  if (n.includes('pastry')) return '🧁';
  if (n.includes('cookie') || n.includes('biscuit')) return '🍪';
  if (n.includes('chocolate')) return '🍫';
  if (n.includes('dry') || n.includes('namkeen')) return '🥜';
  return '🍬';
};

// Try every common shape an order's line-items might be stored under.
// Different backends name this differently, so we check a wide net defensively.
const extractOrderItems = (order) => {
  const raw =
    order.items || order.products || order.cartItems || order.orderItems ||
    order.cart || order.productList || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((it) => ({
    name:
      it.name || it.productName || it.title || it.itemName ||
      it.product?.name || 'Item',
    category:
      it.category || it.categoryName || it.type ||
      it.product?.category || null,
    quantity: Number(it.quantity || it.qty || it.count || 1) || 1,
  }));
};

/* ============================================================
   Lightweight, dependency-free SVG / DOM chart components.
   No extra npm packages needed — safe drop-in for any CRA/Vite build.
   ============================================================ */

// Smooth area + line chart for revenue trend
const RevenueTrendChart = ({ data }) => {
  const width = 560;
  const height = 230;
  const padding = { top: 18, right: 14, bottom: 30, left: 46 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(1, ...data.map((d) => d.revenue));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + innerH - (d.revenue / maxVal) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    `${linePath} L ${points[points.length - 1]?.x.toFixed(1) || padding.left} ${(padding.top + innerH).toFixed(1)} ` +
    `L ${points[0]?.x.toFixed(1) || padding.left} ${(padding.top + innerH).toFixed(1)} Z`;

  const [hoverIdx, setHoverIdx] = useState(null);

  return (
    <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8A2A1F" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#8A2A1F" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((f, idx) => {
          const y = padding.top + innerH * f;
          const val = Math.round(maxVal * (1 - f));
          return (
            <g key={idx}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#f0e6da" strokeWidth="1" />
              <text x={2} y={y + 4} fontSize="9.5" fill="#a89786">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#revenueFill)" />
        <path d={linePath} fill="none" stroke="#8A2A1F" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 5.5 : 3} fill="#C98A2C" stroke="#fff" strokeWidth="1.5" />
            <rect x={p.x - stepX / 2} y={padding.top} width={stepX || innerW} height={innerH} fill="transparent" onMouseEnter={() => setHoverIdx(i)} />
            <text x={p.x} y={height - 8} fontSize="10" textAnchor="middle" fill="#8a7a68">{p.label}</text>
          </g>
        ))}

        {hoverIdx !== null && points[hoverIdx] && (
          <g>
            <line x1={points[hoverIdx].x} x2={points[hoverIdx].x} y1={padding.top} y2={padding.top + innerH} stroke="#C98A2C" strokeDasharray="3 3" strokeWidth="1" />
            <rect x={Math.min(Math.max(points[hoverIdx].x - 48, 2), width - 100)} y={4} width="98" height="32" rx="6" fill="#2B2118" />
            <text x={Math.min(Math.max(points[hoverIdx].x, 51), width - 51)} y={18} fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff">
              ₹{points[hoverIdx].revenue.toLocaleString('en-IN')}
            </text>
            <text x={Math.min(Math.max(points[hoverIdx].x, 51), width - 51)} y={30} fontSize="8.5" textAnchor="middle" fill="#d8c9b8">
              {points[hoverIdx].orders} orders
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// Donut chart for order status breakdown
const OrderStatusDonut = ({ segments, total }) => {
  const size = 168;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3ece1" strokeWidth={stroke} />
        {total > 0 &&
          segments.filter((s) => s.value > 0).map((s, i) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const offset = circumference * 0.25 - cumulative * circumference;
            cumulative += fraction;
            return (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 0.4s ease' }} />
            );
          })}
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize="21" fontWeight="800" fill="#2B2118" fontFamily="Fraunces, Georgia, serif">
          {total}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" fontSize="9.5" fill="#8a7a68">Orders</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '140px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              <span style={{ color: '#4a3f33', fontWeight: 600 }}>{s.label}</span>
            </div>
            <span style={{ color: '#2B2118', fontWeight: 800 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Reusable horizontal ranked bar chart — used for category breakdown,
// top-selling items, and orders-by-city so the whole dashboard is graph-driven.
const RankedBarChart = ({ rows, valueLabel = '', showIcon = true, emptyText = 'No data yet.' }) => {
  if (!rows || rows.length === 0) {
    return <p style={{ textAlign: 'center', padding: '30px', color: '#8a7a68' }}>{emptyText}</p>;
  }
  const maxCount = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#3a2f24' }}>
              {showIcon && <span style={{ marginRight: '7px' }}>{r.icon || categoryIcon(r.label)}</span>}
              {r.label}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8A2A1F' }}>
              {r.value}{valueLabel}
            </span>
          </div>
          <div style={{ height: '9px', background: '#f3ece1', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(r.value / maxCount) * 100}%`,
                background: 'linear-gradient(90deg, #8A2A1F, #C98A2C)',
                borderRadius: '5px',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminOverview = () => {
  const navigate = useNavigate();

  // Real-time State
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [liveAlert, setLiveAlert] = useState(null);

  // Data States
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [cakesList, setCakesList] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [cakesCount, setCakesCount] = useState(0);
  const [inquiries, setInquiries] = useState([]);
  const [bulkEnquiries, setBulkEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch All Overview Data from Backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [ordersRes, usersRes, productsRes, cakesRes, inquiriesRes, bulkRes] = await Promise.allSettled([
        fetch(`${API_BASE}/orders`, { headers }),
        fetch(`${API_BASE}/auth/users`, { headers }),
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/cakes`),
        fetch(`${API_BASE}/contact`),
        fetch(`${API_BASE}/enquiry`)
      ]);

      // Orders
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const orderData = await ordersRes.value.json();
        if (Array.isArray(orderData)) setOrders(orderData);
      }

      // 🟢 Customers / Users
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const userData = await usersRes.value.json();
        if (userData.customers && Array.isArray(userData.customers)) {
          setCustomers(userData.customers);
        } else if (Array.isArray(userData)) {
          setCustomers(userData.filter((u) => u.role !== 'admin'));
        }
      }

      // Sweets Products
      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const prodData = await productsRes.value.json();
        if (Array.isArray(prodData)) {
          setProductsList(prodData);
          setProductsCount(prodData.length);
        }
      }

      // Cakes
      if (cakesRes.status === 'fulfilled' && cakesRes.value.ok) {
        const cakeData = await cakesRes.value.json();
        if (Array.isArray(cakeData)) {
          setCakesList(cakeData);
          setCakesCount(cakeData.length);
        }
      }

      // Inquiries
      if (inquiriesRes.status === 'fulfilled' && inquiriesRes.value.ok) {
        const inqData = await inquiriesRes.value.json();
        const list = inqData.data || (Array.isArray(inqData) ? inqData : []);
        setInquiries(list);
      }

      // Bulk Enquiries
      if (bulkRes.status === 'fulfilled' && bulkRes.value.ok) {
        const bulkData = await bulkRes.value.json();
        if (bulkData.success && Array.isArray(bulkData.data)) {
          setBulkEnquiries(bulkData.data);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Socket: Live Active Shoppers
    socket.on('online_users_count', (count) => {
      setOnlineUsers(count || 1);
    });

    // Socket: Real-time Order
    socket.on('new_order', (newOrder) => {
      playOrderChime();
      setOrders((prev) => [newOrder, ...prev]);
      setLiveAlert(`🔔 New Order! ₹${newOrder.totalAmount} from ${newOrder.customer?.name || 'Customer'}`);
      setTimeout(() => setLiveAlert(null), 6000);
    });

    // Socket: Real-time Bulk Enquiry
    socket.on('new_enquiry', (newEnq) => {
      setBulkEnquiries((prev) => [newEnq, ...prev]);
      setLiveAlert(`🎉 New Bulk Enquiry from ${newEnq.name} (${newEnq.quantity || 'Items'})`);
      setTimeout(() => setLiveAlert(null), 6000);
    });

    return () => {
      socket.off('online_users_count');
      socket.off('new_order');
      socket.off('new_enquiry');
    };
  }, []);

  // 2. Computed Analytics
  const totalRevenue = orders
    .filter((o) => (o.orderStatus || '').toLowerCase() !== 'cancelled')
    .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);

  const todayOrders = orders.filter((o) => {
    const oDate = o.createdAt || o.date || o.timestamp || o.orderDate;
    return isSameDayIST(oDate, new Date());
  });

  const todayRevenue = todayOrders
    .filter((o) => (o.orderStatus || '').toLowerCase() !== 'cancelled')
    .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);

  const todayNewCustomers = customers.filter((c) => isSameDayIST(c.createdAt, new Date())).length;

  const pendingOrders = orders.filter((o) =>
    ['placed', 'pending'].includes((o.orderStatus || '').toLowerCase())
  ).length;

  const deliveredOrders = orders.filter((o) =>
    (o.orderStatus || '').toLowerCase() === 'delivered'
  ).length;

  const confirmedOrders = orders.filter((o) =>
    (o.orderStatus || '').toLowerCase() === 'confirmed'
  ).length;

  const dispatchedOrders = orders.filter((o) =>
    (o.orderStatus || '').toLowerCase() === 'dispatched'
  ).length;

  const cancelledOrders = orders.filter((o) =>
    (o.orderStatus || '').toLowerCase() === 'cancelled'
  ).length;

  const nonCancelledCount = orders.length - cancelledOrders;
  const avgOrderValue = nonCancelledCount > 0 ? totalRevenue / nonCancelledCount : 0;

  const recentOrders = orders.slice(0, 6);
  const recentCustomers = customers.slice(0, 4);

  // Last 7 days revenue trend (for the analytics chart)
  const last7DaysData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayOrders = orders.filter((o) => {
        const oDate = o.createdAt || o.date || o.timestamp || o.orderDate;
        return isSameDayIST(oDate, d) && (o.orderStatus || '').toLowerCase() !== 'cancelled';
      });
      const revenue = dayOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      days.push({ label, revenue, orders: dayOrders.length });
    }
    return days;
  })();

  // Order status breakdown (for the donut chart) — bakery-brand palette
  const statusSegments = [
    { label: 'Delivered', value: deliveredOrders, color: '#4C7A52' },
    { label: 'Dispatched', value: dispatchedOrders, color: '#C98A2C' },
    { label: 'Confirmed', value: confirmedOrders, color: '#8A2A1F' },
    { label: 'Placed / Pending', value: pendingOrders, color: '#D9B65C' },
    { label: 'Cancelled', value: cancelledOrders, color: '#B5482A' },
  ];

  // 🍬 Category-wise catalog breakdown (Laddu, Barfi, Cakes, etc. — from the catalog itself)
  const categoryBreakdown = (() => {
    const map = {};
    [...productsList, ...cakesList].forEach((item) => {
      const cat = item.category || item.categoryName || item.type || item.subCategory || 'Uncategorised';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ label: name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  // 🏆 Top selling items — from ACTUAL orders (answers "laddu kitne order hue")
  const topSellingItems = (() => {
    const map = {};
    orders
      .filter((o) => (o.orderStatus || '').toLowerCase() !== 'cancelled')
      .forEach((o) => {
        extractOrderItems(o).forEach((it) => {
          map[it.name] = (map[it.name] || 0) + it.quantity;
        });
      });
    return Object.entries(map)
      .map(([name, qty]) => ({ label: name, value: qty }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  })();

  // 📍 Orders by city — answers "kitne order kaha se aaye"
  const ordersByCity = (() => {
    const map = {};
    orders.forEach((o) => {
      const city = o.customer?.city || o.city || o.shippingAddress?.city || o.address?.city || 'Unknown';
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map)
      .map(([city, count]) => ({ label: city, value: count, icon: '📍' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  const totalCatalog = productsCount + cakesCount;

  return (
    <div className="admin-overview-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        .admin-overview-container {
          padding: 26px 28px 40px;
          max-width: 1520px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #2B2118;
          background: #FBF7F1;
        }

        .admin-overview-container h1,
        .admin-overview-container h3,
        .admin-overview-container .stat-num {
          font-family: 'Fraunces', Georgia, serif;
        }

        /* ---------- Hero header band ---------- */
        .overview-header {
          background: linear-gradient(135deg, #6E1A15, #8A2A1F 55%, #A5391F);
          border-radius: 18px;
          padding: 26px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 26px;
          box-shadow: 0 10px 30px rgba(138, 42, 31, 0.22);
        }

        .overview-title h1 {
          font-size: 1.9rem;
          font-weight: 700;
          color: #FFF7EC;
          margin: 0;
          letter-spacing: 0.2px;
        }

        .overview-title p {
          color: #F0D9BE;
          font-size: 0.92rem;
          margin: 6px 0 0;
        }

        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .refresh-dash-btn {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.35);
          color: #FFF7EC;
          padding: 9px 18px;
          border-radius: 9px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-dash-btn:hover {
          background: rgba(255,255,255,0.22);
        }

        .live-status-pill {
          background: rgba(255,255,255,0.14);
          color: #FFF7EC;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(255,255,255,0.35);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #7CE29A;
          border-radius: 50%;
          animation: pulseAnim 1.8s infinite;
        }

        @keyframes pulseAnim {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }

        .live-toast-alert {
          background: linear-gradient(135deg, #C98A2C, #A9701E);
          color: #ffffff;
          padding: 14px 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(169, 112, 30, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ---------- Stat cards ---------- */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #FFFDF9;
          padding: 20px 22px;
          border-radius: 14px;
          border: 1px solid #EEE1CF;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(90, 60, 30, 0.08);
        }

        .stat-card h4 {
          margin: 0;
          font-size: 0.76rem;
          color: #8a7a68;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        .stat-num {
          font-size: 1.7rem;
          font-weight: 700;
          color: #2B2118;
          margin: 8px 0 4px;
        }

        .stat-green { color: #4C7A52; }
        .stat-amber { color: #C98A2C; }
        .stat-maroon { color: #8A2A1F; }
        .stat-blue { color: #4C6B8A; }
        .stat-purple { color: #7A4C8A; }
        .stat-teal { color: #2E7D74; }

        .stat-subtitle {
          font-size: 0.8rem;
          color: #8a7a68;
        }

        /* ---------- Chart section headers (eyebrow) ---------- */
        .section-eyebrow {
          font-size: 0.72rem;
          font-weight: 700;
          color: #C98A2C;
          margin: 0 0 8px 2px;
          letter-spacing: 0.3px;
        }

        /* ---------- Analytics grids ---------- */
        .analytics-charts-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .analytics-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        @media (max-width: 980px) {
          .analytics-charts-row { grid-template-columns: 1fr; }
          .analytics-two-col { grid-template-columns: 1fr; }
        }

        /* ---------- Split section ---------- */
        .dashboard-split-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 22px;
        }

        .panel-card {
          background: #FFFDF9;
          border-radius: 14px;
          padding: 22px;
          border: 1px solid #EEE1CF;
          margin-bottom: 22px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #2B2118;
        }

        .btn-view-all {
          color: #8A2A1F;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 700;
          background: #FBEDE2;
          padding: 6px 12px;
          border-radius: 7px;
          border: none;
          cursor: pointer;
        }

        .btn-view-all:hover {
          background: #F5DCC6;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }

        .dash-table th {
          background: #FBF3E9;
          padding: 10px 12px;
          text-align: left;
          color: #7a6a58;
          font-weight: 700;
          font-size: 0.75rem;
          border-bottom: 2px solid #EEE1CF;
        }

        .dash-table td {
          padding: 12px;
          border-bottom: 1px solid #f5ecdf;
          vertical-align: middle;
        }

        .dash-table tr:hover {
          background: #FBF3E9;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 9px;
          border-radius: 6px;
          font-size: 0.74rem;
          font-weight: 700;
        }

        .status-placed { background: #FBEFD0; color: #A9701E; }
        .status-confirmed { background: #F3E4DE; color: #8A2A1F; }
        .status-dispatched { background: #F6E9D2; color: #A9701E; }
        .status-delivered { background: #E3EEE1; color: #33552F; }
        .status-cancelled { background: #F6DFD6; color: #A0361F; }

        .pipeline-bar {
          display: flex;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
          background: #F0E5D6;
          margin: 16px 0 10px;
        }

        .pipeline-fill { height: 100%; }

        .customer-mini-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #FBF3E9;
          border-radius: 10px;
          margin-bottom: 8px;
          border: 1px solid #EEE1CF;
        }

        .c-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #F3E4DE;
          color: #8A2A1F;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
        }

        .quick-action-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: #FBF3E9;
          border-radius: 10px;
          margin-bottom: 10px;
          border: 1px solid #EEE1CF;
        }

        @media (max-width: 980px) {
          .dashboard-split-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="overview-header">
        <div className="overview-title">
          <h1>Store Overview</h1>
          <p>Real-time insights for Seedhe Gaon Se Sweets &amp; Bakery</p>
        </div>

        <div className="header-actions">
          <div className="live-status-pill">
            <span className="pulse-dot"></span> {onlineUsers} shopping now
          </div>
          <button className="refresh-dash-btn" onClick={fetchDashboardData}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Live Order Popup Toast */}
      {liveAlert && (
        <div className="live-toast-alert">
          <span>{liveAlert}</span>
          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              background: '#fff',
              color: '#A9701E',
              border: 'none',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            View Order
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="admin-stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #4C7A52' }}>
          <h4>LIVE ACTIVE SHOPPERS</h4>
          <p className="stat-num stat-green">{onlineUsers}</p>
          <span className="stat-subtitle">Browsing store right now</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #7A4C8A' }}>
          <h4>TOTAL CUSTOMERS</h4>
          <p className="stat-num stat-purple">{customers.length}</p>
          <span className="stat-subtitle">
            {todayNewCustomers > 0 ? `+${todayNewCustomers} joined today` : 'Registered accounts'}
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #C98A2C' }}>
          <h4>TOTAL REVENUE</h4>
          <p className="stat-num stat-amber">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <span className="stat-subtitle">Today's: ₹{todayRevenue.toLocaleString('en-IN')}</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #4C6B8A' }}>
          <h4>TOTAL ORDERS</h4>
          <p className="stat-num stat-blue">{orders.length}</p>
          <span className="stat-subtitle">
            {pendingOrders} pending • {deliveredOrders} delivered
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #2E7D74' }}>
          <h4>AVG ORDER VALUE</h4>
          <p className="stat-num stat-teal">₹{avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <span className="stat-subtitle">Across {nonCancelledCount} valid orders</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #8A2A1F' }}>
          <h4>TOTAL CATALOG ITEMS</h4>
          <p className="stat-num stat-maroon">{totalCatalog}</p>
          <span className="stat-subtitle">
            {productsCount} Sweets + {cakesCount} Cakes
          </span>
        </div>
      </div>

      {/* Row 1: Revenue Trend + Order Status Donut */}
      <p className="section-eyebrow">SALES ANALYTICS</p>
      <div className="analytics-charts-row">
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3>Revenue Trend</h3>
              <small style={{ color: '#8a7a68' }}>Last 7 days, non-cancelled orders</small>
            </div>
          </div>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#8a7a68' }}>No sales data yet to plot.</p>
          ) : (
            <RevenueTrendChart data={last7DaysData} />
          )}
        </div>

        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3>Order Status</h3>
              <small style={{ color: '#8a7a68' }}>Full pipeline breakdown</small>
            </div>
          </div>
          {orders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#8a7a68' }}>No orders to summarize yet.</p>
          ) : (
            <OrderStatusDonut segments={statusSegments} total={orders.length} />
          )}
        </div>
      </div>

      {/* Row 2: Top Selling Items (laddu/barfi/etc. by actual orders) + Orders by City */}
      <p className="section-eyebrow">WHAT'S SELLING &amp; WHERE FROM</p>
      <div className="analytics-two-col">
        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3>Top Selling Items</h3>
              <small style={{ color: '#8a7a68' }}>Units ordered, all-time (excludes cancelled)</small>
            </div>
          </div>
          <RankedBarChart
            rows={topSellingItems}
            valueLabel=" units"
            emptyText="No item-level order data found. Make sure each order stores a line-item list (e.g. order.items) with a product name."
          />
        </div>

        <div className="panel-card" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h3>Orders by City</h3>
              <small style={{ color: '#8a7a68' }}>Where your customers are ordering from</small>
            </div>
          </div>
          <RankedBarChart
            rows={ordersByCity}
            valueLabel=" orders"
            showIcon={true}
            emptyText="No city data found on orders yet."
          />
        </div>
      </div>

      {/* Row 3: Catalog by Category */}
      <p className="section-eyebrow">CATALOG</p>
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h3>Catalog by Category</h3>
            <small style={{ color: '#8a7a68' }}>Top categories across Sweets &amp; Cakes</small>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#8a7a68' }}>{totalCatalog} items total</span>
        </div>
        <RankedBarChart
          rows={categoryBreakdown}
          valueLabel=" items"
          emptyText="No category data found. Make sure products/cakes have a category field."
        />
      </div>

      {/* Split Layout: Orders on Left, Customers & Inquiries on Right */}
      <div className="dashboard-split-layout">

        {/* LEFT: Recent Orders Table */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3>Recent Orders</h3>
              <small style={{ color: '#8a7a68' }}>Latest customer purchases</small>
            </div>
            <button className="btn-view-all" onClick={() => navigate('/admin/orders')}>
              View All Orders ({orders.length}) ▶
            </button>
          </div>

          {orders.length > 0 && (
            <div>
              <div className="pipeline-bar">
                <div
                  className="pipeline-fill"
                  style={{ width: `${(deliveredOrders / orders.length) * 100}%`, background: '#4C7A52' }}
                  title="Delivered"
                />
                <div
                  className="pipeline-fill"
                  style={{ width: `${(pendingOrders / orders.length) * 100}%`, background: '#D9B65C' }}
                  title="Placed / Pending"
                />
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: '#8a7a68', marginBottom: '14px' }}>
                <span>🟢 Delivered ({deliveredOrders})</span>
                <span>🟡 Pending / Placed ({pendingOrders})</span>
                <span>🔴 Cancelled ({cancelledOrders})</span>
              </div>
            </div>
          )}

          <div className="table-responsive">
            {loading && orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#8a7a68' }}>Loading orders...</p>
            ) : recentOrders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '30px', color: '#8a7a68' }}>No orders placed yet.</p>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const st = (o.orderStatus || 'Placed').toLowerCase();
                    return (
                      <tr key={o._id}>
                        <td>
                          <strong>#{o._id.slice(-6).toUpperCase()}</strong>
                        </td>
                        <td>
                          {o.customer?.name || 'Customer'}
                          <div style={{ fontSize: '0.75rem', color: '#8a7a68' }}>
                            {o.customer?.city || 'Delhi NCR'}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: '#33552F' }}>
                            ₹{Number(o.totalAmount || 0).toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span className={`status-badge status-${st}`}>
                            {o.orderStatus || 'Placed'}
                          </span>
                        </td>
                        <td style={{ color: '#8a7a68', fontSize: '0.8rem' }}>
                          {formatTimeAgo(o.createdAt || o.date || o.timestamp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: Recent Registered Customers & Enquiries */}
        <div className="right-column">

          <div className="panel-card">
            <div className="panel-header">
              <h3>Recent Customers</h3>
              <span style={{ fontSize: '0.8rem', color: '#8a7a68' }}>
                {customers.length} total
              </span>
            </div>

            {customers.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#8a7a68' }}>No registered customers yet.</p>
            ) : (
              recentCustomers.map((c) => (
                <div key={c._id} className="customer-mini-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="c-avatar">
                      {(c.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#2B2118' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8a7a68' }}>
                        📞 {c.phone} • {c.city || 'India'}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#a89786', fontWeight: 600 }}>
                    {formatTimeAgo(c.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Inquiries & Bulk Enquiries */}
          <div className="panel-card">
            <div className="panel-header">
              <h3>Customer Enquiries</h3>
              <span style={{ fontSize: '0.8rem', color: '#8a7a68' }}>
                {inquiries.length + bulkEnquiries.length} total
              </span>
            </div>

            <div className="quick-action-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>💬</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2B2118' }}>
                    Contact Inquiries
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8a7a68' }}>
                    {inquiries.length} messages received
                  </div>
                </div>
              </div>
              <button
                className="btn-view-all"
                onClick={() => navigate('/admin/admincontact')}
              >
                View
              </button>
            </div>

            <div className="quick-action-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>🎉</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2B2118' }}>
                    Bulk / Catering Enquiries
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8a7a68' }}>
                    {bulkEnquiries.length} event leads
                  </div>
                </div>
              </div>
              <button
                className="btn-view-all"
                onClick={() => navigate('/admin/inquaries')}
              >
                View
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminOverview;