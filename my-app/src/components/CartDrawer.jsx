import React, { useState, useEffect } from 'react';
import './CartDrawer.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const RAZORPAY_KEY_ID =
  (typeof process !== 'undefined' && process.env?.REACT_APP_RAZORPAY_KEY_ID) ||
  import.meta.env?.VITE_RAZORPAY_KEY_ID ||
  '';

const MERCHANT_UPI_ID = 'seedhegaonse@upi';
const MERCHANT_UPI_NAME = 'Seedhe Gaon Se';

// 🟢 LOCATION-BASED DELIVERY CHARGES & ZONES
const DELIVERY_ZONES = [
  {
    id: 'noida',
    name: 'Noida / Greater Noida',
    rate: 40,
    freeAbove: 799,
    tag: '⚡ 2-4 Hours Delivery',
    pincodePrefixes: ['201301', '201302', '201303', '201304', '201305', '201306', '201307', '201308', '201309', '201310', '201318']
  },
  {
    id: 'delhi_ncr',
    name: 'Delhi / Gurgaon / Ghaziabad / Faridabad',
    rate: 50,
    freeAbove: 999,
    tag: '🚚 Same / Next Day',
    pincodePrefixes: ['110', '122', '2010', '121']
  },
  {
    id: 'north_india',
    name: 'Rest of UP / Haryana / Punjab / Rajasthan',
    rate: 70,
    freeAbove: 1200,
    tag: '📦 2-3 Days',
    pincodePrefixes: ['20', '21', '22', '24', '12', '13', '14', '15', '30', '31', '32', '33', '34']
  },
  {
    id: 'rest_india',
    name: 'Rest of India (All other States)',
    rate: 100,
    freeAbove: 1499,
    tag: '✈️ Express Air (3-4 Days)',
    pincodePrefixes: []
  }
];

