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

// Helper: 2 Decimal precision safely without floating point glitch
const round2 = (num) => {
  const n = parseFloat(num) || 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

// Helper: Clean currency display with exact 2 decimal places
const formatMoney = (val) => {
  return Number(val || 0).toFixed(2);
};

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
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  return parseFloat(String(val || 0).replace(/[₹,]/g, '').trim()) || 0;
};

// Extract MongoDB ObjectId from cart item ID
const extractObjectId = (val) => {
  const match = String(val || '').match(/[0-9a-fA-F]{24}/);
  return match ? match[0] : null;
};

const nameKey = (val) => String(val || '').trim().toLowerCase();

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
  const [unlockedOrderCoupons, setUnlockedOrderCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  // 🎫 User ke saved coupons (Backend Database se load honge)
  const [savedCoupons, setSavedCoupons] = useState(() => {
    try {
      const cached = localStorage.getItem('sgs_saved_coupons');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Fetch the logged-in user's saved coupon wallet from backend when cart opens
  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/coupons/my-coupons`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.savedCoupons)) {
          setSavedCoupons(data.savedCoupons);
          try {
            localStorage.setItem('sgs_saved_coupons', JSON.stringify(data.savedCoupons));
          } catch {}
        }
      } catch (err) {
        console.error('Unable to load saved coupons from profile:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // 🎁 Gift Packaging Box + 🧾 Tax — values admin panel se aati hain
  const [isGiftBoxSelected, setIsGiftBoxSelected] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    giftBoxEnabled: true,
    giftBoxTitle: 'Gift Box Packaging',
    giftBoxCharge: 50,
    productTaxPercent: 5,
    shippingTaxPercent: 5
  });

  const GIFT_BOX_CHARGE = Number(storeSettings.giftBoxCharge) || 0;
  const GIFT_BOX_TITLE = storeSettings.giftBoxTitle || 'Gift Box Packaging';
  const PRODUCT_TAX_PERCENT = Number(storeSettings.productTaxPercent) || 0;
  const SHIPPING_TAX_PERCENT = Number(storeSettings.shippingTaxPercent) || 0;

  const FOUNDER_DELIVERY_CHARGE = 5000.00;

  // Tax Info Popup Hover State
  const [showTaxInfo, setShowTaxInfo] = useState(false);

  // Shipping Mode persisted from localStorage
  const [shippingMode, setShippingMode] = useState(() => {
    try {
      return localStorage.getItem('cart_shipping_mode') || '';
    } catch {
      return '';
    }
  });

  // Pincode Delivery Charge States
  const [pincodeDeliveryCharge, setPincodeDeliveryCharge] = useState(null);
  const [pincodeStatusMsg, setPincodeStatusMsg] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [upiRef, setUpiRef] = useState('');

  // Store product & cake offers from API
  const [productOffers, setProductOffers] = useState({});
  const [offersLoading, setOffersLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 860 : false
  );
  const [isSmallMobile, setIsSmallMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 480 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 860);
      setIsSmallMobile(window.innerWidth <= 480);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist shipping mode to localStorage
  useEffect(() => {
    try {
      if (shippingMode) {
        localStorage.setItem('cart_shipping_mode', shippingMode);
      }
    } catch (err) {
      console.error(err);
    }
  }, [shippingMode]);

  // 🟢 Admin panel se Gift Box + Tax settings load karo
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/delivery/settings`);
        const data = await res.json();
        if (!cancelled && res.ok && data?.settings) {
          const s = data.settings;
          setStoreSettings({
            giftBoxEnabled: s.giftBoxEnabled !== false,
            giftBoxTitle: s.giftBoxTitle || 'Gift Box Packaging',
            giftBoxCharge: s.giftBoxCharge ?? 50,
            productTaxPercent: s.productTaxPercent ?? 5,
            shippingTaxPercent: s.shippingTaxPercent ?? 5
          });
        }
      } catch (err) {
        console.error('Store settings load error:', err);
      }
    };

    loadSettings();
    return () => { cancelled = true; };
  }, [isOpen]);

  // 🟢 Fetch BOTH Sweets & Cakes offers from API
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadOffers = async () => {
      setOffersLoading(true);
      try {
        const [resProducts, resCakes] = await Promise.allSettled([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/cakes`)
        ]);

        const map = {};

        const processList = async (res) => {
          if (res.status === 'fulfilled' && res.value.ok) {
            const data = await res.value.json();
            if (Array.isArray(data)) {
              data.forEach((p) => {
                const entry = {
                  giftTiers: ensureArray(p.giftTiers),
                  couponsList: ensureArray(p.couponsList),
                  bulkTiers: ensureArray(p.bulkTiers),
                  quantityDiscounts: ensureArray(
                    p.quantityDiscounts || p.qtyDiscounts || p.packDiscounts || p.quantityTiers || p.packTiers
                  ),
                  highValueThreshold: p.highValueThreshold,
                  highValueDiscountPercent: p.highValueDiscountPercent,
                  isFreeDelivery: p.isFreeDelivery
                };
                if (p._id) map[String(p._id)] = entry;
                if (p.name) {
                  map[`name:${nameKey(p.name)}`] = entry;
                  const cleanName = nameKey(String(p.name).replace(/\s*\([^)]*\)\s*$/, ''));
                  map[`name:${cleanName}`] = entry;
                }
              });
            }
          }
        };

        await processList(resProducts);
        await processList(resCakes);

        if (!cancelled) setProductOffers(map);
      } catch (err) {
        console.error('Unable to load product/cake offers:', err);
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    };

    loadOffers();
    return () => { cancelled = true; };
  }, [isOpen, cartItems.length]);

  // 🟢 Merge Cart Items with Sweets & Cakes Offers
  const enrichedCartItems = cartItems.map((item) => {
    const idKey = extractObjectId(item.productId) || extractObjectId(item.id) || String(item.productId || '');
    const cleanBaseName = nameKey(String(item.name || '').replace(/\s*\([^)]*\)\s*$/, ''));
    const offers = productOffers[idKey] ||
                   productOffers[`name:${nameKey(item.name)}`] ||
                   productOffers[`name:${cleanBaseName}`] || {};

    const pick = (local, remote) => {
      const remoteArr = ensureArray(remote);
      return remoteArr.length > 0 ? remoteArr : ensureArray(local);
    };

    return {
      ...item,
      giftTiers: pick(item.giftTiers, offers.giftTiers),
      couponsList: pick(item.couponsList, offers.couponsList),
      bulkTiers: pick(item.bulkTiers, offers.bulkTiers),
      quantityDiscounts: pick(
        item.quantityDiscounts || item.qtyDiscounts || item.packDiscounts,
        offers.quantityDiscounts
      ),
      highValueThreshold: parseNumericPrice(offers.highValueThreshold) > 0
        ? offers.highValueThreshold
        : item.highValueThreshold,
      highValueDiscountPercent: parseNumericPrice(offers.highValueDiscountPercent) > 0
        ? offers.highValueDiscountPercent
        : item.highValueDiscountPercent,
      isFreeDelivery: offers.isFreeDelivery !== undefined
        ? isTrueFlag(offers.isFreeDelivery)
        : isTrueFlag(item.isFreeDelivery)
    };
  });

  // Shipping Address with localStorage fallback
  const [shippingAddress, setShippingAddress] = useState(() => {
    try {
      const cached = localStorage.getItem('cart_shipping_address');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
    const savedUser = getSavedUser();
    return {
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
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart_shipping_address', JSON.stringify(shippingAddress));
    } catch (err) {
      console.error(err);
    }
  }, [shippingAddress]);

  // 🟢 If the user has a saved profile address (e.g. saved earlier from the
  // Cart, or added/edited on the Profile Info page) and the cart doesn't
  // already have a filled-in address, pull it in automatically once logged in.
  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    if (!token) return;
    if (shippingAddress.address && shippingAddress.address.trim()) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.address) {
          setShippingAddress((prev) => ({
            ...prev,
            name: prev.name || data.name || '',
            phone: prev.phone || data.phone || '',
            addressType: data.addressType || prev.addressType,
            address: data.address || prev.address,
            landmark: data.landmark || prev.landmark,
            state: data.state || prev.state,
            city: data.city || prev.city,
            pincode: data.pincode || prev.pincode,
            country: data.country || prev.country
          }));
        }
      } catch (err) {
        console.error('Unable to load saved profile address:', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

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
        const rate = parseNumericPrice(data.deliveryCharge);
        setPincodeDeliveryCharge(rate);
        if (data.city) {
          setShippingAddress((prev) => ({ ...prev, city: data.city }));
        }
        setPincodeStatusMsg(`✓ Standard Delivery: ₹${formatMoney(rate)} (${data.city || 'Serviceable Area'})`);
        setError('');
      } else {
        setPincodeDeliveryCharge(null);
        setPincodeStatusMsg(`⚠️ ${data.message || 'Delivery is currently not available for this pincode.'}`);
      }
    } catch {
      setPincodeDeliveryCharge(null);
      setPincodeStatusMsg('⚠️ Unable to verify delivery charges for this pincode.');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  useEffect(() => {
    if (shippingMode === 'delivery' && shippingAddress.pincode && shippingAddress.pincode.length === 6) {
      fetchDeliveryChargeByPincode(shippingAddress.pincode);
    }
  }, [shippingMode, shippingAddress.pincode]);

  const handlePincodeChange = (e) => {
    const newPin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setShippingAddress((prev) => ({ ...prev, pincode: newPin }));
    if (newPin.length === 6 && shippingMode === 'delivery') {
      fetchDeliveryChargeByPincode(newPin);
    } else if (newPin.length !== 6) {
      setPincodeDeliveryCharge(null);
      setPincodeStatusMsg('');
    }
  };

  const handlePhoneChange = (e) => {
    const newPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
    setShippingAddress((prev) => ({ ...prev, phone: newPhone }));
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('cart');
      setError('');
      setLoading(false);
      setShowTaxInfo(false);
      setUnlockedOrderCoupons([]);
    }, 300);
  };

  const rawSubTotal = enrichedCartItems.reduce((acc, item) => {
    const uPrice = parseNumericPrice(item.unitPrice || item.price);
    const q = Number(item.qty || item.quantity || 1);
    return acc + (uPrice * q);
  }, 0);
  const effectiveCartTotal = round2(rawSubTotal);

  // 📦 CALCULATE QUANTITY / PACK DISCOUNTS
  let itemQtyDiscountsTotal = 0;
  const itemAppliedQtyDiscounts = {};

  enrichedCartItems.forEach((item) => {
    const q = Number(item.qty || item.quantity || 1);
    const uPrice = parseNumericPrice(item.unitPrice || item.price);
    const itemSub = round2(uPrice * q);

    const rawQtySlabs = ensureArray(item.quantityDiscounts || item.qtyDiscounts || item.packDiscounts || item.quantityTiers);
    if (rawQtySlabs.length > 0) {
      const validSlabs = rawQtySlabs
        .map((qd) => ({
          minQty: parseNumericPrice(qd.minQty ?? qd.minPacks ?? qd.minQuantity ?? qd.qty ?? qd.quantity ?? qd.packs ?? qd.min ?? 0),
          discountVal: parseNumericPrice(qd.discountPercent ?? qd.discountPercentage ?? qd.discount ?? qd.discountValue ?? qd.percent ?? qd.extraDiscount ?? 0),
          discountType: qd.discountType || 'percentage'
        }))
        .filter((s) => s.minQty > 0 && s.discountVal > 0)
        .sort((a, b) => b.minQty - a.minQty);

      const activeSlab = validSlabs.find((s) => q >= s.minQty);
      if (activeSlab) {
        const disc = activeSlab.discountType === 'percentage'
          ? round2((itemSub * activeSlab.discountVal) / 100)
          : round2(activeSlab.discountVal * q);
        itemQtyDiscountsTotal += disc;
        itemAppliedQtyDiscounts[item.id] = {
          percent: activeSlab.discountVal,
          minQty: activeSlab.minQty,
          discountAmount: disc
        };
      }
    }
  });

  // Calculate Spend-based Bulk Tiers
  let bulkSpendDiscount = 0;
  const allCartBulkTiers = [];
  enrichedCartItems.forEach((item) => {
    const rawTiers = ensureArray(item.bulkTiers);
    if (rawTiers.length > 0) {
      rawTiers.forEach((b) => {
        if (parseNumericPrice(b.minSpend) > 0) {
          allCartBulkTiers.push({
            minSpend: parseNumericPrice(b.minSpend),
            discountValue: parseNumericPrice(b.discountValue || b.discountPercent || 0),
            discountType: b.discountType || 'percentage'
          });
        }
      });
    } else if (parseNumericPrice(item.highValueThreshold) > 0) {
      allCartBulkTiers.push({
        minSpend: parseNumericPrice(item.highValueThreshold),
        discountValue: parseNumericPrice(item.highValueDiscountPercent || 10),
        discountType: 'percentage'
      });
    }
  });

  const sortedBulkTiers = allCartBulkTiers.sort((a, b) => b.minSpend - a.minSpend);
  if (sortedBulkTiers.length > 0) {
    const activeTier = sortedBulkTiers.find((t) => effectiveCartTotal >= t.minSpend);
    if (activeTier) {
      const calcDiscount = activeTier.discountType === 'flat'
        ? activeTier.discountValue
        : (effectiveCartTotal * activeTier.discountValue) / 100;
      bulkSpendDiscount = round2(calcDiscount);
    }
  }

  const bulkDiscount = round2(itemQtyDiscountsTotal + bulkSpendDiscount);

  // Available Dynamic Coupons List from Fetched Products/Cakes
  const availableCoupons = [];
  const seenCouponCodes = new Set();
  enrichedCartItems.forEach((item) => {
    ensureArray(item.couponsList).forEach((c) => {
      const code = String(c.code || '').trim().toUpperCase();
      if (!code || seenCouponCodes.has(code)) return;
      seenCouponCodes.add(code);

      const minSpend = parseNumericPrice(c.minSpend);
      const validUntil = c.validUntil ? new Date(c.validUntil) : null;
      const hasValidDate = validUntil && !isNaN(validUntil.getTime());
      const isExpired = hasValidDate && validUntil < new Date();

      availableCoupons.push({
        code,
        discountType: c.discountType || 'flat',
        discountValue: parseNumericPrice(c.discountValue),
        minSpend,
        validUntil: hasValidDate ? validUntil : null,
        isExpired,
        isUnlocked: !isExpired && effectiveCartTotal >= minSpend,
        remaining: round2(Math.max(0, minSpend - effectiveCartTotal)),
        productName: item.name
      });
    });
  });

  // Gift Tiers Roadmap
  const giftTierRows = [];
  enrichedCartItems.forEach((item) => {
    const tiers = [];
    const rawTiers = ensureArray(item.giftTiers);

    if (rawTiers.length > 0) {
      rawTiers.forEach((gt) => {
        if (gt) {
          const rawMin = gt.minSpend ?? gt.minOrder ?? gt.threshold ?? gt.minAmount ?? gt.spend ?? gt.amount ?? gt.orderValue;
          const minSpend = parseNumericPrice(rawMin);
          const giftTitle = gt.giftTitle || gt.title || gt.name || gt.giftName || gt.gift || 'Special Gift';
          if (minSpend > 0 || giftTitle) {
            tiers.push({ minSpend, giftTitle });
          }
        }
      });
    } else if (parseNumericPrice(item.giftMinSpend || item.minOrder || item.giftThreshold) > 0 || item.giftTitle) {
      tiers.push({
        minSpend: parseNumericPrice(item.giftMinSpend || item.minOrder || item.giftThreshold),
        giftTitle: item.giftTitle || 'Special Free Gift'
      });
    }

    if (tiers.length === 0) return;

    const itemQty = Number(item.qty || item.quantity || 1) || 1;
    const itemUnitPrice = parseNumericPrice(item.unitPrice || item.price || item.sellingPrice || item.salePrice || 0);
    const calculatedSubTotal = round2(itemUnitPrice * itemQty);
    const itemSubTotal = calculatedSubTotal > 0 ? calculatedSubTotal : round2(parseNumericPrice(item.totalPrice) || effectiveCartTotal);

    const sortedTiers = tiers.sort((a, b) => a.minSpend - b.minSpend);

    const activeUnlockedTier = [...sortedTiers]
      .reverse()
      .find((t) => itemSubTotal >= t.minSpend && t.minSpend > 0);

    sortedTiers.forEach((gt, idx) => {
      const isThisUnlocked = Boolean(
        activeUnlockedTier &&
        activeUnlockedTier.minSpend === gt.minSpend &&
        activeUnlockedTier.giftTitle === gt.giftTitle
      );
      const remainingAmount = round2(Math.max(0, gt.minSpend - itemSubTotal));

      giftTierRows.push({
        key: `${item.id || item.productId || idx}-tier-${idx}`,
        productName: item.name,
        giftTitle: gt.giftTitle,
        minSpend: gt.minSpend,
        itemSubTotal,
        isUnlocked: isThisUnlocked,
        remaining: remainingAmount
      });
    });
  });

  const isFreeDelivery = enrichedCartItems.some((i) => isTrueFlag(i.isFreeDelivery));
  let shippingCharge = 0;

  if (shippingMode === 'pickup') {
    shippingCharge = 0;
  } else if (shippingMode === 'founder') {
    shippingCharge = FOUNDER_DELIVERY_CHARGE;
  } else if (shippingMode === 'delivery') {
    shippingCharge = isFreeDelivery ? 0 : (pincodeDeliveryCharge !== null ? pincodeDeliveryCharge : 0);
  }
  shippingCharge = round2(shippingCharge);

  const couponDiscount = round2(appliedCoupon ? parseNumericPrice(appliedCoupon.discount) : 0);
  const taxableProductAmount = round2(Math.max(0, effectiveCartTotal - couponDiscount - bulkDiscount));

  // 🧾 Tax calculation
  const productTax = round2((taxableProductAmount * PRODUCT_TAX_PERCENT) / 100);
  const shippingTax = (shippingCharge > 0) ? round2((shippingCharge * SHIPPING_TAX_PERCENT) / 100) : 0;
  const totalTaxAmount = round2(productTax + shippingTax);

  // 🎁 Gift box
  const giftBoxAvailable = storeSettings.giftBoxEnabled && GIFT_BOX_CHARGE > 0;
  const giftBoxAmount = (giftBoxAvailable && isGiftBoxSelected) ? GIFT_BOX_CHARGE : 0;

  const grandTotal = round2(
    Math.max(0, taxableProductAmount + (shippingMode ? shippingCharge : 0) + totalTaxAmount + giftBoxAmount)
  );

  const handleProceedToCheckout = () => {
    if (!shippingMode) {
      alert('⚠️ Please select a delivery option first (Mandatory).');
      return;
    }
    if (shippingMode === 'delivery' && (!shippingAddress.pincode || shippingAddress.pincode.length !== 6)) {
      alert('⚠️ Delivery Pincode is Mandatory. Please enter a valid 6-digit Pincode to check and calculate delivery charges.');
      return;
    }
    if (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) {
      alert('⚠️ Please enter a valid serviceable 6-digit Pincode to calculate delivery charges.');
      return;
    }
    if (shippingMode === 'founder' && (!shippingAddress.pincode || shippingAddress.pincode.length !== 6)) {
      alert('⚠️ Please enter your 6-digit Pincode for Founder Delivery.');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setStep('auth-required');
      return;
    }
    setStep('checkout');
  };

  // 🟢 APPLY COUPON
  const handleApplyCoupon = async (overrideCode) => {
    const rawCode = typeof overrideCode === 'string' ? overrideCode : couponCode;
    if (!rawCode.trim()) return setCouponMsg({ text: 'Please enter a coupon code.', type: 'error' });
    const upper = rawCode.trim().toUpperCase();
    setCouponCode(upper);

    // 1. Check in Dynamic Product Offers
    for (const item of enrichedCartItems) {
      const coupons = ensureArray(item.couponsList);
      const matched = coupons.find((c) => String(c.code || '').toUpperCase() === upper);
      if (matched) {
        const minSpend = parseNumericPrice(matched.minSpend);
        if (effectiveCartTotal < minSpend) {
          return setCouponMsg({
            text: `🔒 Add ₹${formatMoney(round2(minSpend - effectiveCartTotal))} more to use ${upper} (min spend ₹${formatMoney(minSpend)}).`,
            type: 'error'
          });
        }

        const validUntil = matched.validUntil ? new Date(matched.validUntil) : null;
        if (validUntil && !isNaN(validUntil.getTime()) && validUntil < new Date()) {
          return setCouponMsg({ text: `⌛ Coupon ${upper} has expired.`, type: 'error' });
        }

        const discVal = parseNumericPrice(matched.discountValue);
        const finalDisc = matched.discountType === 'percentage'
          ? round2((effectiveCartTotal * discVal) / 100)
          : discVal;
        setAppliedCoupon({ code: upper, discount: finalDisc });
        return setCouponMsg({ text: `🎉 Coupon ${upper} applied successfully!`, type: 'success' });
      }
    }

    // 2. Check in User's Saved Wallet Coupons
    const savedMatched = savedCoupons.find((sc) => String(sc.code || '').toUpperCase() === upper);
    if (savedMatched) {
      const minSpend = parseNumericPrice(savedMatched.minSpend);
      if (effectiveCartTotal < minSpend) {
        return setCouponMsg({
          text: `🔒 Add ₹${formatMoney(round2(minSpend - effectiveCartTotal))} more to use ${upper} (min spend ₹${formatMoney(minSpend)}).`,
          type: 'error'
        });
      }
      const validUntil = savedMatched.validUntil ? new Date(savedMatched.validUntil) : null;
      if (validUntil && !isNaN(validUntil.getTime()) && validUntil < new Date()) {
        return setCouponMsg({ text: `⌛ Coupon ${upper} has expired.`, type: 'error' });
      }
      const discVal = parseNumericPrice(savedMatched.discountValue);
      const finalDisc = savedMatched.discountType === 'percentage'
        ? round2((effectiveCartTotal * discVal) / 100)
        : discVal;
      setAppliedCoupon({ code: upper, discount: finalDisc });
      return setCouponMsg({ text: `🎉 Coupon ${upper} applied successfully!`, type: 'success' });
    }

    // 3. Fallback: Verify on backend
    try {
      const res = await fetch(`${API_BASE}/coupons/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: upper, cartTotal: effectiveCartTotal })
      });
      const data = await res.json();
      if (!res.ok) return setCouponMsg({ text: data.message || 'Invalid coupon code.', type: 'error' });
      const serverDisc = round2(parseNumericPrice(data.discount));
      setAppliedCoupon({ code: data.code, discount: serverDisc });
      setCouponMsg({ text: data.message || 'Coupon applied successfully!', type: 'success' });
    } catch {
      setCouponMsg({ text: 'Unable to verify coupon. Please try again.', type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMsg({ text: '', type: '' });
  };

  const handleRemoveSavedCoupon = async (code) => {
    const token = getAuthToken();
    if (!token) {
      setSavedCoupons((prev) => prev.filter((sc) => sc.code !== code));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/coupons/my-coupons/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.savedCoupons)) {
        setSavedCoupons(data.savedCoupons);
      } else {
        setSavedCoupons((prev) => prev.filter((sc) => sc.code !== code));
      }
    } catch {
      setSavedCoupons((prev) => prev.filter((sc) => sc.code !== code));
    }
  };

  // 🟢 Persist the current shipping address to the user's profile
  // (backed by /api/auth/profile, saved on the User model's address fields)
  const saveAddressToProfile = async (token) => {
    try {
      const payload = new FormData();
      payload.append('addressType', shippingAddress.addressType || 'Permanent');
      payload.append('address', shippingAddress.address || '');
      payload.append('landmark', shippingAddress.landmark || '');
      payload.append('state', shippingAddress.state || '');
      payload.append('city', shippingAddress.city || '');
      payload.append('pincode', shippingAddress.pincode || '');
      payload.append('country', shippingAddress.country || 'India');

      await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });
    } catch (err) {
      // Non-fatal — the order itself should still go through even if the
      // "save to profile" call fails for some reason.
      console.error('Unable to save address to profile:', err);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(shippingAddress.phone.trim())) {
      setError('⚠️ Please enter a valid 10-digit mobile number (starting with 6-9).');
      return;
    }

    if (isHomeDeliveryType && !shippingAddress.landmark.trim()) {
      setError('⚠️ Landmark / House / Floor details are required.');
      return;
    }

    const pinRegex = /^[1-9]\d{5}$/;
    if (isHomeDeliveryType && !pinRegex.test(shippingAddress.pincode.trim())) {
      setError('⚠️ Please enter a valid 6-digit Pincode.');
      return;
    }

    if (!sameAsShipping) {
      if (!phoneRegex.test(billingAddress.phone.trim())) {
        setError('⚠️ Please enter a valid 10-digit Billing Phone number.');
        return;
      }
      if (!billingAddress.landmark.trim()) {
        setError('⚠️ Billing Landmark details are required.');
        return;
      }
      if (!pinRegex.test(billingAddress.pincode.trim())) {
        setError('⚠️ Please enter a valid 6-digit Billing Pincode.');
        return;
      }
    }

    if (!shippingMode) {
      setError('Please select a shipping method.');
      return;
    }

    if (shippingMode === 'delivery' && !isFreeDelivery && pincodeDeliveryCharge === null) {
      setError('Delivery is not available for this pincode. Please try another pincode.');
      return;
    }

    if (paymentMethod === 'UPI' && !upiRef.trim()) {
      setError('⚠️ Please enter the UPI transaction / reference ID after making the payment.');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setStep('auth-required');
      return;
    }

    setLoading(true);
    try {
      const formattedCartItems = enrichedCartItems.map((item, idx) => {
        const numPrice = round2(parseNumericPrice(item.unitPrice || item.price));
        const quantity = Number(item.qty || item.quantity || 1);
        return {
          id: String(item.id || item.productId || `item-${idx}`),
          productId: item.productId || item.id || undefined,
          name: String(item.name || 'Store Item'),
          variant: String(item.variant || 'Standard'),
          price: numPrice,
          unitPrice: numPrice,
          qty: quantity,
          quantity: quantity,
          totalPrice: round2(numPrice * quantity),
          img: String(item.img || ''),
          isFreeDelivery: Boolean(item.isFreeDelivery)
        };
      });

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
        subTotal: round2(effectiveCartTotal),
        bulkDiscount: round2(bulkDiscount),
        couponDiscount: round2(couponDiscount),
        shippingCharge: round2(shippingCharge),
        productTax: round2(productTax),
        shippingTax: round2(shippingTax),
        taxAmount: round2(totalTaxAmount),
        giftBoxCharge: round2(giftBoxAmount),
        giftBoxTitle: giftBoxAmount > 0 ? GIFT_BOX_TITLE : '',
        totalAmount: round2(grandTotal),
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

      setPlacedOrderDetails({
        orderId: newOrderId,
        ...orderPayload,
        itemsSnapshot: [...formattedCartItems],
        createdAt: new Date().toLocaleString('en-IN')
      });

      // 🟢 SAVE ADDRESS TO PROFILE if the user opted in — so it shows up
      // (and can be edited) on the Profile Info page next time.
      if (shippingAddress.saveAddress) {
        await saveAddressToProfile(token);
      }

      // 🟢 DYNAMIC COUPONS AUTO-SAVE TO MONGO WALLET ON ORDER COMPLETION
      const nonExpiredFetchedCoupons = availableCoupons.filter((c) => !c.isExpired);
      setUnlockedOrderCoupons(nonExpiredFetchedCoupons);

      if (nonExpiredFetchedCoupons.length > 0) {
        try {
          await Promise.allSettled(
            nonExpiredFetchedCoupons.map((c) =>
              fetch(`${API_BASE}/coupons/my-coupons`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  code: c.code,
                  discountType: c.discountType || 'flat',
                  discountValue: parseNumericPrice(c.discountValue),
                  minSpend: parseNumericPrice(c.minSpend),
                  validUntil: c.validUntil ? new Date(c.validUntil).toISOString() : null,
                  productName: c.productName || 'Order Earned Coupon',
                  source: 'order-complete-reward'
                })
              })
            )
          );

          // Refresh coupons list from backend
          const resCoupons = await fetch(`${API_BASE}/coupons/my-coupons`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const cData = await resCoupons.json();
          if (resCoupons.ok && Array.isArray(cData.savedCoupons)) {
            setSavedCoupons(cData.savedCoupons);
            localStorage.setItem('sgs_saved_coupons', JSON.stringify(cData.savedCoupons));
          }
        } catch (cErr) {
          console.error('Auto save dynamic coupons error:', cErr);
        }
      }

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
        <div style={{ padding: isSmallMobile ? '14px 16px 10px' : '18px 24px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: isSmallMobile ? '1.1rem' : '1.4rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px', margin: 0 }}>
            SHOPPING CART
          </h2>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        <div className="cart-layout-scroll" style={{ padding: isSmallMobile ? '14px' : isMobile ? '16px' : '20px 24px', overflowY: 'auto' }}>
          {step === 'cart' && (
            enrichedCartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🛒</div>
                <h3 style={{ color: '#334155' }}>Your cart is empty!</h3>
                <button className="btn-continue-shopping" onClick={handleClose} style={{ marginTop: '14px', background: '#94191d', color: '#fff', padding: '10px 24px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Explore Sweets & Cakes
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.65fr 1fr', gap: isMobile ? '16px' : '24px', alignItems: 'start' }}>

                {/* 👈 LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Product List Card */}
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '2px solid #b91c1c' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                        Shop name : <strong style={{ color: '#0f172a' }}>Seedhe Gaon Se</strong>
                      </span>
                    </div>

                    {/* Product Rows */}
                    <div style={{ padding: '12px 18px' }}>
                      {enrichedCartItems.map((item) => {
                        const unitPrice = parseNumericPrice(item.unitPrice || item.price);
                        const qty = Number(item.qty || item.quantity || 1);
                        const lineTotal = round2(unitPrice * qty);
                        const activeQtyDisc = itemAppliedQtyDiscounts[item.id];

                        return (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                            
                            {/* Product Info Left */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <img
                                src={item.img || 'https://via.placeholder.com/60'}
                                alt={item.name}
                                style={{ width: isSmallMobile ? '52px' : '60px', height: isSmallMobile ? '52px' : '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }}
                              />
                              <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: isSmallMobile ? '0.85rem' : '0.9rem', fontWeight: '800', color: '#94191d', textTransform: 'uppercase' }}>
                                  {item.name}
                                </h4>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  Pack: {item.variant || 'Standard'} • ₹{formatMoney(unitPrice)}/pc
                                </div>
                                {activeQtyDisc && (
                                  <div style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: '700', marginTop: '3px' }}>
                                    🎉 {activeQtyDisc.percent}% Multi-Pack Discount Applied!
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stepper + Total */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                                  <button
                                    type="button"
                                    onClick={() => changeQty(item.id, -1)}
                                    style={{ width: '28px', height: '28px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    −
                                  </button>
                                  <span style={{ width: '32px', textAlign: 'center', fontSize: '0.88rem', fontWeight: '700', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', lineHeight: '28px' }}>
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => changeQty(item.id, 1)}
                                    style={{ width: '28px', height: '28px', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#475569', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '16px', cursor: 'pointer', padding: 0 }}
                                  title="Remove item"
                                >
                                  ⓧ
                                </button>
                              </div>

                              <div style={{ fontWeight: '900', color: '#0f172a', fontSize: '0.96rem', textAlign: 'right', paddingRight: '2px' }}>
                                ₹{formatMoney(lineTotal)}
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 🎁 GIFTS ROADMAP */}
                  {giftTierRows.length > 0 && (
                    <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '10px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                      <div style={{ fontWeight: '800', color: '#94191d', fontSize: '0.88rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎁</span> Free Gift Tiers & Roadmap
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {giftTierRows.map((gt) => (
                          <div
                            key={gt.key}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: gt.isUnlocked ? '#f0fdf4' : '#ffffff',
                              border: `1px solid ${gt.isUnlocked ? '#22c55e' : '#e2e8f0'}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.84rem', fontWeight: '700', color: gt.isUnlocked ? '#15803d' : '#b45309' }}>
                                {gt.isUnlocked ? '🎁' : '🔒'} {gt.giftTitle}
                              </span>
                              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#334155' }}>
                                ₹{formatMoney(gt.minSpend)}+
                              </span>
                            </div>

                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {gt.productName} • Subtotal: ₹{formatMoney(gt.itemSubTotal)}
                            </div>

                            <div style={{ marginTop: '2px' }}>
                              {gt.isUnlocked ? (
                                <span style={{ background: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                                  🔓 UNLOCKED (FREE)
                                </span>
                              ) : (
                                <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                                  {gt.remaining > 0 ? `🔒 LOCKED (Add ₹${formatMoney(gt.remaining)})` : '🔒 Upgraded to higher tier'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* 👉 RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                    {/* Shipping Type Selected Pill */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderLeft: '4px solid #b91c1c', borderRadius: '6px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🚚 Shipping Method:
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', background: shippingMode ? '#dcfce7' : '#fee2e2', color: shippingMode ? '#166534' : '#ef4444' }}>
                        {shippingMode === 'founder' ? 'FOUNDER DELIVERY' : shippingMode ? shippingMode.toUpperCase() : 'NOT SELECTED'}
                      </span>
                    </div>

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
                        <option value="delivery">🚚 Home Delivery</option>
                        <option value="founder">🎖️ Delivery by Founder</option>
                        <option value="pickup">🏬 Self Pickup - FREE</option>
                      </select>
                    </div>

                    {shippingMode === 'founder' && (
                      <div style={{ background: '#fef3c7', border: '1px dashed #d97706', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: '#92400e', fontWeight: '600' }}>
                        🎖️ <strong>Founder Delivery (₹5,000 Flat):</strong> Personally hand-delivered by our founder team!
                      </div>
                    )}

                    {isHomeDeliveryType && (
                      <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1.5px solid #b91c1c' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
                          Delivery Pincode * <span style={{ color: '#dc2626', fontSize: '0.74rem' }}>(Mandatory for calculation)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 201301 (6 Digits)"
                          maxLength="6"
                          value={shippingAddress.pincode}
                          onChange={handlePincodeChange}
                          style={{
                            width: '100%',
                            padding: '7px 10px',
                            borderRadius: '4px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.88rem',
                            fontWeight: '700',
                            boxSizing: 'border-box'
                          }}
                        />
                        {shippingMode === 'delivery' && isPincodeLoading && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>⏳ Calculating delivery charges...</div>
                        )}
                        {shippingMode === 'delivery' && pincodeStatusMsg && !isPincodeLoading && (
                          <div style={{ fontSize: '0.78rem', color: pincodeDeliveryCharge !== null ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                            {pincodeStatusMsg}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.88rem', color: '#334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sub total</span>
                        <strong>₹{formatMoney(effectiveCartTotal)}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                        <span>Coupon discount</span>
                        <span>- ₹{formatMoney(couponDiscount)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                        <span>Discount on product / cakes</span>
                        <span>- ₹{formatMoney(bulkDiscount)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Shipping</span>
                        <span>
                          {!shippingMode ? (
                            <em style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '600' }}>Select shipping method</em>
                          ) : shippingMode === 'founder' ? (
                            <strong style={{ color: '#b91c1c' }}>₹{formatMoney(FOUNDER_DELIVERY_CHARGE)}</strong>
                          ) : shippingMode === 'pickup' || isFreeDelivery ? (
                            <strong style={{ color: '#059669' }}>FREE</strong>
                          ) : pincodeDeliveryCharge !== null ? (
                            `₹${formatMoney(shippingCharge)}`
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '700' }}>⚠️ Enter 6-digit Pincode</span>
                          )}
                        </span>
                      </div>

                      {/* GST ROW */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                          style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                          onMouseEnter={() => setShowTaxInfo(true)}
                          onMouseLeave={() => setShowTaxInfo(false)}
                        >
                          <span>GST (Tax)</span>
                          <button
                            type="button"
                            onClick={() => setShowTaxInfo(!showTaxInfo)}
                            style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                          >
                            ℹ
                          </button>

                          {showTaxInfo && (
                            <div style={{ position: 'absolute', bottom: '26px', left: '0', width: 'min(230px, 72vw)', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', boxShadow: '0 6px 16px rgba(0,0,0,0.2)', zIndex: 100, pointerEvents: 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ color: '#cbd5e1' }}>Product GST ({PRODUCT_TAX_PERCENT}%):</span>
                                <strong>₹{formatMoney(productTax)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ color: '#cbd5e1' }}>Shipping GST ({SHIPPING_TAX_PERCENT}%):</span>
                                <strong>₹{formatMoney(shippingTax)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #475569', paddingTop: '5px', marginTop: '6px', fontWeight: 'bold' }}>
                                <span>Total Tax:</span>
                                <span style={{ color: '#4ade80' }}>₹{formatMoney(totalTaxAmount)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <strong>₹{formatMoney(totalTaxAmount)}</strong>
                      </div>

                      {/* Gift Box Checkbox */}
                      {giftBoxAvailable && (
                        <label
                          style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 11px', borderRadius: '8px', background: isGiftBoxSelected ? '#ecfdf5' : '#f8fafc', border: `1.5px solid ${isGiftBoxSelected ? '#22c55e' : '#e2e8f0'}`, cursor: 'pointer', marginTop: '2px' }}
                        >
                          <input
                            type="checkbox"
                            checked={isGiftBoxSelected}
                            onChange={(e) => setIsGiftBoxSelected(e.target.checked)}
                            style={{ width: '17px', height: '17px', accentColor: '#10b981', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: '700', color: isGiftBoxSelected ? '#047857' : '#334155' }}>
                            🎁 {GIFT_BOX_TITLE}
                          </span>
                          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#10b981', whiteSpace: 'nowrap' }}>
                            + ₹{formatMoney(GIFT_BOX_CHARGE)}
                          </span>
                        </label>
                      )}

                      {/* Grand Total */}
                      <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Grand Total</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#b91c1c' }}>
                          ₹{formatMoney(grandTotal)}
                        </span>
                      </div>

                      {/* 🎫 MY SAVED WALLET COUPONS */}
                      {savedCoupons.length > 0 && (
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '800', color: '#4338ca', fontSize: '0.82rem' }}>
                              🎫 My Wallet Coupons ({savedCoupons.length})
                            </div>
                            <button
                              type="button"
                              onClick={() => navigate('/my-coupons')}
                              style={{ background: 'transparent', border: 'none', color: '#4338ca', fontSize: '0.74rem', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Manage Wallet ↗
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {savedCoupons.map((sc) => {
                              const isApplied = appliedCoupon?.code === sc.code;
                              const validUntilDate = sc.validUntil ? new Date(sc.validUntil) : null;
                              const isExpired = validUntilDate && !isNaN(validUntilDate.getTime()) && validUntilDate < new Date();

                              return (
                                <div
                                  key={sc.code}
                                  style={{ padding: '9px 11px', borderRadius: '8px', background: isApplied ? '#f0fdf4' : '#eef2ff', border: `1px dashed ${isApplied ? '#22c55e' : '#818cf8'}`, opacity: isExpired ? 0.65 : 1 }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#4338ca', letterSpacing: '0.4px' }}>
                                      🎫 {sc.code}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>
                                      {sc.discountType === 'percentage' ? `${sc.discountValue}% OFF` : `₹${formatMoney(sc.discountValue)} OFF`}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                                    {parseNumericPrice(sc.minSpend) > 0 ? `Min spend ₹${formatMoney(sc.minSpend)}` : 'No minimum spend'}
                                    {validUntilDate && !isNaN(validUntilDate.getTime()) ? ` • Till ${validUntilDate.toLocaleDateString('en-IN')}` : ''}
                                  </div>

                                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {isApplied ? (
                                      <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        style={{ background: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                      >
                                        ✓ APPLIED — Remove
                                      </button>
                                    ) : isExpired ? (
                                      <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                        ⌛ EXPIRED
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleApplyCoupon(sc.code)}
                                        style={{ background: '#4338ca', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '5px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                      >
                                        USE NOW
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSavedCoupon(sc.code)}
                                      style={{ background: '#fff', color: '#94a3b8', fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 🎟️ AVAILABLE STORE COUPONS (Direct Apply Only) */}
                      {availableCoupons.length > 0 && (
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
                          <div style={{ fontWeight: '800', color: '#d96028', fontSize: '0.82rem', marginBottom: '8px' }}>
                            🎟️ Available Offers & Coupons
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableCoupons.map((c) => {
                              const isApplied = appliedCoupon?.code === c.code;
                              const active = c.isUnlocked;

                              return (
                                <div
                                  key={c.code}
                                  style={{ padding: '9px 11px', borderRadius: '8px', background: isApplied ? '#f0fdf4' : active ? '#f5f3ff' : '#f8fafc', border: `1px dashed ${isApplied ? '#22c55e' : active ? '#7c3aed' : '#cbd5e1'}`, opacity: c.isExpired ? 0.65 : 1 }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.84rem', fontWeight: '800', color: active ? '#5b21b6' : '#64748b', letterSpacing: '0.4px' }}>
                                      {active ? '🎟️' : '🔒'} {c.code}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>
                                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${formatMoney(c.discountValue)} OFF`}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                                    {c.minSpend > 0 ? `Min spend ₹${formatMoney(c.minSpend)}` : 'No minimum spend'}
                                    {c.validUntil ? ` • Till ${c.validUntil.toLocaleDateString('en-IN')}` : ''}
                                  </div>

                                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                    {isApplied ? (
                                      <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        style={{ background: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                      >
                                        ✓ APPLIED — Remove
                                      </button>
                                    ) : c.isExpired ? (
                                      <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px', border: '1px solid #fecaca' }}>
                                        ⌛ EXPIRED
                                      </span>
                                    ) : active ? (
                                      <button
                                        type="button"
                                        onClick={() => handleApplyCoupon(c.code)}
                                        style={{ background: '#7c3aed', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '5px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                      >
                                        🔓 APPLY NOW
                                      </button>
                                    ) : (
                                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                                        🔒 LOCKED (Add ₹${formatMoney(c.remaining)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Manual Coupon Input */}
                    <div style={{ marginTop: '16px' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        style={{ width: '100%', padding: '10px', background: '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        Apply code
                      </button>
                      {couponMsg.text && (
                        <div style={{ fontSize: '0.78rem', color: couponMsg.type === 'success' ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                          {couponMsg.text}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1.1fr 1fr', gap: '10px', marginTop: '14px' }}>
                      <button
                        type="button"
                        onClick={handleClose}
                        style={{ padding: '12px 8px', background: '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        ⏪ Continue shopping
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToCheckout}
                        disabled={!shippingMode}
                        style={{ padding: '12px 8px', background: !shippingMode ? '#9ca3af' : '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem', cursor: !shippingMode ? 'not-allowed' : 'pointer' }}
                      >
                        Checkout ⏩
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {step === 'auth-required' && (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', margin: '20px auto', maxWidth: '420px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔐</div>
              <h3 style={{ color: '#94191d', margin: '0 0 8px', fontSize: '1.3rem' }}>Login Required</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 20px' }}>
                Please login to your account or register to confirm your order.
              </p>
              <button
                onClick={() => { handleClose(); navigate('/auth'); }}
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

          {step === 'checkout' && (
            <div style={{ maxWidth: '680px', margin: '0 auto', background: '#fff', padding: isSmallMobile ? '16px 14px' : '24px 28px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <button onClick={() => setStep('cart')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold', marginBottom: '16px', fontSize: '0.9rem' }}>
                ← Back to Cart
              </button>

              {error && <div style={{ color: '#dc2626', background: '#fee2e2', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontWeight: 'bold', fontSize: '0.88rem' }}>{error}</div>}

              <form onSubmit={handlePlaceOrder}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <input type="radio" checked readOnly style={{ accentColor: '#000', width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>Shipping Address</span>
                  </div>

                  <label style={labelStyle}>Contact person name <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="text" required placeholder="Enter your full name" value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} style={inputStyle} />

                  <label style={labelStyle}>Phone (10 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="tel" maxLength="10" required placeholder="e.g. 9876543210" value={shippingAddress.phone} onChange={handlePhoneChange} style={inputStyle} />

                  <label style={labelStyle}>Address Type</label>
                  <select value={shippingAddress.addressType} onChange={(e) => setShippingAddress({ ...shippingAddress, addressType: e.target.value })} style={inputStyle}>
                    <option value="Permanent">Permanent</option>
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>

                  <label style={labelStyle}>Address <span style={{ color: '#b91c1c' }}>*</span></label>
                  <textarea required rows="3" placeholder="House / Flat No., Street, Building Name" value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} />

                  <label style={labelStyle}>Landmark / Floor / House Details <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="text" required placeholder="e.g. Near Shiv Temple, 2nd Floor, Landlord Name" value={shippingAddress.landmark} onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })} style={inputStyle} />

                  <label style={labelStyle}>State / Union Territory <span style={{ color: '#b91c1c' }}>*</span></label>
                  <select required value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} style={inputStyle}>
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <label style={labelStyle}>City <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="text" required placeholder="e.g. Noida, Delhi" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} style={inputStyle} />

                  <label style={labelStyle}>Zip code (6 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="text" maxLength="6" required placeholder="Enter 6-digit zip code" value={shippingAddress.pincode} onChange={handlePincodeChange} style={inputStyle} />

                  <label style={labelStyle}>Country <span style={{ color: '#b91c1c' }}>*</span></label>
                  <select value={shippingAddress.country} onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} style={inputStyle}>
                    <option value="India">India</option>
                  </select>

                  {/* 🟢 Save this address to profile — so it's fetched & editable later on the Profile Info page */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-6px', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      id="saveAddressToProfile"
                      checked={!!shippingAddress.saveAddress}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, saveAddress: e.target.checked })}
                      style={{ cursor: 'pointer', accentColor: '#b91c1c', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="saveAddressToProfile" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>
                      Save this address to my profile for next time
                    </label>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="radio" checked readOnly style={{ accentColor: '#000', width: '18px', height: '18px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>Billing Address</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" id="sameAsShipping" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#b91c1c', width: '16px', height: '16px' }} />
                      <label htmlFor="sameAsShipping" style={{ fontSize: '0.85rem', color: '#475569', cursor: 'pointer', fontWeight: '600' }}>
                        Same as Shipping Address
                      </label>
                    </div>
                  </div>

                  {!sameAsShipping && (
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                      <label style={labelStyle}>Billing Contact Person Name <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="text" required={!sameAsShipping} value={billingAddress.name} onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })} style={inputStyle} />

                      <label style={labelStyle}>Billing Phone (10 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="tel" maxLength="10" required={!sameAsShipping} value={billingAddress.phone} onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} style={inputStyle} />

                      <label style={labelStyle}>Billing Address <span style={{ color: '#b91c1c' }}>*</span></label>
                      <textarea required={!sameAsShipping} rows="3" placeholder="House / Flat No., Street" value={billingAddress.address} onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })} style={{ ...inputStyle, minHeight: '70px' }} />

                      <label style={labelStyle}>Billing Landmark <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="text" required={!sameAsShipping} placeholder="e.g. Near City Center" value={billingAddress.landmark} onChange={(e) => setBillingAddress({ ...billingAddress, landmark: e.target.value })} style={inputStyle} />

                      <label style={labelStyle}>State / Union Territory <span style={{ color: '#b91c1c' }}>*</span></label>
                      <select required={!sameAsShipping} value={billingAddress.state} onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })} style={inputStyle}>
                        <option value="">Select State / UT</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>

                      <label style={labelStyle}>City <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="text" required={!sameAsShipping} value={billingAddress.city} onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })} style={inputStyle} />

                      <label style={labelStyle}>Zip code (6 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="text" maxLength="6" required={!sameAsShipping} placeholder="Enter 6-digit zip code" value={billingAddress.pincode} onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} style={inputStyle} />
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' }}>💳 Payment Method</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1.5px solid ${paymentMethod === 'COD' ? '#b91c1c' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'COD' ? '#fff5f5' : '#fff' }}>
                      <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                      <div>
                        <strong>💵 Cash on Delivery</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Pay on delivery</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', border: `1.5px solid ${paymentMethod === 'UPI' ? '#b91c1c' : '#cbd5e1'}`, borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'UPI' ? '#fff5f5' : '#fff' }}>
                      <input type="radio" name="paymentMethod" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                      <div>
                        <strong>📲 UPI Instant Pay</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>GPay / PhonePe / Paytm</div>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div style={{ background: '#f0fdf4', border: '1px dashed #22c55e', padding: '14px', borderRadius: '8px', marginTop: '12px' }}>
                      <a
                        href={`upi://pay?pa=seedhegaonse@upi&pn=${encodeURIComponent('Seedhe Gaon Se')}&am=${grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order Payment')}`}
                        style={{ display: 'inline-block', background: '#16a34a', color: '#fff', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', marginBottom: '10px', fontSize: '0.88rem' }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📲 Click to Pay ₹{formatMoney(grandTotal)} via UPI
                      </a>
                      <div>
                        <label style={labelStyle}>UPI Transaction / Reference ID <span style={{ color: '#b91c1c' }}>*</span></label>
                        <input type="text" required placeholder="Enter UPI Ref ID" value={upiRef} onChange={(e) => setUpiRef(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', background: '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}
                >
                  {loading ? 'Placing Order...' : `Confirm Order (₹${formatMoney(grandTotal)})`}
                </button>
              </form>
            </div>
          )}

          {/* 🎉 SUCCESS SCREEN WITH DYNAMICALLY EARNED STORE COUPONS */}
          {step === 'success' && (
            <div style={{ maxWidth: '650px', margin: '0 auto', background: '#fff', padding: isSmallMobile ? '16px 14px' : '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#22c55e', color: '#fff', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  ✓
                </div>
                <h2 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: '1.4rem' }}>Order Placed Successfully!</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Order ID: <strong style={{ color: '#94191d' }}>#{confirmedOrderId.toUpperCase()}</strong>
                </p>
              </div>

              {/* 🎁 DYNAMIC COUPONS SAVED CONFIRMATION */}
              {unlockedOrderCoupons.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '2px dashed #d97706', borderRadius: '10px', padding: '16px', marginBottom: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.15rem', marginBottom: '4px' }}>🎉 <strong>Coupons Added to Your Wallet!</strong></div>
                  <p style={{ color: '#92400e', fontSize: '0.85rem', margin: '0 0 12px' }}>
                    The following offer coupons have been automatically saved to your wallet for next orders:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {unlockedOrderCoupons.map((uc) => (
                      <div
                        key={uc.code}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1.5px solid #d97706', borderRadius: '8px', padding: '8px 14px' }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '900', color: '#b45309', letterSpacing: '0.5px' }}>
                            🎫 {uc.code}
                          </span>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            {uc.discountType === 'percentage' ? `${uc.discountValue}% OFF` : `₹${formatMoney(uc.discountValue)} OFF`}
                            {parseNumericPrice(uc.minSpend) > 0 ? ` • Min ₹${formatMoney(uc.minSpend)}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(uc.code);
                            setCopiedCode(uc.code);
                            setTimeout(() => setCopiedCode(''), 2500);
                          }}
                          style={{ background: copiedCode === uc.code ? '#15803d' : '#b45309', color: '#fff', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          {copiedCode === uc.code ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {placedOrderDetails && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    📍 Delivery & Customer Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                    <div><strong>Customer:</strong> {placedOrderDetails.customer.name}</div>
                    <div><strong>Phone:</strong> {placedOrderDetails.customer.phone}</div>
                    <div style={{ gridColumn: isSmallMobile ? 'auto' : 'span 2' }}>
                      <strong>Address:</strong> {placedOrderDetails.customer.address}, Landmark: {placedOrderDetails.customer.landmark}, {placedOrderDetails.customer.city}, {placedOrderDetails.customer.state} - {placedOrderDetails.customer.pincode}
                    </div>
                  </div>
                </div>
              )}

              {placedOrderDetails && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '900', color: '#b91c1c' }}>
                    <span>Total Amount:</span>
                    <span>₹{formatMoney(placedOrderDetails.totalAmount)}</span>
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