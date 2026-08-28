import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
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

const getSavedUser = () => {
  try {
    const userObj = localStorage.getItem('user');
    if (userObj) return JSON.parse(userObj);
  } catch {
    return null;
  }
  return null;
};

const CartDrawer = ({ isOpen, onClose, cartItems, cartCount, changeQty, removeFromCart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'auth-required' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [serverMilestones, setServerMilestones] = useState([]);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  // 🎁 Gift Packaging Box (+₹50)
  const [isGiftBoxSelected, setIsGiftBoxSelected] = useState(false);
  const GIFT_BOX_CHARGE = 50;
  const FOUNDER_DELIVERY_CHARGE = 5000;

  // ℹ️ Tax Info Popup Hover State
  const [showTaxInfo, setShowTaxInfo] = useState(false);

  // 🚚 Shipping Mode
  const [shippingMode, setShippingMode] = useState('');

  // 🚚 Pincode Delivery Charge States
  const [pincodeDeliveryCharge, setPincodeDeliveryCharge] = useState(null);
  const [pincodeStatusMsg, setPincodeStatusMsg] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [upiRef, setUpiRef] = useState('');

  // 🏠 Shipping Address State
  const savedUser = getSavedUser();
  const [shippingAddress, setShippingAddress] = useState({
    name: savedUser?.name || '',
    phone: savedUser?.phone || savedUser?.mobile || '',
    addressType: 'Permanent',
    address: savedUser?.address || '',
    landmark: savedUser?.landmark || '',
    state: savedUser?.state || 'Uttar Pradesh',
    city: savedUser?.city || '',
    pincode: savedUser?.pincode || '',
    country: 'India',
    saveAddress: false
  });

  // 🏢 Billing Address State
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    name: '',
    phone: '',
    addressType: 'Permanent',
    address: '',
    landmark: '',
    state: 'Uttar Pradesh',
    city: '',
    pincode: '',
    country: 'India'
  });

  const isHomeDeliveryType = shippingMode === 'delivery' || shippingMode === 'founder';

  const fetchDeliveryChargeByPincode = async (pin) => {
    if (!pin || pin.length !== 6) return;
    setIsPincodeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/delivery/check-delivery-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: pin })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPincodeDeliveryCharge(Number(data.deliveryCharge));
        if (data.city) {
          setShippingAddress((prev) => ({ ...prev, city: data.city }));
        }
        setPincodeStatusMsg(`✓ Standard Delivery: ₹${data.deliveryCharge} (${data.city || 'Serviceable'})`);
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

  useEffect(() => {
    if (shippingMode === 'delivery' && shippingAddress.pincode && shippingAddress.pincode.length === 6) {
      fetchDeliveryChargeByPincode(shippingAddress.pincode);
    }
  }, [shippingMode]);

  const handlePincodeChange = (e) => {
    const newPin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setShippingAddress({ ...shippingAddress, pincode: newPin });
    if (newPin.length === 6 && shippingMode === 'delivery') {
      fetchDeliveryChargeByPincode(newPin);
    } else if (newPin.length !== 6) {
      setPincodeDeliveryCharge(null);
      setPincodeStatusMsg('');
    }
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
    setShippingAddress({ ...shippingAddress, phone: newPhone });
  };

  useEffect(() => {
    fetch(`${API_BASE}/gifts`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && d.length > 0 && setServerMilestones(d))
      .catch(() => {});
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('cart');
      setError('');
      setLoading(false);
      setShowTaxInfo(false);
    }, 300);
  };

  // 1. Subtotal calculation
  const effectiveCartTotal = cartItems.reduce((acc, item) => {
    const uPrice = parseNumericPrice(item.unitPrice || item.price);
    const q = Number(item.qty || item.quantity || 1);
    return acc + (uPrice * q);
  }, 0);

  // 2. Bulk Tier Discount
  let bulkDiscount = 0;
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
      bulkDiscount = activeTier.discountType === 'flat' 
        ? activeTier.discountValue 
        : Math.round((effectiveCartTotal * activeTier.discountValue) / 100);
    }
  }

  // 3. Shipping Charge Calculation
  const isFreeDelivery = cartItems.some((i) => isTrueFlag(i.isFreeDelivery));
  let shippingCharge = 0;

  if (shippingMode === 'pickup') {
    shippingCharge = 0;
  } else if (shippingMode === 'founder') {
    shippingCharge = FOUNDER_DELIVERY_CHARGE;
  } else if (shippingMode === 'delivery') {
    shippingCharge = isFreeDelivery ? 0 : (pincodeDeliveryCharge !== null ? pincodeDeliveryCharge : 0);
  }

  // 4. Taxes & Total
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const taxableProductAmount = Math.max(0, effectiveCartTotal - couponDiscount - bulkDiscount);
  const productTax = Math.round(taxableProductAmount * 0.05);
  const shippingTax = (shippingCharge > 0) ? Math.round(shippingCharge * 0.05) : 0;
  const totalTaxAmount = productTax + shippingTax;
  const giftBoxAmount = isGiftBoxSelected ? GIFT_BOX_CHARGE : 0;

  const grandTotal = Math.max(0, taxableProductAmount + (shippingMode ? shippingCharge : 0) + totalTaxAmount + giftBoxAmount);

  // 5. 🎁 Real Gifts Roadmap (ONLY from products in cart or server API)
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
    if (m.title && Number(m.minOrder || m.minSpend || 0) > 0) {
      collectedGifts.push({
        id: `server-${m._id || m.title}`,
        title: m.title,
        minSpend: Number(m.minOrder || m.minSpend || 0),
        image: m.image || ''
      });
    }
  });

  const uniqueMilestones = collectedGifts.filter(
    (v, i, a) => a.findIndex((t) => t.title.toLowerCase().trim() === v.title.toLowerCase().trim() && t.minSpend === v.minSpend) === i
  );
  const sortedRoadmapGifts = uniqueMilestones.sort((a, b) => a.minSpend - b.minSpend);
  const allUnlockedGifts = sortedRoadmapGifts.filter((g) => effectiveCartTotal >= g.minSpend);
  const activeUnlockedGift = allUnlockedGifts.length > 0 ? allUnlockedGifts[allUnlockedGifts.length - 1] : null;

  const handleProceedToCheckout = () => {
    if (!shippingMode) {
      alert('⚠️ Kripya pehle Delivery Option select karein (Mandatory)!');
      return;
    }
    if (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) {
      alert('⚠️ Kripya valid 6-digit Pincode daalein taaki delivery charges check ho sakein!');
      return;
    }
    if (shippingMode === 'founder' && (!shippingAddress.pincode || shippingAddress.pincode.length !== 6)) {
      alert('⚠️ Founder Delivery ke liye apna 6-digit Pincode enter karein!');
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
        return setCouponMsg({ text: `🎉 Coupon ${matched.code} applied!`, type: 'success' });
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

  // Place Order
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingAddress.phone.trim())) {
      setError('⚠️ Kripya 10-digit ka valid mobile number dalein (6-9 se shuru hona chahiye).');
      return;
    }

    if (isHomeDeliveryType && !shippingAddress.landmark.trim()) {
      setError('⚠️ Landmark / House / Floor details enter karna mandatory hai.');
      return;
    }

    const pinRegex = /^[1-9]\d{5}$/;
    if (isHomeDeliveryType && !pinRegex.test(shippingAddress.pincode.trim())) {
      setError('⚠️ Kripya 6-digit ka valid Pincode dalein.');
      return;
    }

    if (!sameAsShipping) {
      if (!phoneRegex.test(billingAddress.phone.trim())) {
        setError('⚠️ Kripya valid 10-digit Billing Phone number dalein.');
        return;
      }
      if (!billingAddress.landmark.trim()) {
        setError('⚠️ Billing Landmark details enter karna mandatory hai.');
        return;
      }
      if (!pinRegex.test(billingAddress.pincode.trim())) {
        setError('⚠️ Kripya valid 6-digit Billing Pincode dalein.');
        return;
      }
    }

    if (!shippingMode) {
      setError('Shipping method select karna zaroori hai.');
      return;
    }

    if (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) {
      setError('Is pincode par delivery available nahi hai. Dusra pincode try karein.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setStep('auth-required');
      return;
    }

    setLoading(true);
    try {
      // 🟢 Formatted Items Snapshot
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

      const deliveryLabel = 
        shippingMode === 'founder'
          ? `Delivery by Founder (VIP Hand Delivery - ₹5000) - Pincode: ${shippingAddress.pincode} (${shippingAddress.city})`
          : shippingMode === 'pickup'
            ? 'Direct Store Pickup (Free)'
            : `Standard Home Delivery - Pincode: ${shippingAddress.pincode} (${shippingAddress.city})`;

      const orderPayload = {
        customer: {
          ...shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress
        },
        shippingAddress,
        billingAddress: sameAsShipping ? shippingAddress : billingAddress,
        deliveryZone: deliveryLabel,
        shippingType: shippingMode,
        orderItems: formattedCartItems,
        unlockedFreeGifts: activeUnlockedGift ? [activeUnlockedGift.title] : [],
        subTotal: Number(effectiveCartTotal),
        bulkDiscount: Number(bulkDiscount),
        couponDiscount: Number(couponDiscount),
        shippingCharge: Number(shippingCharge),
        productTax: Number(productTax),
        shippingTax: Number(shippingTax),
        taxAmount: Number(totalTaxAmount),
        giftBoxCharge: Number(giftBoxAmount),
        totalAmount: Number(grandTotal),
        paymentMethod: paymentMethod.toUpperCase(),
        upiTransactionId: upiRef
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order. Please try again.');

      const newOrderId = data.orderId || data._id || 'ORD' + Date.now().toString().slice(-6);
      setConfirmedOrderId(newOrderId);
      
      // 🟢 Save Snapshot for Success Screen
      setPlacedOrderDetails({
        orderId: newOrderId,
        ...orderPayload,
        itemsSnapshot: [...formattedCartItems],
        createdAt: new Date().toLocaleString('en-IN')
      });

      setStep('success');
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      setError(err.message || 'An error occurred while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '4px',
    border: '1.5px solid #b91c1c',
    fontSize: '0.88rem',
    color: '#1e293b',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '14px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px'
  };

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={handleClose}></div>
      <aside className={`cart-drawer-container ${isOpen ? 'open' : ''}`} style={{ maxWidth: '1150px', width: '95vw' }}>
        
        {/* TOP HEADER */}
        <div style={{ padding: '18px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px', margin: 0 }}>
            SHOPPING CART
          </h2>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        <div className="cart-layout-scroll" style={{ padding: '20px 24px', overflowY: 'auto' }}>
          {step === 'cart' && (
            cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🛒</div>
                <h3 style={{ color: '#334155' }}>Your cart is empty!</h3>
                <button className="btn-continue-shopping" onClick={handleClose} style={{ marginTop: '14px', background: '#94191d', color: '#fff', padding: '10px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Explore Sweets
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1.65fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* 👈 LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  
                  {/* CARD 1: PRODUCT LIST & SHOP NAME */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '2px solid #b91c1c' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                        Shop name : <strong style={{ color: '#0f172a' }}>Seedhe Gaon Se</strong>
                      </span>
                    </div>

                    {/* Table Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', background: '#f8fafc', fontSize: '0.84rem', fontWeight: '700', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                      <span>Product details</span>
                      <span>Total price & Qty</span>
                    </div>

                    {/* Product Rows */}
                    <div style={{ padding: '12px 18px' }}>
                      {cartItems.map((item) => {
                        const unitPrice = parseNumericPrice(item.unitPrice || item.price);
                        const qty = Number(item.qty || item.quantity || 1);

                        return (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={item.img || 'https://via.placeholder.com/60'}
                                alt={item.name}
                                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                              />
                              <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: '800', color: '#94191d', textTransform: 'uppercase' }}>
                                  {item.name}
                                </h4>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  Kg : {item.variant || '0.450 KG'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.92rem', minWidth: '65px', textAlign: 'right' }}>
                                ₹{(unitPrice * qty).toFixed(2)}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                                <button
                                  type="button"
                                  onClick={() => changeQty(item.id, -1)}
                                  style={{ width: '26px', height: '26px', background: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
                                >
                                  −
                                </button>
                                <span style={{ width: '32px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => changeQty(item.id, 1)}
                                  style={{ width: '26px', height: '26px', background: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer', padding: 0 }}
                                title="Remove item"
                              >
                                ⓧ
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🎁 CARD 2: FREE GIFT MILESTONES ROADMAP (Strictly rendered only when products in cart have gifts) */}
                  {sortedRoadmapGifts.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontWeight: '800', color: '#94191d', fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🎁 Free Gift Milestones Roadmap
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {sortedRoadmapGifts.map((m) => {
                          const isUnlocked = effectiveCartTotal >= m.minSpend;
                          const remaining = Math.max(0, m.minSpend - effectiveCartTotal);

                          return (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: isUnlocked ? '#f0fdf4' : '#ffffff',
                                border: `1px solid ${isUnlocked ? '#22c55e' : '#e2e8f0'}`,
                                boxShadow: isUnlocked ? '0 2px 6px rgba(34,197,94,0.12)' : 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', background: isUnlocked ? '#dcfce7' : '#f8fafc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', fontSize: '18px' }}>
                                  {isUnlocked ? '🎁' : '🔒'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: isUnlocked ? '#15803d' : '#1e293b' }}>
                                    {m.title}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Required minimum spend: ₹{m.minSpend.toLocaleString('en-IN')}.00
                                  </div>
                                </div>
                              </div>

                              <div>
                                {isUnlocked ? (
                                  <span style={{ background: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '5px 10px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    ✓ UNLOCKED (FREE)
                                  </span>
                                ) : (
                                  <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '11px', fontWeight: '800', padding: '5px 10px', borderRadius: '4px' }}>
                                    🔒 Add ₹{remaining.toLocaleString('en-IN')}.00
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CARD 3: GIFT PACKAGING BOX CHECKBOX */}
                  <div
                    onClick={() => setIsGiftBoxSelected(!isGiftBoxSelected)}
                    style={{
                      background: '#fff',
                      border: `1.5px solid ${isGiftBoxSelected ? '#b91c1c' : '#e2e8f0'}`,
                      borderRadius: '10px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isGiftBoxSelected}
                      onChange={() => {}}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#b91c1c', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#94191d' }}>
                        🎁 Pack in a Special Gift Box (+₹50.00)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Add premium gift box packaging to your order.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 👉 RIGHT COLUMN: ORDER SUMMARY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    
                    {/* Top Shipping Status Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderLeft: '4px solid #b91c1c', borderRadius: '6px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🚚 Shipping Method:
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', background: shippingMode ? '#dcfce7' : '#fee2e2', color: shippingMode ? '#166534' : '#ef4444' }}>
                        {shippingMode === 'founder' ? 'FOUNDER DELIVERY' : shippingMode ? shippingMode.toUpperCase() : 'NOT SELECTED'}
                      </span>
                    </div>

                    {/* Delivery Options Selector */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
                        Choose Delivery Option * <span style={{ color: '#ef4444' }}>(Mandatory)</span>
                      </label>
                      <select
                        value={shippingMode}
                        onChange={(e) => {
                          setShippingMode(e.target.value);
                          if (e.target.value === 'pickup' || e.target.value === 'founder') {
                            setPincodeStatusMsg('');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '6px',
                          border: `1.5px solid ${!shippingMode ? '#f87171' : '#cbd5e1'}`,
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: '#1e293b',
                          background: !shippingMode ? '#fff5f5' : '#fff',
                          cursor: 'pointer'
                        }}
                        required
                      >
                        <option value="">⚠️ -- Select Shipping Option (Required) --</option>
                        <option value="delivery">🚚 Home Delivery (Courier)</option>
                        <option value="founder">🎖️ Delivery by Founder (VIP Hand Delivery - ₹5,000)</option>
                        <option value="pickup">🏬 Direct Store Pickup (Self Pickup - FREE)</option>
                      </select>
                    </div>

                    {shippingMode === 'founder' && (
                      <div style={{ background: '#fef3c7', border: '1px dashed #d97706', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: '#92400e', fontWeight: '600' }}>
                        🎖️ <strong>Founder VIP Delivery (₹5,000 Flat):</strong> Personally hand-delivered by our founder team!
                      </div>
                    )}

                    {isHomeDeliveryType && (
                      <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#94191d', display: 'block', marginBottom: '4px' }}>
                          Delivery Pincode *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 201301"
                          maxLength="6"
                          value={shippingAddress.pincode}
                          onChange={handlePincodeChange}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            boxSizing: 'border-box'
                          }}
                        />
                        {shippingMode === 'delivery' && isPincodeLoading && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Checking charges...</div>
                        )}
                        {shippingMode === 'delivery' && pincodeStatusMsg && !isPincodeLoading && (
                          <div style={{ fontSize: '0.78rem', color: pincodeDeliveryCharge !== null ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '3px' }}>
                            {pincodeStatusMsg}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Breakdown Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sub total</span>
                        <strong>₹{effectiveCartTotal.toFixed(2)}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                        <span>Coupon discount</span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                        <span>Discount on product</span>
                        <span>- ₹{bulkDiscount.toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Shipping</span>
                        <span>
                          {!shippingMode ? (
                            <em style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '600' }}>Select shipping method</em>
                          ) : shippingMode === 'founder' ? (
                            <strong style={{ color: '#b91c1c' }}>₹{FOUNDER_DELIVERY_CHARGE.toFixed(2)}</strong>
                          ) : shippingMode === 'pickup' || isFreeDelivery ? (
                            <strong style={{ color: '#059669' }}>FREE</strong>
                          ) : pincodeDeliveryCharge !== null ? (
                            `₹${shippingCharge.toFixed(2)}`
                          ) : (
                            <span style={{ color: '#d97706', fontSize: '0.8rem' }}>Enter Pincode</span>
                          )}
                        </span>
                      </div>

                      {/* Tax Breakdown with HOVERABLE ℹ Icon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                          onMouseEnter={() => setShowTaxInfo(true)}
                          onMouseLeave={() => setShowTaxInfo(false)}
                        >
                          <span>Total Tax</span>
                          <button
                            type="button"
                            onClick={() => setShowTaxInfo(!showTaxInfo)}
                            style={{
                              background: '#e2e8f0',
                              border: 'none',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0
                            }}
                          >
                            ℹ
                          </button>

                          {showTaxInfo && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '26px',
                                left: '0',
                                width: '210px',
                                background: '#1e293b',
                                color: '#fff',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '0.78rem',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                                zIndex: 100,
                                pointerEvents: 'none'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ color: '#cbd5e1' }}>Product Tax (5% GST):</span>
                                <strong>₹{productTax.toFixed(2)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ color: '#cbd5e1' }}>Shipping Tax (5% GST):</span>
                                <strong>₹{shippingTax.toFixed(2)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #475569', paddingTop: '4px', marginTop: '4px', fontWeight: 'bold' }}>
                                <span>Total Tax:</span>
                                <span style={{ color: '#4ade80' }}>₹{totalTaxAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <strong>₹{totalTaxAmount.toFixed(2)}</strong>
                      </div>

                      {isGiftBoxSelected && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: '700' }}>
                          <span>🎁 Gift Box Packaging</span>
                          <span>+ ₹{GIFT_BOX_CHARGE.toFixed(2)}</span>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid #e2e8f0', margin: '4px 0' }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>Total</span>
                        <span style={{ fontSize: '1.35rem', fontWeight: '900', color: '#b91c1c' }}>
                          ₹{grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Coupon Input & Button */}
                    <div style={{ marginTop: '16px' }}>
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.88rem',
                          boxSizing: 'border-box',
                          marginBottom: '8px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#881337',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '800',
                          fontSize: '0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        Apply code
                      </button>
                      {couponMsg.text && (
                        <div style={{ fontSize: '0.78rem', color: couponMsg.type === 'success' ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                          {couponMsg.text}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '10px', marginTop: '14px' }}>
                      <button
                        type="button"
                        onClick={handleClose}
                        style={{
                          padding: '12px 8px',
                          background: '#881337',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        ⏪ Continue shopping
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToCheckout}
                        disabled={!shippingMode}
                        style={{
                          padding: '12px 8px',
                          background: !shippingMode ? '#9ca3af' : '#881337',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          cursor: !shippingMode ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title={!shippingMode ? 'Please select a delivery option first' : ''}
                      >
                        Checkout ⏩
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* STEP 2: AUTH REQUIRED */}
          {step === 'auth-required' && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', margin: '20px auto', maxWidth: '420px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔐</div>
              <h3 style={{ color: '#94191d', margin: '0 0 8px', fontSize: '1.3rem' }}>Login Required</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 20px' }}>
                Please login to your account or register to confirm your order.
              </p>
              <button
                onClick={() => {
                  handleClose();
                  navigate('/auth');
                }}
                style={{ width: '100%', padding: '12px', background: '#94191d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '10px' }}
              >
                🔑 Login / Sign In to Continue
              </button>
              <button
                onClick={() => setStep('cart')}
                style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                ← Back to Cart
              </button>
            </div>
          )}

          {/* STEP 3: CHECKOUT FORM */}
          {step === 'checkout' && (
            <div style={{ maxWidth: '680px', margin: '0 auto', background: '#fff', padding: '24px 28px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <button onClick={() => setStep('cart')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px', fontSize: '0.9rem' }}>
                ← Back to Cart
              </button>

              {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontWeight: 'bold', fontSize: '0.88rem' }}>{error}</div>}

              <form onSubmit={handlePlaceOrder}>
                {/* 🚚 SHIPPING ADDRESS */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <input type="radio" checked readOnly style={{ accentColor: '#000', width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>Shipping Address</span>
                  </div>

                  <label style={labelStyle}>Contact person name <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={shippingAddress.name}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                    style={inputStyle}
                  />

                  <label style={labelStyle}>Phone (10 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="tel"
                    maxLength="10"
                    required
                    placeholder="e.g. 9876543210"
                    value={shippingAddress.phone}
                    onChange={handlePhoneChange}
                    style={inputStyle}
                  />

                  <label style={labelStyle}>Address Type</label>
                  <select
                    value={shippingAddress.addressType}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressType: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>

                  <label style={labelStyle}>Address <span style={{ color: '#b91c1c' }}>*</span></label>
                  <textarea
                    required
                    rows="3"
                    placeholder="House / Flat No., Street, Building Name"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                  />

                  <label style={labelStyle}>Landmark / Floor / House Details <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Near Shiv Temple, 2nd Floor, Landlord Name"
                    value={shippingAddress.landmark}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })}
                    style={inputStyle}
                  />

                  <label style={labelStyle}>State / Union Territory <span style={{ color: '#b91c1c' }}>*</span></label>
                  <select
                    required
                    value={shippingAddress.state}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <label style={labelStyle}>City <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Noida, Delhi"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    style={inputStyle}
                  />

                  <label style={labelStyle}>Zip code (6 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    placeholder="Enter 6 digit zip code"
                    value={shippingAddress.pincode}
                    onChange={handlePincodeChange}
                    style={inputStyle}
                  />

                  <label style={labelStyle}>Country <span style={{ color: '#b91c1c' }}>*</span></label>
                  <select
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="India">India</option>
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      id="saveShippingAddress"
                      checked={shippingAddress.saveAddress}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, saveAddress: e.target.checked })}
                      style={{ cursor: 'pointer', accentColor: '#b91c1c', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="saveShippingAddress" style={{ fontSize: '0.86rem', color: '#475569', cursor: 'pointer' }}>
                      Save this address
                    </label>
                  </div>
                </div>

                {/* 🏢 BILLING ADDRESS */}
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="radio" checked readOnly style={{ accentColor: '#000', width: '18px', height: '18px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>Billing Address</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        id="sameAsShipping"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        style={{ cursor: 'pointer', accentColor: '#b91c1c', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="sameAsShipping" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>
                        Same as Shipping Address
                      </label>
                    </div>
                  </div>

                  {!sameAsShipping && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                      <label style={labelStyle}>Billing Contact Person Name <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input
                        type="text"
                        required={!sameAsShipping}
                        value={billingAddress.name}
                        onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                        style={inputStyle}
                      />

                      <label style={labelStyle}>Billing Phone (10 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input
                        type="tel"
                        maxLength="10"
                        required={!sameAsShipping}
                        value={billingAddress.phone}
                        onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        style={inputStyle}
                      />

                      <label style={labelStyle}>Billing Address <span style={{ color: '#b91c1c' }}>*</span></label>
                      <textarea
                        required={!sameAsShipping}
                        rows="3"
                        placeholder="House / Flat No., Street"
                        value={billingAddress.address}
                        onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
                        style={{ ...inputStyle, minHeight: '70px' }}
                      />

                      <label style={labelStyle}>Billing Landmark / Floor / House Details <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input
                        type="text"
                        required={!sameAsShipping}
                        placeholder="e.g. Near City Center, 1st Floor"
                        value={billingAddress.landmark}
                        onChange={(e) => setBillingAddress({ ...billingAddress, landmark: e.target.value })}
                        style={inputStyle}
                      />

                      <label style={labelStyle}>State / Union Territory <span style={{ color: '#b91c1c' }}>*</span></label>
                      <select
                        required={!sameAsShipping}
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="">Select State / UT</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>

                      <label style={labelStyle}>City <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input
                        type="text"
                        required={!sameAsShipping}
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                        style={inputStyle}
                      />

                      <label style={labelStyle}>Zip code (6 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input
                        type="text"
                        maxLength="6"
                        required={!sameAsShipping}
                        placeholder="Enter 6 digit zip code"
                        value={billingAddress.pincode}
                        onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#881337',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '800',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  {loading ? 'Placing Order...' : `Confirm Order (₹${grandTotal.toFixed(2)})`}
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: 📋 SUCCESS SCREEN (RENDERED FROM PERMANENT SNAPSHOT) */}
          {step === 'success' && (
            <div style={{ maxWidth: '650px', margin: '0 auto', background: '#fff', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#22c55e', color: '#fff', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  ✓
                </div>
                <h2 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: '1.4rem' }}>Order Placed Successfully!</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Order ID: <strong style={{ color: '#94191d' }}>#{confirmedOrderId.toUpperCase()}</strong>
                </p>
              </div>

              {placedOrderDetails && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    📍 Delivery & Customer Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                    <div><strong>Customer Name:</strong> {placedOrderDetails.customer.name}</div>
                    <div><strong>Phone:</strong> {placedOrderDetails.customer.phone}</div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Shipping Address:</strong> {placedOrderDetails.customer.address}, Landmark: {placedOrderDetails.customer.landmark}, {placedOrderDetails.customer.city}, {placedOrderDetails.customer.state} - {placedOrderDetails.customer.pincode}
                    </div>
                    <div style={{ gridColumn: 'span 2', color: '#b91c1c', fontWeight: '700' }}>
                      <strong>Delivery Mode:</strong> {placedOrderDetails.deliveryZone}
                    </div>
                  </div>
                </div>
              )}

              {/* 🟢 ORDERED ITEMS SNAPSHOT */}
              {placedOrderDetails && placedOrderDetails.itemsSnapshot && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    📦 Ordered Items ({placedOrderDetails.itemsSnapshot.filter(i => !i.isFreeGift).length})
                  </h4>
                  {placedOrderDetails.itemsSnapshot.map((item, idx) => (
                    <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #f1f5f9', fontSize: '0.85rem' }}>
                      <div>
                        <strong style={{ color: item.isFreeGift ? '#15803d' : '#0f172a' }}>{item.name}</strong>{' '}
                        <span style={{ color: '#64748b' }}>({item.variant || 'Standard'} × {item.qty || item.quantity || 1})</span>
                      </div>
                      <div style={{ fontWeight: '700', color: item.isFreeGift ? '#15803d' : '#0f172a' }}>
                        {item.isFreeGift ? 'FREE (₹0.00)' : `₹${(parseNumericPrice(item.unitPrice || item.price) * Number(item.qty || item.quantity || 1)).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {placedOrderDetails && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', fontSize: '0.88rem' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    🧾 Payment Breakdown
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Subtotal:</span>
                    <strong>₹{placedOrderDetails.subTotal.toFixed(2)}</strong>
                  </div>
                  {placedOrderDetails.couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899', marginBottom: '4px' }}>
                      <span>Coupon Discount:</span>
                      <span>- ₹{placedOrderDetails.couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {placedOrderDetails.bulkDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899', marginBottom: '4px' }}>
                      <span>Bulk Discount:</span>
                      <span>- ₹{placedOrderDetails.bulkDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Shipping Charges:</span>
                    <span>{placedOrderDetails.shippingCharge > 0 ? `₹${placedOrderDetails.shippingCharge.toFixed(2)}` : 'FREE'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Tax (GST):</span>
                    <span>₹{placedOrderDetails.taxAmount.toFixed(2)}</span>
                  </div>
                  {placedOrderDetails.giftBoxCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', marginBottom: '4px' }}>
                      <span>Gift Box Packaging:</span>
                      <span>+ ₹{placedOrderDetails.giftBoxCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1.5px solid #e2e8f0', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', color: '#b91c1c' }}>
                    <span>Total Amount Paid / Payable:</span>
                    <span>₹{placedOrderDetails.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleClose}
                style={{ width: '100%', padding: '14px', background: '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer' }}
              >
                Continue Shopping 🛍️
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CartDrawer;