// Free Gift Milestones Roadmap
const GIFT_MILESTONES = [
  {
    id: 'm1',
    title: 'Free Desi Ghee Peda (100g) on Min. order Rs. 1500',
    minOrder: 1500,
    img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'm2',
    title: 'Free Royal Sweet Gift Box on Min. order Rs. 2500',
    minOrder: 2500,
    img: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=150&auto=format&fit=crop'
  }
];

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-checkout-js')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const CartDrawer = ({
  isOpen,
  onClose,
  cartItems,
  cartCount,
  cartTotal,
  changeQty,
  removeFromCart,
  onOrderPlaced
}) => {
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // 📍 Location & Dynamic Shipping State (Default: Noida)
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);

  // Packaging & Coupon
  const [giftPackaging, setGiftPackaging] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiRef, setUpiRef] = useState('');

  // Address Form State
  const [addressData, setAddressData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    landmark: ''
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setAddressData((prev) => ({
          ...prev,
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || ''
        }));
      }
    } catch {
      // Ignore
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('cart');
      setError('');
      setLoading(false);
      setPaymentMethod('cod');
      setUpiRef('');
    }, 300);
  };

  // 📍 Automatic Zone Detection when Pincode is typed
  const handlePincodeChange = (pincodeVal) => {
    setAddressData((prev) => ({ ...prev, pincode: pincodeVal }));
    const cleanPin = pincodeVal.trim();
    if (cleanPin.length >= 3) {
      const matchedZone = DELIVERY_ZONES.find((z) =>
        z.pincodePrefixes.some((prefix) => cleanPin.startsWith(prefix))
      );
      if (matchedZone) {
        setSelectedZone(matchedZone);
      } else if (cleanPin.length === 6) {
        setSelectedZone(DELIVERY_ZONES[3]); // Rest of India fallback
      }
    }
  };

  // Coupon Logic
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMsg({ text: 'Please enter a valid coupon code', type: 'error' });
      return;
    }

    if (code === 'VILLAGE10') {
      const discount = Math.round(cartTotal * 0.1);
      setAppliedCoupon({ code, discount });
      setCouponMsg({ text: `Coupon VILLAGE10 applied! (₹${discount} OFF)`, type: 'success' });
    } else if (code === 'DESI50' && cartTotal >= 500) {
      setAppliedCoupon({ code, discount: 50 });
      setCouponMsg({ text: 'Coupon DESI50 applied! (₹50 OFF)', type: 'success' });
    } else {
      setCouponMsg({ text: 'Invalid or expired coupon code.', type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMsg({ text: '', type: '' });
  };

  // 💰 Dynamic Price Calculations
  const subTotal = cartTotal;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const packagingCharge = giftPackaging ? 50 : 0;

  // Check if eligible for Free Shipping in selected zone
  const isFreeDelivery = subTotal >= selectedZone.freeAbove;
  const shippingCharge = isFreeDelivery ? 0 : selectedZone.rate;

  const taxAmount = Math.round((subTotal - couponDiscount) * 0.05); // 5% GST
  const grandTotal = Math.max(0, subTotal - couponDiscount + packagingCharge + shippingCharge + taxAmount);

  // 🎁 Only the HIGHEST milestone tier reached should be "Unlocked".
  // Lower tiers that were already crossed get marked as "Upgraded" (superseded),
  // not "Unlocked" — so only one gift is ever active at a time.
  const sortedMilestones = [...GIFT_MILESTONES].sort((a, b) => a.minOrder - b.minOrder);
  const highestUnlockedMilestone = [...sortedMilestones]
    .reverse()
    .find((m) => subTotal >= m.minOrder) || null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pincode') {
      handlePincodeChange(value);
    } else {
      setAddressData({ ...addressData, [name]: value });
    }
    if (error) setError('');
  };

  const validateAddress = () => {
    if (!addressData.name.trim() || !addressData.phone.trim() || !addressData.address.trim() || !addressData.city.trim() || !addressData.pincode.trim()) {
      setError('Please fill in all mandatory delivery details.');
      return false;
    }
    if (!/^[0-9]{10}$/.test(addressData.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (!/^[0-9]{6}$/.test(addressData.pincode.trim())) {
      setError('Please enter a valid 6-digit postal pincode.');
      return false;
    }
    return true;
  };

  const buildOrderItems = () =>
    cartItems.map((i) => ({
      id: i.id,
      name: i.name,
      variant: i.variant || 'Standard',
      price: parseFloat(String(i.price).replace(/[₹,]/g, '')) || 0,
      qty: i.qty || i.quantity || 1,
      img: i.img
    }));

  const createOrderOnServer = async (extraPaymentFields = {}) => {
    const token = localStorage.getItem('token');
    const orderPayload = {
      customer: addressData,
      deliveryZone: selectedZone.name,
      orderItems: buildOrderItems(),
      subTotal,
      couponDiscount,
      packagingCharge,
      shippingCharge,
      taxAmount,
      totalAmount: grandTotal,
      paymentMethod: paymentMethod === 'upi' ? 'UPI' : 'COD',
      ...extraPaymentFields
    };

    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to place order. Please try again.');
    }
    return data;
  };

  const placeCodOrder = async () => {
    const data = await createOrderOnServer({ paymentStatus: 'pending' });
    setConfirmedOrderId(data.orderId || data._id || 'ORD' + Date.now().toString().slice(-6));
    setStep('success');
    if (onOrderPlaced) onOrderPlaced();
  };

  const placeUpiOrder = async () => {
    if (!upiRef.trim()) {
      setError('Please enter the UPI transaction/reference ID after paying.');
      return;
    }
    const data = await createOrderOnServer({
      paymentStatus: 'pending_verification',
      upiTransactionId: upiRef.trim()
    });
    setConfirmedOrderId(data.orderId || data._id || 'ORD' + Date.now().toString().slice(-6));
    setStep('success');
    if (onOrderPlaced) onOrderPlaced();
  };

  const placeRazorpayOrder = async () => {
    const token = localStorage.getItem('token');
    const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ amount: grandTotal })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.message || 'Could not initiate payment.');
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Could not load payment gateway.');
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Seedhe Gaon Se',
        description: 'Sweet Shop Order Payment',
        order_id: orderData.id,
        prefill: {
          name: addressData.name,
          contact: addressData.phone,
          email: addressData.email
        },
        theme: { color: '#94191d' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customer: addressData,
                deliveryZone: selectedZone.name,
                orderItems: buildOrderItems(),
                totalAmount: grandTotal
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }
            setConfirmedOrderId(verifyData.orderId || 'ORD' + Date.now().toString().slice(-6));
            setStep('success');
            if (onOrderPlaced) onOrderPlaced();
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled.'));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        reject(new Error(resp?.error?.description || 'Payment failed.'));
      });
      rzp.open();
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAddress()) return;
    if (paymentMethod === 'upi' && !upiRef.trim()) {
      setError('Please enter the UPI transaction/reference ID after paying.');
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'cod') {
        await placeCodOrder();
      } else if (paymentMethod === 'upi') {
        await placeUpiOrder();
      } else if (paymentMethod === 'razorpay') {
        await placeRazorpayOrder();
      }
    } catch (err) {
      setError(err.message || 'Server error, could not place order.');
    } finally {
      setLoading(false);
    }
  };

  const upiIntentLink = `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent(MERCHANT_UPI_NAME)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order Payment')}`;

  return (
    <>
      <div className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={handleClose}></div>

      <aside className={`cart-drawer-container ${isOpen ? 'open' : ''}`}>
        
        {/* TOP HEADER */}
        <div className="cart-page-header">
          <div className="cart-header-left">
            <h2>SHOPPING CART</h2>
            <span className="cart-badge-count">{cartCount} items</span>
          </div>
          <button className="cart-close-icon" onClick={handleClose}>✕</button>
        </div>

        {/* MAIN BODY LAYOUT */}
        <div className="cart-layout-scroll">
          {step === 'cart' && (
            cartItems.length === 0 ? (
              <div className="cart-empty-view">
                <div className="empty-cart-icon">🛒</div>
                <h3>Your sweet cart is empty!</h3>
                <p>Add fresh, authentic sweets straight from village artisans.</p>
                <button className="btn-continue-shopping" onClick={handleClose}>
                  Explore Sweets
                </button>
              </div>
            ) : (
              <div className="cart-two-column-layout">
                
                {/* ── LEFT COLUMN: PRODUCTS & REWARDS ROADMAP ── */}
                <div className="cart-left-column">
                  
                  {/* Shop Info Card */}
                  <div className="cart-card-box shop-details-card">
                    <div className="shop-name-header">
                      <span>Shop name : <strong>Seedhe Gaon Se</strong></span>
                    </div>

                    <div className="cart-table-head">
                      <span>Product details</span>
                      <span>Total price & Qty</span>
                    </div>

                    <div className="cart-products-list">
                      {cartItems.map((item) => {
                        const unitPrice = parseFloat(String(item.unitPrice || item.price).replace(/[₹,]/g, '')) || 0;
                        const qty = item.qty || item.quantity || 1;
                        const itemTotal = unitPrice * qty;

                        return (
                          <div key={item.id} className="cart-product-row">
                            <div className="prod-thumb-info">
                              <img
                                src={item.img}
                                alt={item.name}
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=120&auto=format&fit=crop';
                                }}
                              />
                              <div className="prod-details-meta">
                                <h4 className="prod-title-maroon">{item.name}</h4>
                                <span className="prod-variant-tag">
                                  {item.variant ? `Pack : ${item.variant}` : 'Weight : 500g'}
                                </span>
                              </div>
                            </div>

                            <div className="prod-actions-pricing">
                              <div className="prod-row-price">₹{itemTotal.toFixed(2)}</div>
                              <div className="prod-stepper-wrap">
                                <div className="prod-stepper">
                                  <button onClick={() => changeQty(item.id, -1)}>−</button>
                                  <span>{qty}</span>
                                  <button onClick={() => changeQty(item.id, 1)}>+</button>
                                </div>
                                <button
                                  className="btn-remove-circle"
                                  onClick={() => removeFromCart(item.id)}
                                  title="Remove item"
                                >
                                  ⓧ
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🎁 Free Gift Milestones Roadmap */}
                  <div className="cart-card-box rewards-card">
                    <div className="rewards-card-header">
                      <span className="gift-icon">🎁</span>
                      <h3>Free Gift Milestones Roadmap</h3>
                    </div>

                    <div className="rewards-milestone-list">
                      {sortedMilestones.map((m) => {
                        const qualifies = subTotal >= m.minOrder;
                        const isUnlocked = !!highestUnlockedMilestone && highestUnlockedMilestone.id === m.id;
                        const isSuperseded = qualifies && !isUnlocked;
                        const amountNeeded = m.minOrder - subTotal;

                        return (
                          <div key={m.id} className={`milestone-item-row ${isUnlocked ? 'unlocked' : ''}`}>
                            <div className="milestone-left">
                              <img src={m.img} alt="Gift" />
                              <div className="milestone-info">
                                <h4>{m.title}</h4>
                                <span className="milestone-tier">Tier requirement: ₹{m.minOrder.toLocaleString('en-IN')}.00</span>
                              </div>
                            </div>

                            <div className="milestone-right">
                              {isUnlocked ? (
                                <span className="milestone-unlocked-badge">✓ Unlocked</span>
                              ) : isSuperseded ? (
                                <span
                                  className="milestone-unlocked-badge"
                                  style={{ background: '#e2e8f0', color: '#64748b' }}
                                  title="A bigger gift is unlocked instead of this one"
                                >
                                  🔒 Upgraded
                                </span>
                              ) : (
                                <span className="milestone-add-btn">
                                  Add ₹{amountNeeded.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: SUMMARY, CITY DELIVERY & COUPON ── */}
                <div className="cart-right-column">
                  <div className="cart-card-box order-summary-card">
                    
                    {/* 📍 DELIVERY LOCATION SELECTOR (NOIDA / DELHI / OTHER) */}
                    <div className="delivery-zone-box">
                      <div className="dz-header">
                        <span className="dz-title">📍 Delivery Location / City</span>
                        <span className="dz-badge-selected">{selectedZone.name.split('/')[0]}</span>
                      </div>

                      <div className="dz-pills-grid">
                        {DELIVERY_ZONES.map((zone) => {
                          const isSelected = selectedZone.id === zone.id;
                          return (
                            <button
                              key={zone.id}
                              type="button"
                              className={`dz-pill-btn ${isSelected ? 'active' : ''}`}
                              onClick={() => setSelectedZone(zone)}
                            >
                              <div className="dz-pill-name">{zone.name}</div>
                              <div className="dz-pill-footer">
                                <span className="dz-pill-rate">
                                  {subTotal >= zone.freeAbove ? (
                                    <strong className="text-green-free">FREE Delivery</strong>
                                  ) : (
                                    `₹${zone.rate}`
                                  )}
                                </span>
                                <span className="dz-pill-tag">{zone.tag}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {!isFreeDelivery && (
                        <div className="free-shipping-hint">
                          Add <strong>₹{(selectedZone.freeAbove - subTotal).toFixed(2)}</strong> more for <strong>FREE Delivery</strong> in {selectedZone.name.split('/')[0]}!
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="summary-breakdown">
                      <div className="summary-row">
                        <span>Sub total</span>
                        <strong>₹{subTotal.toFixed(2)}</strong>
                      </div>

                      <div className="summary-row text-discount">
                        <span>Coupon discount</span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                      </div>

                      <div className="summary-row text-discount">
                        <span>Discount on product</span>
                        <span>- ₹0.00</span>
                      </div>

                      <div className="summary-row">
                        <span>Shipping ({selectedZone.name.split('/')[0].trim()})</span>
                        <span>
                          {isFreeDelivery ? (
                            <strong style={{ color: '#059669' }}>FREE</strong>
                          ) : (
                            `₹${shippingCharge.toFixed(2)}`
                          )}
                        </span>
                      </div>

                      <div className="summary-row">
                        <span>Total Tax <small title="5% GST included">(5% GST)</small></span>
                        <span>₹{taxAmount.toFixed(2)}</span>
                      </div>

                      {/* Gift Box Packaging Toggle */}
                      <label className="gift-packaging-toggle">
                        <div className="gpt-left">
                          <input
                            type="checkbox"
                            checked={giftPackaging}
                            onChange={(e) => setGiftPackaging(e.target.checked)}
                          />
                          <span>🎁 Gift Box Packaging</span>
                        </div>
                        <span className="gpt-price">+ ₹50.00</span>
                      </label>

                      <div className="summary-divider"></div>

                      <div className="summary-total-row">
                        <span>Total</span>
                        <span className="grand-total-val">₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Coupon Input Form */}
                    <div className="coupon-box-wrap">
                      <div className="coupon-input-group">
                        <input
                          type="text"
                          placeholder="Coupon code (e.g. VILLAGE10)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button type="button" className="btn-apply-code" onClick={handleApplyCoupon}>
                          Apply code
                        </button>
                      </div>

                      {couponMsg.text && (
                        <div className={`coupon-feedback ${couponMsg.type}`}>
                          <span>{couponMsg.text}</span>
                          {appliedCoupon && (
                            <button className="btn-remove-coupon" onClick={handleRemoveCoupon}>Remove</button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="summary-actions-wrap">
                      <button className="btn-continue-shop" onClick={handleClose}>
                        ⏪ Continue shopping
                      </button>
                      <button className="btn-checkout-maroon" onClick={() => setStep('checkout')}>
                        Checkout ⏩
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )
          )}

          {/* STEP 2: ADDRESS & PAYMENT FORM */}
          {step === 'checkout' && (
            <div className="checkout-step-container">
              <button className="btn-back-to-cart" onClick={() => setStep('cart')}>
                ← Back to Cart Summary
              </button>

              <form id="order-checkout-form" onSubmit={handlePlaceOrder} className="checkout-main-form">
                {error && <div className="checkout-error-banner">{error}</div>}

                <div className="checkout-form-split">
                  {/* Left: Address details */}
                  <div className="checkout-card-box">
                    <div className="zone-selected-alert">
                      📍 Delivering to: <strong>{selectedZone.name}</strong> • Shipping: <strong>{isFreeDelivery ? 'FREE' : `₹${shippingCharge}`}</strong>
                    </div>

                    <h3 className="section-card-title">1. Delivery Address</h3>

                    <div className="form-field">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Ramesh Kumar"
                        value={addressData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>Mobile Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          maxLength="10"
                          placeholder="9876543210"
                          value={addressData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>Pincode (Auto updates shipping) *</label>
                        <input
                          type="text"
                          name="pincode"
                          maxLength="6"
                          placeholder="e.g. 201301"
                          value={addressData.pincode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Complete House / Street Address *</label>
                      <textarea
                        rows="2"
                        name="address"
                        placeholder="House / Flat No., Landmark, Locality"
                        value={addressData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-field">
                        <label>City *</label>
                        <input
                          type="text"
                          name="city"
                          placeholder="Noida / Delhi"
                          value={addressData.city}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>State *</label>
                        <input
                          type="text"
                          name="state"
                          placeholder="Uttar Pradesh"
                          value={addressData.state}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Method & Total */}
                  <div className="checkout-card-box">
                    <h3 className="section-card-title">💳 2. Payment Method</h3>

                    <div className="payment-options-list">
                      <label className={`pm-option-card ${paymentMethod === 'cod' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                        />
                        <div className="pm-info">
                          <strong>💵 Cash on Delivery</strong>
                          <span>Pay in cash at doorstep</span>
                        </div>
                      </label>

                      <label className={`pm-option-card ${paymentMethod === 'upi' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                        />
                        <div className="pm-info">
                          <strong>📲 UPI (GPay / PhonePe / Paytm)</strong>
                          <span>Instant direct UPI app transfer</span>
                        </div>
                      </label>

                      <label className={`pm-option-card ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                        />
                        <div className="pm-info">
                          <strong>💳 Online (Cards / Netbanking / Wallets)</strong>
                          <span>Secure payment via Razorpay</span>
                        </div>
                      </label>
                    </div>

                    {paymentMethod === 'upi' && (
                      <div className="upi-details-card">
                        <p>Total to pay: <strong>₹{grandTotal.toFixed(2)}</strong></p>
                        <a href={upiIntentLink} className="btn-open-upi-app" target="_blank" rel="noopener noreferrer">
                          📲 Pay ₹{grandTotal.toFixed(2)} via UPI App
                        </a>
                        <div className="form-field" style={{ marginTop: '10px' }}>
                          <label>UPI Transaction / Reference ID *</label>
                          <input
                            type="text"
                            placeholder="Enter 12-digit UPI reference ID"
                            value={upiRef}
                            onChange={(e) => setUpiRef(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="checkout-payable-row">
                      <span>Total Payable:</span>
                      <strong>₹{grandTotal.toFixed(2)}</strong>
                    </div>

                    <button
                      type="submit"
                      className="btn-checkout-maroon btn-place-order"
                      disabled={loading}
                    >
                      {loading ? 'Processing Order...' : `Confirm & Place Order (₹${grandTotal.toFixed(2)})`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: ORDER SUCCESS SCREEN */}
          {step === 'success' && (
            <div className="order-success-screen">
              <div className="success-check-circle">✓</div>
              <h2>Order Placed Successfully!</h2>
              <p className="order-id-badge">Order ID: #{confirmedOrderId.slice(-8).toUpperCase()}</p>

              <div className="success-details-card">
                <p>🚚 Your village sweets order is being freshly prepared for <strong>{selectedZone.name}</strong>.</p>
                <p>💰 <strong>Total Amount:</strong> ₹{grandTotal.toFixed(2)}</p>
                <p>📦 <strong>Payment Method:</strong> {paymentMethod.toUpperCase()}</p>
              </div>

              <button className="btn-checkout-maroon" onClick={handleClose} style={{ marginTop: '20px' }}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};

export default CartDrawer;