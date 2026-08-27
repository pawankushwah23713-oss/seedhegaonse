import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const DELIVERY_ZONES = [
  { id: 'noida', name: 'Noida / Greater Noida', rate: 40, freeAbove: 999999, tag: '⚡ 2-4 Hours Delivery' },
  { id: 'delhi_ncr', name: 'Delhi / Gurgaon / Ghaziabad / Faridabad', rate: 50, freeAbove: 999999, tag: '🚚 Same / Next Day' },
  { id: 'north_india', name: 'Rest of UP / Haryana / Punjab / Rajasthan', rate: 70, freeAbove: 999999, tag: '📦 2-3 Days' },
  { id: 'rest_india', name: 'Rest of India', rate: 100, freeAbove: 999999, tag: '✈️ Express Air' }
];

// Fallback Store Milestones
const DEFAULT_STORE_MILESTONES = [
  { id: 'def-gift-1', title: 'Free 100g Desi Ghee Motichoor Ladoo Box', minSpend: 800, image: '' },
  { id: 'def-gift-2', title: 'Free 150g Traditional Mathura Peda Box', minSpend: 1500, image: '' },
  { id: 'def-gift-3', title: 'Free 250g Royal Silver Foil Kaju Katli Pack', minSpend: 3000, image: '' }
];

const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isTrueFlag = (val) => val === true || val === 'true' || val === 1 || val === '1';


const parseNumericPrice = (val) => {
  if (typeof val === 'number') return val;
  return parseFloat(String(val || 0).replace(/[₹,]/g, '').trim()) || 0;
};

// Helper to get JWT Token
const getAuthToken = () => {
  try {
    const directToken = localStorage.getItem('token') ||
                        localStorage.getItem('userToken') ||
                        localStorage.getItem('authToken');
    if (directToken) return directToken;

    const userObj = localStorage.getItem('user');
    if (userObj) {
      const parsed = JSON.parse(userObj);
      return parsed.token || parsed.jwt || null;
    }
  } catch (err) {
    console.error('Error reading auth token:', err);
  }
  return null;
};

// Helper to get current logged in user object
const getSavedUser = () => {
  try {
    const userObj = localStorage.getItem('user');
    if (userObj) return JSON.parse(userObj);
  } catch {
    return null;
  }
  return null;
};

