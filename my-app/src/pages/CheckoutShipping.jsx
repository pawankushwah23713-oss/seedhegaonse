import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CheckoutShipping.css';

// Indian States List
const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Available Coupons Configuration
const COUPONS_LIST = [
  {
    code: 'SGS50',
    title: 'Save ₹50.00',
    discountAmount: 50,
    minSpend: 500,
    type: 'fixed'
  },
  {
    code: 'SGS20',
    title: 'Save ₹20.00',
    discountAmount: 20,
    minSpend: 500,
    type: 'fixed'
  },
  {
    code: 'SGS5%',
    title: 'Save 5% OFF',
    discountPercent: 5,
    minSpend: 4000,
    type: 'percent'
  }
];

const CheckoutShipping = ({ cartItems = [], cartTotal: propCartTotal }) => {
  const navigate = useNavigate();

  // 1. Cart Items & Subtotal Setup
  const [items, setItems] = useState([]);
  const [subTotal, setSubTotal] = useState(0);

  useEffect(() => {
    // Read from props or localStorage
    if (cartItems && cartItems.length > 0) {
      setItems(cartItems);
      const total = cartItems.reduce((acc, item) => {
        const p = parseFloat(String(item.price || item.unitPrice || 0).replace(/[₹,]/g, ''));
        const q = item.qty || item.quantity || 1;
        return acc + p * q;
      }, 0);
      setSubTotal(propCartTotal || total);
    } else {
      try {
        const saved = localStorage.getItem('cart') || localStorage.getItem('seedhegaonse_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          setItems(parsed);
          const total = parsed.reduce((acc, item) => {
            const p = parseFloat(String(item.price || item.unitPrice || 0).replace(/[₹,]/g, ''));
            const q = item.qty || item.quantity || 1;
            return acc + p * q;
          }, 0);
          setSubTotal(total);
        } else {
          // Fallback dummy subtotal if opened directly
          setSubTotal(360);
        }
      } catch {
        setSubTotal(360);
      }
    }
  }, [cartItems, propCartTotal]);

  // 2. Shipping Delivery Type ('standard' | 'self_pickup' | 'founder')
  const [deliveryType, setDeliveryType] = useState('standard');

  // 3. Gift Box Packaging (+₹50)
  const [giftPackaging, setGiftPackaging] = useState(true);

  // 4. Coupons State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });

  // 5. Shipping Address Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    addressType: 'Permanent',
    address: '',
    state: '',
    city: '',
    zipcode: '',
    country: 'India',
    saveAddress: true
  });

  const [formErrors, setFormErrors] = useState({});

  // Auto-fill logged-in user if available
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user') || localStorage.getItem('currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || '',
          phone: parsed.phone || '',
          city: parsed.city || '',
          address: parsed.address || '',
          state: parsed.state || '',
          zipcode: parsed.zipcode || parsed.pincode || ''
        }));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Shipping Fee Calculation
  const getShippingFee = () => {
    if (deliveryType === 'self_pickup') return 0;
    if (deliveryType === 'founder') return 5000;
    // Standard: Free if subtotal >= 999 else 0 (or configured base fee)
    return subTotal >= 999 ? 0 : 0;
  };

  const shippingFee = getShippingFee();

  // Coupon Discount Calculation
  const getCouponDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'fixed') return appliedCoupon.discountAmount;
    if (appliedCoupon.type === 'percent') return Math.round((subTotal * appliedCoupon.discountPercent) / 100);
    return 0;
  };

  const couponDiscount = getCouponDiscount();
  const giftBoxFee = giftPackaging ? 50 : 0;
  const taxAmount = Math.round((subTotal - couponDiscount) * 0.05); // 5% GST (e.g. ₹18 on ₹360)
  const grandTotal = Math.max(0, subTotal - couponDiscount + shippingFee + taxAmount + giftBoxFee);

  // Handle Form Change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Coupon Apply logic
  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponMessage({ text: 'Please enter a coupon code.', type: 'error' });
      return;
    }

    const found = COUPONS_LIST.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setCouponMessage({ text: 'Invalid coupon code.', type: 'error' });
      return;
    }

    if (subTotal < found.minSpend) {
      setCouponMessage({
        text: `Spend ₹${(found.minSpend - subTotal).toFixed(2)} more to use ${found.code}!`,
        type: 'error'
      });
      return;
    }

    setAppliedCoupon(found);
    setCouponCodeInput(found.code);
    setCouponMessage({ text: `🎉 Coupon "${found.code}" applied successfully!`, type: 'success' });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponMessage({ text: '', type: '' });
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Contact person name is required';
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.address.trim()) errors.address = 'Street address is required';
    if (!formData.state) errors.state = 'Please select a State / UT';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.zipcode.trim()) {
      errors.zipcode = 'Zip code is required';
    } else if (!/^[0-9]{6}$/.test(formData.zipcode.trim())) {
      errors.zipcode = 'Enter a valid 6-digit zip code';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Proceed to Payment
  const handleProceedToCheckout = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    const checkoutSummary = {
      customer: formData,
      deliveryType,
      subTotal,
      couponDiscount,
      shippingFee,
      taxAmount,
      giftBoxFee,
      grandTotal,
      appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
      items
    };

    localStorage.setItem('checkout_summary', JSON.stringify(checkoutSummary));
    // Navigate to payment page
    navigate('/checkout-payment');
  };

  const getShippingMethodLabel = () => {
    if (deliveryType === 'standard') return 'STANDARD';
    if (deliveryType === 'self_pickup') return 'SELF PICKUP';
    if (deliveryType === 'founder') return 'DELIVERED BY FOUNDER';
    return 'NOT SELECTED';
  };

  return (
    <div className="checkout-shipping-page">
      {/* 🟢 FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/919315911105"
        className="floating-wa-btn"
        target="_blank"
        rel="noreferrer"
        title="WhatsApp Support"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.343c1.468.802 3.123 1.225 4.887 1.226 5.507 0 9.989-4.478 9.99-9.985 0-5.507-4.482-9.998-9.987-9.998zm5.83 14.364c-.244.685-1.41 1.309-1.974 1.393-.505.075-1.144.106-1.844-.117-.424-.135-.97-.315-1.67-.616-2.937-1.268-4.854-4.258-5.001-4.453-.146-.195-1.195-1.591-1.195-3.033 0-1.441.758-2.151 1.026-2.443.268-.293.585-.366.78-.366.195 0 .39.002.561.01.18.008.421-.068.66.505.244.585.833 2.03.906 2.176.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.307.382-.439.513-.146.146-.298.305-.128.597.171.293.758 1.252 1.626 2.025 1.118.995 2.062 1.304 2.355 1.45.293.146.463.122.634-.073.171-.195.732-.853.927-1.146.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.951.293.146.488.22.561.341.073.122.073.71-.171 1.395z" />
        </svg>
      </a>

      {/* 🟢 FLOATING SCROLL TO TOP */}
      <button
        type="button"
        className="floating-scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Scroll to Top"
      >
        ▲
      </button>

      <div className="checkout-container">
        {/* PAGE TITLE */}
        <h1 className="checkout-main-title">SHIPPING AND BILLING ADDRESS</h1>

        {/* STEPPER PROGRESS BAR */}
        <div className="checkout-stepper-wrap">
          <div className="stepper-track-line">
            <div className="stepper-fill-line" style={{ width: '50%' }}></div>
          </div>

          <div className="stepper-step completed">
            <div className="step-circle">👤</div>
            <span className="step-label">Sign in / Sign up</span>
          </div>

          <div className="stepper-step active">
            <div className="step-circle">📦</div>
            <span className="step-label">Shipping And Billing</span>
          </div>

          <div className="stepper-step">
            <div className="step-circle">💳</div>
            <span className="step-label">Payment</span>
          </div>
        </div>

        {/* TWO COLUMN CONTENT LAYOUT */}
        <div className="checkout-columns-grid">
          
          {/* ── LEFT COLUMN: SHIPPING TYPE & ADDRESS FORM ── */}
          <div className="checkout-left-col">
            
            {/* 1. CHOOSE SHIPPING DELIVERY TYPE */}
            <div className="checkout-section-card">
              <h2 className="section-block-title">Choose shipping delivery type</h2>

              <div className="delivery-types-list">
                {/* Option 1: Standard */}
                <label className={`delivery-type-option ${deliveryType === 'standard' ? 'selected' : ''}`}>
                  <div className="dto-radio-wrap">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="standard"
                      checked={deliveryType === 'standard'}
                      onChange={() => setDeliveryType('standard')}
                    />
                  </div>
                  <div className="dto-info">
                    <div className="dto-title-row">
                      <span className="dto-title">Standard Shipping / Home Delivery</span>
                    </div>
                    <p className="dto-subtext">
                      Standard local couriers or postal delivery options (+18% GST applies on shipping fee).
                    </p>
                  </div>
                </label>

                {/* Option 2: Self Pickup */}
                <label className={`delivery-type-option ${deliveryType === 'self_pickup' ? 'selected' : ''}`}>
                  <div className="dto-radio-wrap">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="self_pickup"
                      checked={deliveryType === 'self_pickup'}
                      onChange={() => setDeliveryType('self_pickup')}
                    />
                  </div>
                  <div className="dto-info">
                    <div className="dto-title-row">
                      <span className="dto-title">Self Pickup</span>
                      <span className="badge-free-pill">Free</span>
                    </div>
                    <p className="dto-subtext">
                      Pick up your order directly from our main location at zero additional shipping cost.
                    </p>
                  </div>
                </label>

                {/* Option 3: Delivered by Founder */}
                <label className={`delivery-type-option ${deliveryType === 'founder' ? 'selected' : ''}`}>
                  <div className="dto-radio-wrap">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="founder"
                      checked={deliveryType === 'founder'}
                      onChange={() => setDeliveryType('founder')}
                    />
                  </div>
                  <div className="dto-info">
                    <div className="dto-title-row">
                      <span className="dto-title">Delivered by Founder</span>
                      <span className="badge-founder-fee">+ ₹5,000.00</span>
                    </div>
                    <p className="dto-subtext">
                      Exclusive personalized premier priority delivery completed directly by our founder.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. SHIPPING ADDRESS FORM */}
            <div className="checkout-section-card">
              <div className="address-header-radio">
                <span className="radio-dot-circle">🔘</span>
                <h3 className="section-block-title no-margin">Shipping Address</h3>
              </div>

              <form onSubmit={handleProceedToCheckout} className="shipping-address-form">
                {/* Contact Person Name */}
                <div className="form-group-item">
                  <label>Contact person name <span className="req-star">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={formErrors.name ? 'input-error' : ''}
                  />
                  {formErrors.name && <span className="field-err-msg">{formErrors.name}</span>}
                </div>

                {/* Phone */}
                <div className="form-group-item">
                  <label>Phone <span className="req-star">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength="10"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    className={formErrors.phone ? 'input-error' : ''}
                  />
                  {formErrors.phone && <span className="field-err-msg">{formErrors.phone}</span>}
                </div>

                {/* Address Type Dropdown */}
                <div className="form-group-item">
                  <label>Address Type</label>
                  <select
                    name="addressType"
                    value={formData.addressType}
                    onChange={handleInputChange}
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Home">Home</option>
                    <option value="Office / Work">Office / Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Address Textarea */}
                <div className="form-group-item">
                  <label>Address <span className="req-star">*</span></label>
                  <textarea
                    rows="3"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House / Flat No., Building, Street Area, Landmark"
                    className={formErrors.address ? 'input-error' : ''}
                  />
                  {formErrors.address && <span className="field-err-msg">{formErrors.address}</span>}
                </div>

                {/* State / UT Dropdown */}
                <div className="form-group-item">
                  <label>State / Union Territory <span className="req-star">*</span></label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={formErrors.state ? 'input-error' : ''}
                  >
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {formErrors.state && <span className="field-err-msg">{formErrors.state}</span>}
                </div>

                {/* City */}
                <div className="form-group-item">
                  <label>City <span className="req-star">*</span></label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city / district"
                    className={formErrors.city ? 'input-error' : ''}
                  />
                  {formErrors.city && <span className="field-err-msg">{formErrors.city}</span>}
                </div>

                {/* Zip Code */}
                <div className="form-group-item">
                  <label>Zip code <span className="req-star">*</span></label>
                  <input
                    type="text"
                    name="zipcode"
                    maxLength="6"
                    value={formData.zipcode}
                    onChange={handleInputChange}
                    placeholder="Enter 6 digit zip code"
                    className={formErrors.zipcode ? 'input-error' : ''}
                  />
                  {formErrors.zipcode && <span className="field-err-msg">{formErrors.zipcode}</span>}
                </div>

                {/* Country */}
                <div className="form-group-item">
                  <label>Country <span className="req-star">*</span></label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                  >
                    <option value="India">India</option>
                  </select>
                </div>

                {/* Save Address Checkbox */}
                <div className="form-checkbox-row">
                  <input
                    type="checkbox"
                    id="saveAddressCheckbox"
                    name="saveAddress"
                    checked={formData.saveAddress}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="saveAddressCheckbox">Save this address</label>
                </div>
              </form>
            </div>

          </div>

          {/* ── RIGHT COLUMN: SUMMARY & COUPONS ── */}
          <div className="checkout-right-col">
            
            {/* 1. ORDER SUMMARY CARD */}
            <div className="summary-sticky-card">
              
              {/* Shipping Method Header Tag */}
              <div className="shipping-method-badge-row">
                <span className="smb-label">🚚 Shipping Method:</span>
                <span className="smb-status-pill">{getShippingMethodLabel()}</span>
              </div>

              {/* Price Breakdown */}
              <div className="summary-price-breakdown">
                <div className="sp-row">
                  <span>Sub total</span>
                  <span className="sp-val">₹{subTotal.toFixed(2)}</span>
                </div>

                <div className="sp-row text-red-discount">
                  <span>Coupon discount</span>
                  <span className="sp-val">- ₹{couponDiscount.toFixed(2)}</span>
                </div>

                <div className="sp-row text-red-discount">
                  <span>Discount on product</span>
                  <span className="sp-val">- ₹0.00</span>
                </div>

                <div className="sp-row">
                  <span>Shipping</span>
                  <span className="sp-val">
                    {shippingFee === 0 ? '₹0.00' : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="sp-row">
                  <span>Total Tax <span className="info-icon" title="5% GST on items">ⓘ</span></span>
                  <span className="sp-val">₹{taxAmount.toFixed(2)}</span>
                </div>

                {/* Gift Box Packaging Toggle */}
                <label className="gift-packaging-row">
                  <div className="gpr-left">
                    <input
                      type="checkbox"
                      checked={giftPackaging}
                      onChange={(e) => setGiftPackaging(e.target.checked)}
                    />
                    <span className="gpr-text">🎁 Gift Box Packaging</span>
                  </div>
                  <span className="gpr-price">+ ₹50.00</span>
                </label>

                <div className="sp-divider"></div>

                <div className="sp-total-row">
                  <span>Total</span>
                  <span className="sp-grand-total">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div className="coupon-action-box">
                <div className="coupon-input-wrap">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-apply-maroon"
                    onClick={() => handleApplyCoupon()}
                  >
                    Apply code
                  </button>
                </div>

                {couponMessage.text && (
                  <div className={`coupon-msg-alert ${couponMessage.type}`}>
                    <span>{couponMessage.text}</span>
                    {appliedCoupon && (
                      <button type="button" className="btn-remove-code" onClick={handleRemoveCoupon}>
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="summary-nav-buttons">
                <button
                  type="button"
                  className="btn-summary-nav"
                  onClick={() => navigate(-1)}
                >
                  ◀ Continue shopping
                </button>
                <button
                  type="button"
                  className="btn-summary-nav"
                  onClick={handleProceedToCheckout}
                >
                  Checkout ▶
                </button>
              </div>
            </div>

            {/* 2. AVAILABLE OFFERS & COUPONS CARD */}
            <div className="available-coupons-card">
              <div className="acc-header">
                <span className="acc-tag-icon">🏷️</span>
                <h3>Available Offers & Coupons</h3>
              </div>

              <div className="coupons-items-list">
                {COUPONS_LIST.map((coupon) => {
                  const isEligible = subTotal >= coupon.minSpend;
                  const neededAmount = coupon.minSpend - subTotal;
                  const isCurrentApplied = appliedCoupon?.code === coupon.code;

                  return (
                    <div key={coupon.code} className="coupon-offer-item">
                      <div className="coi-left">
                        <div className="coi-ticket-icon">🏷️</div>
                        <div className="coi-text-details">
                          <h4>{coupon.title}</h4>
                          <span className="coi-code-sub">Use code <strong>{coupon.code}</strong></span>
                          {!isEligible && (
                            <span className="coi-lock-hint">
                              🔒 Spend ₹{neededAmount.toFixed(2)} more (Min: ₹{coupon.minSpend.toLocaleString('en-IN')}.00)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="coi-right">
                        {isCurrentApplied ? (
                          <span className="badge-applied-pill">Applied</span>
                        ) : isEligible ? (
                          <button
                            type="button"
                            className="btn-apply-coupon-item"
                            onClick={() => handleApplyCoupon(coupon.code)}
                          >
                            Apply
                          </button>
                        ) : (
                          <button type="button" className="btn-locked-pill" disabled>
                            Locked
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default CheckoutShipping;