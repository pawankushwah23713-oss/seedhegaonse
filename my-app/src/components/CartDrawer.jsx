import React, { useState, useEffect } from 'react';
import './CartDrawer.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const DELIVERY_ZONES = [
  { id: 'noida', name: 'Noida / Greater Noida', rate: 40, freeAbove: 799, tag: '⚡ 2-4 Hours Delivery', pincodePrefixes: ['201301', '201302', '201303', '201304', '201305', '201306', '201307', '201308', '201309', '201310', '201318'] },
  { id: 'delhi_ncr', name: 'Delhi / Gurgaon / Ghaziabad / Faridabad', rate: 50, freeAbove: 999, tag: '🚚 Same / Next Day', pincodePrefixes: ['110', '122', '2010', '121'] },
  { id: 'north_india', name: 'Rest of UP / Haryana / Punjab / Rajasthan', rate: 70, freeAbove: 1200, tag: '📦 2-3 Days', pincodePrefixes: ['20', '21', '22', '24', '12', '13', '14', '15', '30', '31', '32', '33', '34'] },
  { id: 'rest_india', name: 'Rest of India', rate: 100, freeAbove: 1499, tag: '✈️ Express Air', pincodePrefixes: [] }
];

const CartDrawer = ({ isOpen, onClose, cartItems, cartCount, cartTotal, changeQty, removeFromCart, onOrderPlaced }) => {
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [upiRef, setUpiRef] = useState('');
  const [addressData, setAddressData] = useState({ name: '', phone: '', email: '', address: '', city: 'Noida', state: 'Uttar Pradesh', pincode: '201301' });

  useEffect(() => {
    fetch(`${API_BASE}/gifts`).then((r) => r.json()).then((d) => Array.isArray(d) && setMilestones(d)).catch(() => {});
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep('cart'); setError(''); setLoading(false); }, 300);
  };

  // 💎 1. AUTOMATIC BULK ORDER DISCOUNT CALCULATION (e.g. ₹12,000+)
  let bulkDiscount = 0;
  let bulkDetails = '';

  cartItems.forEach((item) => {
    const itemUnitPrice = parseFloat(String(item.unitPrice || item.price).replace(/[₹,]/g, '')) || 0;
    const itemQty = item.qty || item.quantity || 1;
    const itemTotal = itemUnitPrice * itemQty;
    const threshold = Number(item.highValueThreshold) || 0;
    const bulkPercent = Number(item.highValueDiscountPercent) || 0;

    // Check if item subtotal or overall cartTotal exceeds product's bulk threshold
    if (threshold > 0 && (itemTotal >= threshold || cartTotal >= threshold) && bulkPercent > 0) {
      const disc = Math.round((itemTotal * bulkPercent) / 100);
      bulkDiscount += disc;
      bulkDetails = `${bulkPercent}% OFF on orders ₹${threshold.toLocaleString('en-IN')}+`;
    }
  });

  // 🚚 2. FREE DELIVERY CHECK (Either zone threshold or product level free delivery)
  const hasItemFreeDelivery = cartItems.some((i) => i.isFreeDelivery === true || i.isFreeDelivery === 'true');
  const isFreeDelivery = hasItemFreeDelivery || cartTotal >= selectedZone.freeAbove;
  const shippingCharge = isFreeDelivery ? 0 : selectedZone.rate;

  // Coupon
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const taxAmount = Math.round((cartTotal - couponDiscount - bulkDiscount) * 0.05);
  const grandTotal = Math.max(0, cartTotal - couponDiscount - bulkDiscount + shippingCharge + taxAmount);

  // Roadmap Highest Gift Unlocked
  const sortedMilestones = [...milestones].sort((a, b) => a.minOrder - b.minOrder);
  const highestUnlocked = [...sortedMilestones].reverse().find((m) => cartTotal >= m.minOrder);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponMsg({ text: 'Enter coupon code', type: 'error' });
    try {
      const res = await fetch(`${API_BASE}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal })
      });
      const data = await res.json();
      if (!res.ok) return setCouponMsg({ text: data.message || 'Invalid coupon', type: 'error' });
      setAppliedCoupon({ code: data.code, discount: data.discount });
      setCouponMsg({ text: data.message, type: 'success' });
    } catch {
      setCouponMsg({ text: 'Verification error', type: 'error' });
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({
          customer: addressData,
          deliveryZone: selectedZone.name,
          orderItems: cartItems,
          subTotal: cartTotal,
          bulkDiscount,
          couponDiscount,
          shippingCharge,
          taxAmount,
          totalAmount: grandTotal,
          paymentMethod: paymentMethod.toUpperCase(),
          upiTransactionId: upiRef
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');
      setConfirmedOrderId(data.orderId || data._id || 'ORD' + Date.now().toString().slice(-6));
      setStep('success');
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      setError(err.message);
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
          {step === 'cart' && (
            cartItems.length === 0 ? (
              <div className="cart-empty-view">
                <div className="empty-cart-icon">🛒</div>
                <h3>Your cart is empty!</h3>
                <button className="btn-continue-shopping" onClick={handleClose}>Explore Sweets</button>
              </div>
            ) : (
              <div className="cart-two-column-layout">
                {/* Left: Products */}
                <div className="cart-left-column">
                  <div className="cart-card-box shop-details-card">
                    <div className="cart-products-list">
                      {cartItems.map((item) => {
                        const unitPrice = parseFloat(String(item.unitPrice || item.price).replace(/[₹,]/g, '')) || 0;
                        const qty = item.qty || item.quantity || 1;
                        return (
                          <div key={item.id} className="cart-product-row">
                            <div className="prod-thumb-info">
                              <img src={item.img} alt={item.name} />
                              <div className="prod-details-meta">
                                <h4 className="prod-title-maroon">{item.name}</h4>
                                <span className="prod-variant-tag">{item.variant || '500g'}</span>
                                {item.isFreeDelivery && <span style={{ color: '#059669', fontSize: '11px', fontWeight: 'bold' }}>🚚 Free Delivery</span>}
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
                    </div>
                  </div>

                  {/* Roadmap Gift */}
                  {sortedMilestones.length > 0 && (
                    <div className="cart-card-box rewards-card">
                      <div className="rewards-card-header"><span className="gift-icon">🎁</span><h3>Free Gift Roadmap</h3></div>
                      <div className="rewards-milestone-list">
                        {sortedMilestones.map((m) => {
                          const isUnlocked = highestUnlocked?._id === m._id;
                          return (
                            <div key={m._id} className={`milestone-item-row ${isUnlocked ? 'unlocked' : ''}`}>
                              <div className="milestone-left">
                                <img src={m.image.startsWith('http') ? m.image : `${API_BASE.replace('/api', '')}${m.image}`} alt={m.title} />
                                <div className="milestone-info"><h4>{m.title}</h4><span className="milestone-tier">Unlock: ₹{m.minOrder}</span></div>
                              </div>
                              <div className="milestone-right">{isUnlocked ? <span className="milestone-unlocked-badge">✓ Unlocked</span> : <span>Add ₹{(m.minOrder - cartTotal).toFixed(0)}</span>}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Summary */}
                <div className="cart-right-column">
                  <div className="cart-card-box order-summary-card">
                    <div className="summary-breakdown">
                      <div className="summary-row"><span>Sub total</span><strong>₹{cartTotal.toFixed(2)}</strong></div>

                      {/* 💎 Bulk Discount Row */}
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
                        <span>Shipping</span>
                        <span>{isFreeDelivery ? <strong style={{ color: '#059669' }}>FREE</strong> : `₹${shippingCharge.toFixed(2)}`}</span>
                      </div>

                      <div className="summary-row"><span>Tax (5% GST)</span><span>₹{taxAmount.toFixed(2)}</span></div>
                      <div className="summary-divider"></div>
                      <div className="summary-total-row"><span>Total</span><span className="grand-total-val">₹{grandTotal.toFixed(2)}</span></div>
                    </div>

                    {/* Coupon Box */}
                    <div className="coupon-box-wrap">
                      <div className="coupon-input-group">
                        <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                        <button type="button" className="btn-apply-code" onClick={handleApplyCoupon}>Apply</button>
                      </div>
                      {couponMsg.text && <div className={`coupon-feedback ${couponMsg.type}`}>{couponMsg.text}</div>}
                    </div>

                    <button className="btn-checkout-maroon" onClick={() => setStep('checkout')}>Proceed to Checkout ⏩</button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Checkout & Success Step unchanged */}
          {step === 'checkout' && (
            <div className="checkout-step-container" style={{ padding: '20px' }}>
              <button className="btn-back-to-cart" onClick={() => setStep('cart')}>← Back</button>
              <form onSubmit={handlePlaceOrder} style={{ marginTop: '15px' }}>
                {error && <div style={{ color: '#dc2626', marginBottom: '10px' }}>{error}</div>}
                <div style={{ display: 'grid', gap: '10px' }}>
                  <input type="text" placeholder="Full Name *" required value={addressData.name} onChange={(e) => setAddressData({ ...addressData, name: e.target.value })} style={{ padding: '8px' }} />
                  <input type="tel" placeholder="Mobile Number *" maxLength="10" required value={addressData.phone} onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })} style={{ padding: '8px' }} />
                  <textarea placeholder="Delivery Address *" required value={addressData.address} onChange={(e) => setAddressData({ ...addressData, address: e.target.value })} style={{ padding: '8px' }} />
                  <input type="text" placeholder="City *" required value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} style={{ padding: '8px' }} />
                  <input type="text" placeholder="Pincode *" maxLength="6" required value={addressData.pincode} onChange={(e) => setAddressData({ ...addressData, pincode: e.target.value })} style={{ padding: '8px' }} />
                  <button type="submit" disabled={loading} className="btn-checkout-maroon" style={{ marginTop: '10px' }}>
                    {loading ? 'Placing Order...' : `Confirm Order (₹${grandTotal.toFixed(2)})`}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'success' && (
            <div className="order-success-screen">
              <div className="success-check-circle">✓</div>
              <h2>Order Placed Successfully!</h2>
              <p>Order ID: #{confirmedOrderId.slice(-8).toUpperCase()}</p>
              <button className="btn-checkout-maroon" onClick={handleClose} style={{ marginTop: '20px' }}>Continue Shopping</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CartDrawer;