const CartDrawer = ({ isOpen, onClose, cartItems, cartCount, cartTotal, changeQty, removeFromCart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'auth-required' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [serverMilestones, setServerMilestones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiRef, setUpiRef] = useState('');

  // 🚚 Shipping Mode Dropdown: 'delivery' (Home Delivery) | 'pickup' (Direct Store Pickup)
  const [shippingMode, setShippingMode] = useState('delivery');

  // 🚚 Pincode Delivery Charge States
  const [pincodeDeliveryCharge, setPincodeDeliveryCharge] = useState(null);
  const [pincodeStatusMsg, setPincodeStatusMsg] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // Prefill address if user profile is saved
  const savedUser = getSavedUser();
  const [addressData, setAddressData] = useState({
    name: savedUser?.name || '',
    phone: savedUser?.phone || savedUser?.mobile || '',
    email: savedUser?.email || '',
    address: savedUser?.address || '',
    city: savedUser?.city || '',
    state: savedUser?.state || 'Uttar Pradesh',
    pincode: savedUser?.pincode || ''
  });

  // 🟢 Pincode se Delivery Rate fetch karne ka function
  const fetchDeliveryChargeByPincode = async (pin) => {
    if (!pin || pin.length !== 6) return;
    setIsPincodeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/check-delivery-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: pin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPincodeDeliveryCharge(Number(data.deliveryCharge));
        if (data.city) {
          setAddressData((prev) => ({ ...prev, city: data.city }));
        }
        setPincodeStatusMsg(`✓ Delivery: ₹${data.deliveryCharge} (${data.city || 'Serviceable'})`);
        setError('');
      } else {
        setPincodeDeliveryCharge(null);
        setPincodeStatusMsg(`⚠️ ${data.message || 'Delivery not available on this pincode'}`);
      }
    } catch {
      setPincodeDeliveryCharge(null);
      setPincodeStatusMsg('⚠️ Unable to verify pincode delivery rate');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // Initial load par agar pincode already saved hai to rate check karein
  useEffect(() => {
    if (shippingMode === 'delivery' && addressData.pincode && addressData.pincode.length === 6) {
      fetchDeliveryChargeByPincode(addressData.pincode);
    }
  }, [shippingMode]);

  const handlePincodeChange = (e) => {
    const newPin = e.target.value.replace(/\D/g, ''); // Only digits
    setAddressData({ ...addressData, pincode: newPin });
    if (newPin.length === 6) {
      fetchDeliveryChargeByPincode(newPin);
    } else {
      setPincodeDeliveryCharge(null);
      setPincodeStatusMsg('');
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/gifts`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && d.length > 0 && setServerMilestones(d))
      .catch(() => {});
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep('cart'); setError(''); setLoading(false); }, 300);
  };

  // 🟢 1. REAL-TIME BULLETPROOF CART SUBTOTAL (Numeric)
  const effectiveCartTotal = cartItems.reduce((acc, item) => {
    const uPrice = parseNumericPrice(item.unitPrice || item.price);
    const q = Number(item.qty || item.quantity || 1);
    return acc + (uPrice * q);
  }, 0);

  // 💎 2. DYNAMIC BULK TIER CALCULATION
  let bulkDiscount = 0;
  let bulkDetails = '';

  const allCartBulkTiers = [];
  cartItems.forEach((item) => {
    const rawTiers = ensureArray(item.bulkTiers);
    if (rawTiers.length > 0) {
      rawTiers.forEach((b) => {
        if (Number(b.minSpend) > 0) {
          allCartBulkTiers.push({
            minSpend: Number(b.minSpend),
            discountValue: Number(b.discountValue || b.discountPercent || 0),
            discountType: b.discountType || 'percentage'
          });
        }
      });
    } else if (Number(item.highValueThreshold) > 0) {
      allCartBulkTiers.push({
        minSpend: Number(item.highValueThreshold),
        discountValue: Number(item.highValueDiscountPercent || 10),
        discountType: 'percentage'
      });
    }
  });

  const sortedBulkTiers = allCartBulkTiers.sort((a, b) => b.minSpend - a.minSpend);
  if (sortedBulkTiers.length > 0) {
    const activeTier = sortedBulkTiers.find((t) => effectiveCartTotal >= t.minSpend);
    if (activeTier) {
      const isFlat = activeTier.discountType === 'flat';
      bulkDiscount = isFlat ? activeTier.discountValue : Math.round((effectiveCartTotal * activeTier.discountValue) / 100);
      bulkDetails = `${activeTier.discountValue}% OFF on ₹${activeTier.minSpend.toLocaleString('en-IN')}+ spend`;
    }
  }

  // 🚚 3. MANDATORY DROPDOWN + PINCODE BASED SHIPPING CALCULATION
  const isFreeDelivery = cartItems.some((i) => isTrueFlag(i.isFreeDelivery));
  let shippingCharge = 0;

  if (shippingMode === 'pickup') {
    shippingCharge = 0; // Customer store se direct lega
  } else {
    // Home delivery par pincode charge apply hoga
    const activeDeliveryRate = pincodeDeliveryCharge !== null ? pincodeDeliveryCharge : 0;
    shippingCharge = isFreeDelivery ? 0 : activeDeliveryRate;
  }

  // Coupon & Grand Total
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const taxableAmount = Math.max(0, effectiveCartTotal - couponDiscount - bulkDiscount);
  const taxAmount = Math.round(taxableAmount * 0.05);
  const grandTotal = Math.max(0, taxableAmount + shippingCharge + taxAmount);

  // 🎁 4. DYNAMIC FREE GIFT ROADMAP AGGREGATOR
  const collectedGifts = [];
  cartItems.forEach((item) => {
    const rawGifts = ensureArray(item.giftTiers);
    rawGifts.forEach((g) => {
      if (g.giftTitle && Number(g.minSpend) > 0) {
        collectedGifts.push({
          id: `gift-${g.giftTitle}-${g.minSpend}`,
          title: g.giftTitle,
          minSpend: Number(g.minSpend),
          image: g.giftImage || item.img || ''
        });
      }
    });
  });

  serverMilestones.forEach((m) => {
    collectedGifts.push({
      id: `server-${m._id || m.title}`,
      title: m.title,
      minSpend: Number(m.minOrder || m.minSpend || 0),
      image: m.image || ''
    });
  });

  if (collectedGifts.length === 0) {
    DEFAULT_STORE_MILESTONES.forEach((d) => collectedGifts.push(d));
  }

  const uniqueMilestones = collectedGifts.filter(
    (v, i, a) => a.findIndex((t) => t.title.toLowerCase().trim() === v.title.toLowerCase().trim() && t.minSpend === v.minSpend) === i
  );
  const sortedRoadmapGifts = uniqueMilestones.sort((a, b) => a.minSpend - b.minSpend);

  // Single Active Unlocked Gift
  const allUnlockedGifts = sortedRoadmapGifts.filter((g) => effectiveCartTotal >= g.minSpend);
  const activeUnlockedGift = allUnlockedGifts.length > 0 ? allUnlockedGifts[allUnlockedGifts.length - 1] : null;
  const nextLockedGift = sortedRoadmapGifts.find((g) => effectiveCartTotal < g.minSpend);
  const progressPercent = nextLockedGift
    ? Math.min(100, Math.round((effectiveCartTotal / nextLockedGift.minSpend) * 100))
    : 100;

  // 🟢 Handle Proceed To Checkout With Auth & Pincode Verification
  const handleProceedToCheckout = () => {
    if (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) {
      alert('Kripya apna 6-digit Pincode daalein taaki delivery charges decide ho sakein!');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setStep('auth-required');
      return;
    }
    setStep('checkout');
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponMsg({ text: 'Enter coupon code', type: 'error' });
    const upper = couponCode.trim().toUpperCase();

    for (const item of cartItems) {
      const coupons = ensureArray(item.couponsList);
      const matched = coupons.find((c) => c.code?.toUpperCase() === upper);
      if (matched) {
        const discVal = Number(matched.discountValue);
        const finalDisc = matched.discountType === 'percentage' ? Math.round((effectiveCartTotal * discVal) / 100) : discVal;
        setAppliedCoupon({ code: matched.code, discount: finalDisc });
        return setCouponMsg({ text: `🎉 Product coupon ${matched.code} applied!`, type: 'success' });
      }
    }

    try {
      const res = await fetch(`${API_BASE}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: effectiveCartTotal })
      });
      const data = await res.json();
      if (!res.ok) return setCouponMsg({ text: data.message || 'Invalid coupon', type: 'error' });
      setAppliedCoupon({ code: data.code, discount: data.discount });
      setCouponMsg({ text: data.message, type: 'success' });
    } catch {
      setCouponMsg({ text: 'Verification error', type: 'error' });
    }
  };

  // 🟢 Place Order (Pure Numbers & Clean Schema Formatted)
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) {
      setError('Valid Pincode daalna zaroori hai jahan delivery available ho.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setStep('auth-required');
      return;
    }

    setLoading(true);
    try {
      const formattedCartItems = cartItems.map((item, idx) => {
        const numPrice = parseNumericPrice(item.unitPrice || item.price);
        const quantity = Number(item.qty || item.quantity || 1);
        return {
          id: String(item.id || item.productId || `item-${idx}`),
          productId: item.productId || item.id || undefined,
          name: String(item.name || 'Sweet Item'),
          variant: String(item.variant || 'Standard'),
          price: numPrice,
          unitPrice: numPrice,
          qty: quantity,
          quantity: quantity,
          totalPrice: numPrice * quantity,
          img: String(item.img || ''),
          isFreeDelivery: Boolean(item.isFreeDelivery)
        };
      });

      if (activeUnlockedGift) {
        formattedCartItems.push({
          id: `gift-${Date.now()}`,
          productId: String(activeUnlockedGift.id || 'free-gift-item'),
          name: `🎁 [FREE GIFT] ${activeUnlockedGift.title}`,
          variant: 'Complimentary Gift',
          price: 0,
          unitPrice: 0,
          qty: 1,
          quantity: 1,
          totalPrice: 0,
          img: String(activeUnlockedGift.image || ''),
          isFreeGift: true
        });
      }

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer: addressData,
          deliveryZone: shippingMode === 'pickup' ? 'Store Pickup (Self)' : `Pincode: ${addressData.pincode} (${addressData.city})`,
          shippingType: shippingMode,
          orderItems: formattedCartItems,
          unlockedFreeGifts: activeUnlockedGift ? [activeUnlockedGift.title] : [],
          subTotal: Number(effectiveCartTotal),
          bulkDiscount: Number(bulkDiscount),
          couponDiscount: Number(couponDiscount),
          shippingCharge: Number(shippingCharge),
          taxAmount: Number(taxAmount),
          totalAmount: Number(grandTotal),
          paymentMethod: paymentMethod.toUpperCase(),
          upiTransactionId: upiRef
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order. Please check details.');

      setConfirmedOrderId(data.orderId || data._id || 'ORD' + Date.now().toString().slice(-6));
      setStep('success');
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      setError(err.message || 'An error occurred while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={handleClose}></div>
      <aside className={`cart-drawer-container ${isOpen ? 'open' : ''}`}>
        <div className="cart-page-header">
          <div className="cart-header-left">
            <h2>SHOPPING CART</h2>
            <span className="cart-badge-count">{cartCount} items</span>
          </div>
          <button className="cart-close-icon" onClick={handleClose}>✕</button>
        </div>

        <div className="cart-layout-scroll">
          {/* STEP 1: CART VIEW */}
          {step === 'cart' && (
            cartItems.length === 0 ? (
              <div className="cart-empty-view">
                <div className="empty-cart-icon">🛒</div>
                <h3>Your cart is empty!</h3>
                <button className="btn-continue-shopping" onClick={handleClose}>Explore Sweets</button>
              </div>
            ) : (
              <div className="cart-two-column-layout">
                {/* Left Column: Products & Gifts */}
                <div className="cart-left-column">
                  
                  {/* 🎁 FREE GIFT ROADMAP */}
                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎁 Free Gift Spend Milestones
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
                        Cart Total: ₹{effectiveCartTotal.toFixed(0)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', margin: '6px 0' }}>
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          transition: 'width 0.4s ease-in-out'
                        }}
                      />
                    </div>

                    {nextLockedGift ? (
                      <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: '700', marginTop: '4px' }}>
                        ⚡ Add worth <strong>₹{(nextLockedGift.minSpend - effectiveCartTotal).toFixed(0)}</strong> more to UNLOCK: <u>{nextLockedGift.title}</u>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.82rem', color: '#059669', fontWeight: '800', marginTop: '4px' }}>
                        🎉 Superb! You reached the Highest Free Gift Tier!
                      </div>
                    )}

                    {/* Milestones List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {sortedRoadmapGifts.map((m) => {
                        const isCurrentActive = activeUnlockedGift && activeUnlockedGift.id === m.id;
                        const isLowerSurpassed = activeUnlockedGift && m.minSpend < activeUnlockedGift.minSpend;

                        return (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: isCurrentActive ? '#ecfdf5' : isLowerSurpassed ? '#f1f5f9' : '#ffffff',
                              border: `1.5px solid ${isCurrentActive ? '#10b981' : '#e2e8f0'}`,
                              opacity: isLowerSurpassed ? 0.75 : 1
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '18px' }}>
                                {isCurrentActive ? '🎁' : isLowerSurpassed ? '📦' : '🔒'}
                              </span>
                              <div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 'bold', color: isCurrentActive ? '#065f46' : isLowerSurpassed ? '#64748b' : '#334155' }}>
                                  {m.title}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  Target: Spend ₹{m.minSpend.toLocaleString('en-IN')}+
                                </div>
                              </div>
                            </div>

                            <div>
                              {isCurrentActive ? (
                                <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                                  ✓ ACTIVE IN CART
                                </span>
                              ) : isLowerSurpassed ? (
                                <span style={{ background: '#cbd5e1', color: '#475569', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                                  ⬆️ UPGRADED
                                </span>
                              ) : (
                                <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>
                                  🔒 Add ₹{(m.minSpend - effectiveCartTotal).toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 💎 BULK TIER ACTIVE BANNER */}
                  {bulkDiscount > 0 && (
                    <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', color: '#065f46', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>💎</span>
                      <div>
                        🎉 Bulk Tier Discount Applied! ({bulkDetails})
                        <div style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#047857' }}>
                          You saved ₹{bulkDiscount.toFixed(2)} automatically!
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products List Card */}
                  <div className="cart-card-box shop-details-card">
                    <div className="cart-products-list">
                      {cartItems.map((item) => {
                        const unitPrice = parseNumericPrice(item.unitPrice || item.price);
                        const qty = Number(item.qty || item.quantity || 1);
                        const itemHasFreeShip = isTrueFlag(item.isFreeDelivery);

                        return (
                          <div key={item.id} className="cart-product-row">
                            <div className="prod-thumb-info">
                              <img src={item.img} alt={item.name} />
                              <div className="prod-details-meta">
                                <h4 className="prod-title-maroon">{item.name}</h4>
                                <span className="prod-variant-tag">{item.variant || '500g'}</span>
                                {itemHasFreeShip && <span style={{ color: '#059669', fontSize: '11px', fontWeight: 'bold' }}>🚚 Free Delivery Active</span>}
                              </div>
                            </div>
                            <div className="prod-actions-pricing">
                              <div className="prod-row-price">₹{(unitPrice * qty).toFixed(2)}</div>
                              <div className="prod-stepper-wrap">
                                <div className="prod-stepper">
                                  <button onClick={() => changeQty(item.id, -1)}>−</button>
                                  <span>{qty}</span>
                                  <button onClick={() => changeQty(item.id, 1)}>+</button>
                                </div>
                                <button className="btn-remove-circle" onClick={() => removeFromCart(item.id)}>ⓧ</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* 🎁 SINGLE ACTIVE FREE GIFT ITEM IN CART */}
                      {activeUnlockedGift && (
                        <div
                          key={activeUnlockedGift.id}
                          className="cart-product-row"
                          style={{
                            background: '#f0fdf4',
                            border: '1.5px dashed #22c55e',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            marginTop: '8px'
                          }}
                        >
                          <div className="prod-thumb-info">
                            <div style={{ width: '48px', height: '48px', background: '#dcfce7', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                              🎁
                            </div>
                            <div className="prod-details-meta">
                              <h4 style={{ color: '#15803d', margin: '0 0 2px', fontSize: '0.92rem', fontWeight: 'bold' }}>
                                {activeUnlockedGift.title}
                              </h4>
                              <span style={{ background: '#16a34a', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                ✓ FREE GIFT UNLOCKED & PACKED
                              </span>
                              <span style={{ fontSize: '11px', color: '#166534', display: 'block', marginTop: '2px' }}>
                                Included with your ₹{activeUnlockedGift.minSpend.toLocaleString('en-IN')}+ order
                              </span>
                            </div>
                          </div>

                          <div className="prod-actions-pricing" style={{ textAlign: 'right' }}>
                            <div className="prod-row-price" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                              FREE (₹0.00)
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Qty: 1</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="cart-right-column">
                  <div className="cart-card-box order-summary-card">
                    
                    {/* 📦 DELIVERY / PICKUP DROPDOWN OPTION */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                        Choose Delivery Option:
                      </label>
                      <select
                        value={shippingMode}
                        onChange={(e) => {
                          setShippingMode(e.target.value);
                          if (e.target.value === 'pickup') {
                            setPincodeStatusMsg('');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontWeight: '600',
                          color: '#334155',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="delivery">🚚 Home Delivery (We Deliver)</option>
                        <option value="pickup">🏬 Direct Store Pickup (Self Pickup - FREE)</option>
                      </select>
                    </div>

                    {/* 🟢 HOME DELIVERY SELECT HONE PAR HI PINCODE INPUT OPEN HOGA */}
                    {shippingMode === 'delivery' && (
                      <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94191d', display: 'block', marginBottom: '4px' }}>
                          Enter Delivery Pincode * (Mandatory)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 201301"
                          maxLength="6"
                          value={addressData.pincode}
                          onChange={handlePincodeChange}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            boxSizing: 'border-box'
                          }}
                        />
                        {isPincodeLoading && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>Checking charges...</div>}
                        {pincodeStatusMsg && !isPincodeLoading && (
                          <div style={{ fontSize: '0.8rem', color: pincodeDeliveryCharge !== null ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                            {pincodeStatusMsg}
                          </div>
                        )}
                        {!addressData.pincode && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                            * Pincode daalna zaroori hai delivery charge calculate karne ke liye
                          </div>
                        )}
                      </div>
                    )}

                    <div className="summary-breakdown">
                      <div className="summary-row"><span>Sub total</span><strong>₹{effectiveCartTotal.toFixed(2)}</strong></div>

                      {bulkDiscount > 0 && (
                        <div className="summary-row text-discount" style={{ color: '#059669', fontWeight: 'bold' }}>
                          <span>💎 Bulk Order Discount ({bulkDetails})</span>
                          <span>- ₹{bulkDiscount.toFixed(2)}</span>
                        </div>
                      )}

                      {couponDiscount > 0 && (
                        <div className="summary-row text-discount"><span>Coupon discount</span><span>- ₹{couponDiscount.toFixed(2)}</span></div>
                      )}

                      <div className="summary-row">
                        <span>Shipping ({shippingMode === 'pickup' ? 'Store Pickup' : 'Home Delivery'})</span>
                        <span>
                          {shippingMode === 'pickup' || isFreeDelivery ? (
                            <strong style={{ color: '#059669' }}>FREE</strong>
                          ) : pincodeDeliveryCharge !== null ? (
                            `₹${shippingCharge.toFixed(2)}`
                          ) : (
                            <span style={{ color: '#d97706', fontSize: '0.85rem' }}>Enter Pincode</span>
                          )}
                        </span>
                      </div>

                      <div className="summary-row"><span>Tax (5% GST)</span><span>₹{taxAmount.toFixed(2)}</span></div>
                      <div className="summary-divider"></div>
                      <div className="summary-total-row"><span>Total</span><span className="grand-total-val">₹{grandTotal.toFixed(2)}</span></div>
                    </div>

                    {/* Coupon Input */}
                    <div className="coupon-box-wrap">
                      <div className="coupon-input-group">
                        <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                        <button type="button" className="btn-apply-code" onClick={handleApplyCoupon}>Apply</button>
                      </div>
                      {couponMsg.text && <div className={`coupon-feedback ${couponMsg.type}`}>{couponMsg.text}</div>}
                    </div>

                    <button 
                      className="btn-checkout-maroon" 
                      onClick={handleProceedToCheckout}
                      disabled={shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null}
                      style={{
                        opacity: (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) ? 0.6 : 1,
                        cursor: (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null 
                        ? 'Enter Pincode to Continue 🔒' 
                        : 'Proceed to Checkout ⏩'}
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* STEP 2: AUTH REQUIRED PROMPT */}
          {step === 'auth-required' && (
            <div style={{ padding: '30px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', margin: '20px auto', maxWidth: '420px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔐</div>
              <h3 style={{ color: '#94191d', margin: '0 0 8px', fontSize: '1.3rem' }}>Login Required</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 20px' }}>
                Please login to your account or register to confirm your order and track delivery.
              </p>

              <button
                onClick={() => {
                  handleClose();
                  navigate('/auth');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#94191d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                🔑 Login / Sign In to Continue
              </button>

              <button
                onClick={() => setStep('cart')}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ← Back to Cart
              </button>
            </div>
          )}

          {/* STEP 3: CHECKOUT STEP */}
          {step === 'checkout' && (
            <div className="checkout-step-container" style={{ padding: '20px' }}>
              <button className="btn-back-to-cart" onClick={() => setStep('cart')}>← Back</button>
              
              <form onSubmit={handlePlaceOrder} style={{ marginTop: '15px' }}>
                {error && <div style={{ color: '#dc2626', marginBottom: '10px', fontWeight: 'bold' }}>⚠️ {error}</div>}
                
                {/* Delivery Mode Dropdown */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                    Delivery Mode:
                  </label>
                  <select
                    value={shippingMode}
                    onChange={(e) => setShippingMode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontWeight: '600',
                      color: '#334155',
                      background: '#fff'
                    }}
                  >
                    <option value="delivery">🚚 Home Delivery (We Deliver to your Address)</option>
                    <option value="pickup">🏬 Direct Store Pickup (Self Pickup - FREE)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  <input type="text" placeholder="Full Name *" required value={addressData.name} onChange={(e) => setAddressData({ ...addressData, name: e.target.value })} style={{ padding: '8px' }} />
                  <input type="tel" placeholder="Mobile Number *" maxLength="10" required value={addressData.phone} onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })} style={{ padding: '8px' }} />
                  
                  {shippingMode === 'delivery' ? (
                    <>
                      <textarea placeholder="Delivery Address *" required value={addressData.address} onChange={(e) => setAddressData({ ...addressData, address: e.target.value })} style={{ padding: '8px' }} />
                      <input type="text" placeholder="City *" required value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} style={{ padding: '8px' }} />
                      
                      {/* 🟢 PINCODE INPUT IN CHECKOUT */}
                      <div>
                        <input 
                          type="text" 
                          placeholder="Pincode * (Mandatory)" 
                          maxLength="6" 
                          required 
                          value={addressData.pincode} 
                          onChange={handlePincodeChange} 
                          style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }} 
                        />
                        {isPincodeLoading && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>Checking delivery rate...</div>}
                        {pincodeStatusMsg && !isPincodeLoading && (
                          <div style={{ fontSize: '0.8rem', color: pincodeDeliveryCharge !== null ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '3px' }}>
                            {pincodeStatusMsg}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '1.5px dashed #22c55e', padding: '10px', borderRadius: '8px', color: '#166534', fontSize: '0.85rem' }}>
                      📍 <strong>Store Pickup Selected:</strong> You can collect your order directly from our store. No shipping charge is applied!
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null)} 
                    className="btn-checkout-maroon" 
                    style={{ marginTop: '10px' }}
                  >
                    {loading ? 'Placing Order...' : `Confirm Order (₹${grandTotal.toFixed(2)})`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS SCREEN */}
          {step === 'success' && (
            <div className="order-success-screen">
              <div className="success-check-circle">✓</div>
              <h2>Order Placed Successfully!</h2>
              <p>Order ID: #{confirmedOrderId.slice(-8).toUpperCase()}</p>
              {activeUnlockedGift && (
                <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '8px', margin: '12px auto', maxWidth: '350px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  🎁 Free Gift Included: {activeUnlockedGift.title}
                </div>
              )}
              <button className="btn-checkout-maroon" onClick={handleClose} style={{ marginTop: '20px' }}>Continue Shopping</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CartDrawer;