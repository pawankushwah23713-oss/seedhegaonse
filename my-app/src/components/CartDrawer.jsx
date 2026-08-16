// src/components/CartDrawer.jsx
import React, { useState, useEffect } from 'react';
import './CartDrawer.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'http://localhost:5000/api');

const RAZORPAY_KEY_ID =
  (typeof process !== 'undefined' && process.env?.REACT_APP_RAZORPAY_KEY_ID) ||
  import.meta.env?.VITE_RAZORPAY_KEY_ID ||
  '';

// Merchant UPI ID for the "Pay via UPI app" intent link (edit this)
const MERCHANT_UPI_ID = 'yourshop@upi';
const MERCHANT_UPI_NAME = 'Sweet Shop';

// Dynamically loads the Razorpay checkout script only once
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
  // Step State: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // 'cod' | 'upi' | 'razorpay'
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiRef, setUpiRef] = useState('');

  // Address Form State
  const [addressData, setAddressData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: ''
  });

  // Auto-fill logged in user details if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
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
      // Ignore parse error
    }
  }, [isOpen]);

  // Reset step when drawer closes
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

  const handleInputChange = (e) => {
    setAddressData({ ...addressData, [e.target.name]: e.target.value });
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
      price: parseFloat(String(i.price).replace(/[₹,]/g, '')) || 0,
      qty: i.qty,
      img: i.img
    }));

  // Shared: create order document in our own DB (used by COD + UPI-manual)
  const createOrderOnServer = async (extraPaymentFields = {}) => {
    const token = localStorage.getItem('token');
    const orderPayload = {
      customer: addressData,
      orderItems: buildOrderItems(),
      totalAmount: cartTotal,
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

  // COD flow — creates order directly, pending cash collection
  const placeCodOrder = async () => {
    const data = await createOrderOnServer({ paymentStatus: 'pending' });
    setConfirmedOrderId(data.orderId);
    setStep('success');
    if (onOrderPlaced) onOrderPlaced();
  };

  // Manual UPI flow — user pays via UPI app, then confirms with a reference id
  const placeUpiOrder = async () => {
    if (!upiRef.trim()) {
      setError('Please enter the UPI transaction/reference ID after paying.');
      return;
    }
    const data = await createOrderOnServer({
      paymentStatus: 'pending_verification',
      upiTransactionId: upiRef.trim()
    });
    setConfirmedOrderId(data.orderId);
    setStep('success');
    if (onOrderPlaced) onOrderPlaced();
  };

  // Razorpay gateway flow — cards/UPI/netbanking/wallets handled by Razorpay
  const placeRazorpayOrder = async () => {
    const token = localStorage.getItem('token');

    // 1. Ask our backend to create a Razorpay order
    const orderRes = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({ amount: cartTotal })
    });
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      throw new Error(orderData.message || 'Could not initiate payment. Please try again.');
    }

    // 2. Load the Razorpay checkout script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Could not load payment gateway. Check your internet connection.');
    }

    // 3. Open Razorpay checkout
    return new Promise((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Sweet Shop',
        description: 'Order Payment',
        order_id: orderData.id,
        prefill: {
          name: addressData.name,
          contact: addressData.phone,
          email: addressData.email
        },
        theme: { color: '#e11d48' },
        handler: async (response) => {
          try {
            // 4. Verify payment signature + create the order on our backend
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
                orderItems: buildOrderItems(),
                totalAmount: cartTotal
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }
            setConfirmedOrderId(verifyData.orderId);
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
        reject(new Error(resp?.error?.description || 'Payment failed. Please try again.'));
      });
      rzp.open();
    });
  };

  // Form Submit -> route to the right payment flow
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

  const upiIntentLink = `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent(MERCHANT_UPI_NAME)}&am=${cartTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order Payment')}`;

  const footerLabel = () => {
    if (loading) return 'Confirming Order...';
    if (paymentMethod === 'cod') return `Place COD Order (₹${cartTotal.toFixed(2)})`;
    if (paymentMethod === 'upi') return `Confirm UPI Payment (₹${cartTotal.toFixed(2)})`;
    return `Pay ₹${cartTotal.toFixed(2)} with Razorpay`;
  };

  return (
    <>
      {/* Background Overlay */}
      <div className={`cart-overlay ${isOpen ? 'show' : ''}`} onClick={handleClose}></div>

      {/* Drawer Panel */}
      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`}>

        {/* ── HEADER ── */}
        <div className="cart-drawer-header">
          {step === 'checkout' && (
            <button className="cart-back-btn" onClick={() => setStep('cart')}>
              ←
            </button>
          )}
          <h3>
            {step === 'cart' && `My Cart (${cartCount})`}
            {step === 'checkout' && 'Delivery & Payment'}
            {step === 'success' && 'Order Confirmed 🎉'}
          </h3>
          <button className="cart-close-btn" onClick={handleClose}>✕</button>
        </div>

        {/* ── BODY ── */}
        <div className="cart-drawer-body">

          {/* STEP 1: CART ITEMS LIST */}
          {step === 'cart' && (
            <>
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🛒</div>
                  <p>Your sweet cart is empty!</p>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Add authentic regional sweets from our live store.
                  </span>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="cart-drawer-item">
                    <img
                      src={item.img}
                      alt={item.name}
                      onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=Sweet'; }}
                    />
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <span className="cart-item-price">{item.price}</span>
                      <div className="cart-qty-stepper">
                        <button onClick={() => changeQty(item.id, -1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>✕</button>
                  </div>
                ))
              )}
            </>
          )}

          {/* STEP 2: ADDRESS + PAYMENT METHOD FORM */}
          {step === 'checkout' && (
            <form id="cod-checkout-form" onSubmit={handlePlaceOrder} className="checkout-address-form">
              {error && <div className="checkout-error-banner">{error}</div>}

              {/* Payment method selector */}
              <div className="payment-method-selector">
                <label className={`payment-option ${paymentMethod === 'cod' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <span className="pm-icon">💵</span>
                  <span className="pm-label">Cash on Delivery</span>
                </label>

                <label className={`payment-option ${paymentMethod === 'upi' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                  />
                  <span className="pm-icon">📲</span>
                  <span className="pm-label">UPI (GPay/PhonePe/Paytm)</span>
                </label>

                <label className={`payment-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                  />
                  <span className="pm-icon">💳</span>
                  <span className="pm-label">Card / Netbanking / Wallet (Razorpay)</span>
                </label>
              </div>

              {/* COD info box */}
              {paymentMethod === 'cod' && (
                <div className="cod-badge-box">
                  <span className="cod-icon">💵</span>
                  <div>
                    <strong>Payment Method: Cash on Delivery</strong>
                    <p>Pay in cash when authentic sweets reach your doorstep.</p>
                  </div>
                </div>
              )}

              {/* UPI manual pay box */}
              {paymentMethod === 'upi' && (
                <div className="upi-pay-box">
                  <p className="upi-amount">Amount to pay: <b>₹{cartTotal.toFixed(2)}</b></p>
                  <a
                    href={upiIntentLink}
                    className="upi-pay-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📲 Pay ₹{cartTotal.toFixed(2)} via UPI App
                  </a>
                  <p className="upi-hint">
                    Opens GPay / PhonePe / Paytm on mobile. UPI ID: <b>{MERCHANT_UPI_ID}</b>
                  </p>
                  <div className="form-field">
                    <label>UPI Transaction / Reference ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789012"
                      value={upiRef}
                      onChange={(e) => { setUpiRef(e.target.value); if (error) setError(''); }}
                      required
                    />
                  </div>
                  <p className="upi-hint">
                    After paying, enter the UPI reference number shown in your app so we can verify it.
                  </p>
                </div>
              )}

              {/* Razorpay info box */}
              {paymentMethod === 'razorpay' && (
                <div className="razorpay-info-box">
                  <span className="cod-icon">💳</span>
                  <div>
                    <strong>Secure Online Payment</strong>
                    <p>Pay instantly via Card, Netbanking, UPI or Wallet through Razorpay.</p>
                  </div>
                </div>
              )}

              <div className="form-row">
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
              </div>

              <div className="form-row-grid">
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
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength="6"
                    placeholder="110001"
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
                  placeholder="House No., Building Name, Street, Village/Area"
                  value={addressData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row-grid">
                <div className="form-field">
                  <label>City / Town *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Kanpur"
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

              <div className="form-field">
                <label>Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  placeholder="Near Shiv Mandir / Main Market"
                  value={addressData.landmark}
                  onChange={handleInputChange}
                />
              </div>
            </form>
          )}

          {/* STEP 3: ORDER SUCCESS SCREEN */}
          {step === 'success' && (
            <div className="order-success-screen">
              <div className="success-check-circle">✓</div>
              <h2>Order Placed!</h2>
              <p className="order-id-badge">Order ID: #{confirmedOrderId.slice(-6).toUpperCase()}</p>

              <div className="success-details-card">
                <p>🚚 Your fresh sweets are being packed with care.</p>
                {paymentMethod === 'cod' && (
                  <p>💵 Please keep <b>₹{cartTotal.toFixed(2)}</b> cash ready at the time of delivery.</p>
                )}
                {paymentMethod === 'upi' && (
                  <p>📲 We'll confirm your UPI payment of <b>₹{cartTotal.toFixed(2)}</b> shortly.</p>
                )}
                {paymentMethod === 'razorpay' && (
                  <p>💳 Payment of <b>₹{cartTotal.toFixed(2)}</b> received successfully.</p>
                )}
              </div>

              <button className="checkout-btn" onClick={handleClose} style={{ marginTop: '20px' }}>
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* ── FOOTER BUTTONS ── */}
        {cartItems.length > 0 && step !== 'success' && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal-row">
              <span>Total Payable Amount:</span>
              <span className="cart-total-price">₹{cartTotal.toFixed(2)}</span>
            </div>

            {step === 'cart' ? (
              <button className="checkout-btn" onClick={() => setStep('checkout')}>
                Proceed to Checkout →
              </button>
            ) : (
              <button
                type="submit"
                form="cod-checkout-form"
                className="checkout-btn place-order-btn"
                disabled={loading}
              >
                {footerLabel()}
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;