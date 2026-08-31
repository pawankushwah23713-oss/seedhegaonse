// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ProfileInfo from './pages/ProfileInfo';
// Global Styles & Components
import './App.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import { UserRoute, AdminRoute } from './components/ProtectedRoutes';
import LadduPage from './pages/LadduPage';
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
import CakePage from './pages/CakePage';
import AdminMarketingManager from './pages/admin/AdminMarketingManager';
import  CheckoutPage from './pages/admin/Addpincharges'; // 🟢 NAYA COMPONENT
import AdminPincodeManager from './pages/admin/Addpincharges'; // 🟢 NAYA COMPONENT
import AdminAllInOneCakes from './pages/admin/AdminProducts';
import PedaPage from './pages/PedaPage';
import PethaPage from './pages/PethaPage';
import HalwaPage from './pages/HalwaPage';
import BarfiPage from './pages/BarfiPage';
import SpecialsPage from './pages/SpecialsPage';

import ChocolateTrufflePage from './pages/ChocolateTrufflePage';
import RedVelvetPage from './pages/RedVelvetPage';
import FreshFruitPage from './pages/FreshFruitPage';
import CheesecakePage from './pages/CheesecakePage';
import BentoCakePage from './pages/BentoCakePage';
import ButterscotchPage from './pages/ButterscotchPage';
import MyCoupons from './pages/MyCoupons';
import BulkEnquiry from './pages/bulkpage';
import AdminEnquiries from './pages/admin/AdminEnquiries';
// 🟢 Cart ko localStorage me save karne ki key
const CART_STORAGE_KEY = 'sgs_cart_items';

// 🟢 Page load par purana cart wapas load karo
const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Cart load error:', err);
    return [];
  }
};

// Inner Wrapper: Hide Navbar/Footer on Admin screen
const AppContent = ({
  cartItems,
  cartOpen,
  setCartOpen,
  setCartItems,
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

  // 🟢 SCROLL-TO-TOP FIX
  // Pehle jo issue tha: page reload/reopen karne par browser purani
  // scroll position yaad rakh ke wahin le jata tha (kabhi top se
  // khulta, kabhi beech se). Ye React Router route-change scroll ka
  // issue nahi tha — browser ka default "scrollRestoration" behavior
  // tha, jo index.html me disable kiya gaya hai. Ye effect ab sirf
  // route badalne par (aur pehle load pe) top pe le jata hai.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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


<Route path="/laddu" element={<LadduPage addToCart={addToCart} addedToast={addedToast} />} />
<Route 
  path="/peda" 
  element={<PedaPage addToCart={addToCart} addedToast={addedToast} />} 
/>

<Route 
  path="/petha" 
  element={<PethaPage addToCart={addToCart} addedToast={addedToast} />} 
/>
<Route path="/halwa" element={<HalwaPage addToCart={addToCart} addedToast={addedToast} />} />
<Route path="/barfi" element={<BarfiPage addToCart={addToCart} addedToast={addedToast} />} />
<Route path="/specials" element={<SpecialsPage addToCart={addToCart} addedToast={addedToast} />} />

 {/* 1. Main Home Cake Page */}
   

      {/* 2. Har Category ka Alag Dedicated Page aur Alag URL */}
{/* 🎂 Main Cake Page */}
        <Route path="/cakes" element={<CakePage addToCart={addToCart} addedToast={addedToast} />} />
        <Route path="/cake" element={<CakePage addToCart={addToCart} addedToast={addedToast} />} />

        {/* 🎂 Separate Category Cake Routes */}
        <Route path="/cakes/chocolate-truffle" element={<ChocolateTrufflePage addToCart={addToCart} addedToast={addedToast} />} />
        <Route path="/cakes/red-velvet" element={<RedVelvetPage addToCart={addToCart} addedToast={addedToast} />} />
        <Route path="/cakes/fresh-fruit" element={<FreshFruitPage addToCart={addToCart} addedToast={addedToast} />} />
        <Route path="/cakes/cheesecake" element={<CheesecakePage addToCart={addToCart} addedToast={addedToast} />} />
        <Route path="/cakes/bento-mini" element={<BentoCakePage addToCart={addToCart} addedToast={addedToast} />} />
        <Route path="/cakes/butterscotch" element={<ButterscotchPage addToCart={addToCart} addedToast={addedToast} />} />
       
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
       <Route path="/my-coupons" element={<MyCoupons />} />

         <Route
          path="/privacy"
          element={<PrivacyPolicy />}
        />
        <Route
           path="/cake"
          element={<CakePage addToCart={addToCart} addedToast={addedToast} />}
        />
         <Route
           path="/bulk-gifting"
          element={< BulkEnquiry />}
        />
 
        



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
              <Route path="inquaries" element={<AdminEnquiries />} />

            <Route path="herobanner" element={<AdminMarketingManager />} />
            <Route path="products" element={<AdminAllInOneCakes />} />
            <Route path="add-product" element={<AdminAddProduct />} />
             <Route path="admincontact" element={<AdminInquiries />} />

             <Route path="addpincharges" element={<AdminPincodeManager />} />
           
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
  // 🟢 Cart State — refresh ke baad bhi localStorage se wapas load hoga
  const [cartItems, setCartItems] = useState(loadCartFromStorage);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(null);

  // 🟢 Jab bhi cart badle, turant localStorage me save karo
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (err) {
      console.error('Cart save error:', err);
    }
  }, [cartItems]);

  // 🟢 Dusre tab me cart badla to yahan bhi sync ho jaye
  useEffect(() => {
    const syncCartAcrossTabs = (e) => {
      if (e.key !== CART_STORAGE_KEY) return;
      setCartItems(loadCartFromStorage());
    };
    window.addEventListener('storage', syncCartAcrossTabs);
    return () => window.removeEventListener('storage', syncCartAcrossTabs);
  }, []);

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
    const incomingQty = product.qty || product.quantity || 1;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + incomingQty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          productId: product.productId,
          name: product.name,
          variant: product.variant,
          price: product.price,
          unitPrice: product.unitPrice,
          img: product.img,
          originRegion: product.originRegion,
          qty: incomingQty
        }
      ];
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
        setCartItems={setCartItems}
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