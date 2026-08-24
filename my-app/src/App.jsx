// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ProfileInfo from './pages/ProfileInfo';
// Global Styles & Components
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import { UserRoute, AdminRoute } from './components/ProtectedRoutes';
import CheckoutShipping from './pages/CheckoutShipping';
// Normal Pages
import Homepage from './pages/Homepage';
import Auth from './pages/Auth';
import AboutUs from './pages/AboutUs';
import UserDashboard from './pages/UserDashboard';

// Admin Layout & Sub-Pages
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminAddProduct from './pages/admin/AdminAddProduct';
import MyOrders from './pages/MyOrders';
import ContactUs from "./pages/ContactUs";
import WhyChooseUs from './pages/WhyChooseUs';
import Wishlist from './pages/Wishlist';
import BestSellingProducts from './pages/BestSellingProducts';
import CorporateBulkOrders from './pages/CorporateBulkOrders';
import CouponLoyaltyPolicy from './pages/CouponLoyaltyPolicy';
import FeaturedProducts from './pages/FeaturedProducts';
import LatestProducts from './pages/LatestProducts';
import ProductList from './pages/ProductList';
import QualityPolicy from './pages/QualityPolicy';
import ReturnRefundPolicy from './pages/ReturnRefundPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import CancellationPolicy from './pages/CancellationPolicy';
import TopRatedProducts from "./pages/TopRatedProducts"
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdminInquiries from './pages/admincontact';


// Inner Wrapper: Hide Navbar/Footer on Admin screen
const AppContent = ({
  cartItems,
  cartOpen,
  setCartOpen,
  addedToast,
  currentUser,
  handleLogin,
  handleLogout,
  addToCart,
  removeFromCart,
  changeQty,
  cartCount,
  cartTotal
}) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App">
      {/* Show Navbar only on store pages (Hide on Admin) */}
      {!isAdminRoute && (
        <Navbar
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
          isLoggedIn={!!currentUser}
          userName={currentUser?.name || ''}
          userRole={currentUser?.role}
          onLogout={handleLogout}
        />
      )}

      {/* Main Application Routes */}
      <Routes>
        {/* Public Routes */}
        
        <Route
          path="/"
          element={<Homepage addToCart={addToCart} addedToast={addedToast} />}
        />
       
<Route path="/profile" element={<ProfileInfo onUserUpdated={handleLogin} onLogout={handleLogout} />} />

        <Route
          path="/auth"
          element={<Auth onLoginSuccess={handleLogin} />}
        />
        <Route
          path="/login"
          element={<Auth onLoginSuccess={handleLogin} />}
        />
          <Route
          path="/contact-us"
          element={< ContactUs />}
        />
          <Route path="/my-orders" element={<MyOrders />} /> {/* 🟢 NAYA ROUTE */}

           <Route
          path= "/why-us"
          element={<WhyChooseUs />}
        />

        <Route
          path="/AboutUs"
          element={<AboutUs />}
        />




        <Route
          path="/best-selling"
          element={<BestSellingProducts />}
        />
         <Route
          path="/top-rated"
          element={<TopRatedProducts />}
        />

         <Route
          path="/cancellation-policy"
          element={<CancellationPolicy />}
        />
        <Route
          path="/bulk-orders"
          element={<CorporateBulkOrders />}
        /><Route
          path="/loyalty-rewards"
          element={<CouponLoyaltyPolicy />}
        />
        <Route
          path="/featured"
          element={<FeaturedProducts />}
        />
        <Route
          path="/latest"
          element={<LatestProducts />}
        />

        <Route
          path="/productlist"
          element={<ProductList />}
        />
        <Route
          path="/quality-policy"
          element={<QualityPolicy/>}
        />
         <Route
          path="/return-refund"
          element={<ReturnRefundPolicy />}
        />
         <Route
          path="/shipping-policy"
          element={<ShippingPolicy />}
        />
         <Route
          path="/shipping-policy"
          element={<ShippingPolicy />}
        />
         <Route
          path="/terms"
          element={<TermsAndConditions />}
        />
         <Route
          path="/privacy"
          element={<PrivacyPolicy />}
        />
       <Route path="/checkout-shipping" element={<CheckoutShipping />} />
        



       <Route 
  path="/wishlist" 
  element={<Wishlist addToCart={addToCart} addedToast={addedToast} />} 
/>

        {/* User Protected Route */}
        <Route element={<UserRoute />}>
          <Route
            path="/dashboard"
            element={<UserDashboard user={currentUser} onLogout={handleLogout} />}
          />
        </Route>

        {/* Admin Protected Nested Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout user={currentUser} onLogout={handleLogout} />}>
            <Route index element={<AdminOverview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="add-product" element={<AdminAddProduct />} />
             <Route path="admincontact" element={<AdminInquiries />} />
           
          </Route>
        </Route>
      </Routes>

      {/* Show Drawer and Footer only on store pages */}
      {!isAdminRoute && (
        <>
          <CartDrawer
  isOpen={cartOpen}
  onClose={() => setCartOpen(false)}
  cartItems={cartItems}
  cartCount={cartCount}
  cartTotal={cartTotal}
  changeQty={changeQty}
  removeFromCart={removeFromCart}
  onOrderPlaced={() => setCartItems([])} // 🟢 Order hone par cart empty ho jayega
/>
          <Footer />
        </>
      )}
    </div>
  );
};

function App() {
  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(null);

  // Persistent Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const parsePrice = (priceStr) => parseFloat(String(priceStr).replace(/[₹,]/g, '')) || 0;

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, img: product.img, qty: 1 }];
    });
    setAddedToast(product.name);
    setTimeout(() => setAddedToast(null), 1800);
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const changeQty = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.qty * parsePrice(i.price), 0);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  return (
    <Router>
      <AppContent
        cartItems={cartItems}
        cartOpen={cartOpen}
        setCartOpen={setCartOpen}
        addedToast={addedToast}
        currentUser={currentUser}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
        changeQty={changeQty}
        cartCount={cartCount}
        cartTotal={cartTotal}
      />
    </Router>
  );
}

// ⚠️ YEH LINE MISSING THI JISKI WAJAH SE ERROR AA RAHA THA:
export default App;
// admin me mujhe ek home page and user sare show krane h or 