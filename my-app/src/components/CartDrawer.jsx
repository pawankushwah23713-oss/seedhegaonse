
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

// 🟢 STRICTLY resolve base URL from imported .env variable (Always ensures /api)
const getBaseApiUrl = () => {
  const envUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);

  if (!envUrl) {
    console.warn('⚠️ Missing REACT_APP_API_URL or VITE_API_URL in .env file, using default /api');
    return '/api';
  }

  const clean = envUrl.trim().replace(/\/auth\/?$/, '').replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getBaseApiUrl();

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

// Helper: 2 Decimal precision safely
const round2 = (num) => {
  const n = parseFloat(num) || 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

// Helper: Clean currency display with 2 decimals
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

const extractObjectId = (val) => {
  const match = String(val || '').match(/[0-9a-fA-F]{24}/);
  return match ? match[0] : null;
};

const nameKey = (val) => String(val || '').trim().toLowerCase();

const shortOrderId = (id) => {
  const clean = String(id || '').trim();
  return clean.length > 6 ? clean.slice(-6).toUpperCase() : clean.toUpperCase();
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

// Parse max usage based on backend schema: noOfTimesUse ('first_time', '10', '2') or maxUsagePerUser
const parseMaxUsage = (coupon) => {
  if (coupon?.maxUsagePerUser && Number(coupon.maxUsagePerUser) > 0) {
    return Number(coupon.maxUsagePerUser);
  }
  const noOfTimes = String(coupon?.noOfTimesUse || '').trim().toLowerCase();
  if (noOfTimes === 'first_time' || noOfTimes === 'first' || noOfTimes === '1') {
    return 1;
  }
  const parsed = parseInt(noOfTimes, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 1;
};

// 🟢 Image Resolver supporting Multi-images
const resolveItemImage = (item) => {
  const rawImg = item?.img || (Array.isArray(item?.images) && item.images[0]) || item?.image;
  if (!rawImg) return 'https://via.placeholder.com/60';
  if (rawImg.startsWith('http://') || rawImg.startsWith('https://') || rawImg.startsWith('data:')) {
    return rawImg;
  }
  const host = API_BASE.replace(/\/api\/?$/, '');
  const cleanPath = rawImg.startsWith('/') ? rawImg : `/${rawImg}`;
  return `${host}${cleanPath}`;
};

const CartDrawer = ({ isOpen, onClose, cartItems = [], cartCount, changeQty, removeFromCart, onOrderPlaced }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState('cart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);

  const [, setStoreProducts] = useState([]);
  const [productOffers, setProductOffers] = useState({});

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  // 👛 WALLET STATES
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWalletUsed, setIsWalletUsed] = useState(false);

  // 🎟️ Track count of how many times each coupon has been used
  const [couponUsageMap, setCouponUsageMap] = useState(() => {
    try {
      const cached = localStorage.getItem('sgs_coupon_usage_map');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [isGiftBoxSelected, setIsGiftBoxSelected] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    giftBoxEnabled: true,
    giftBoxTitle: 'Gift Box Packaging',
    giftBoxCharge: 50,
    productTaxPercent: 5,
    shippingTaxPercent: 5,
    globalCoupons: [],
    globalGiftTiers: []
  });

  const GIFT_BOX_CHARGE = Number(storeSettings.giftBoxCharge) || 0;
  const GIFT_BOX_TITLE = storeSettings.giftBoxTitle || 'Gift Box Packaging';
  const PRODUCT_TAX_PERCENT = Number(storeSettings.productTaxPercent) || 0;
  const GLOBAL_SHIPPING_TAX_PERCENT = Number(storeSettings.shippingTaxPercent) || 0;
  const FOUNDER_DELIVERY_CHARGE = 5000.00;

  const [showTaxInfo, setShowTaxInfo] = useState(false);
  const [shippingMode, setShippingMode] = useState(() => {
    try {
      return localStorage.getItem('cart_shipping_mode') || '';
    } catch {
      return '';
    }
  });

  // 📍 Pincode base delivery & dynamic GST states
  const [pincodeDeliveryCharge, setPincodeDeliveryCharge] = useState(null);
  const [pincodeGstPercent, setPincodeGstPercent] = useState(null);
  const [pincodeStatusMsg, setPincodeStatusMsg] = useState('');
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [upiRef, setUpiRef] = useState('');

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

  useEffect(() => {
    try {
      if (shippingMode) localStorage.setItem('cart_shipping_mode', shippingMode);
    } catch (err) {
      console.error(err);
    }
  }, [shippingMode]);

  // 👛 Fetch User Wallet Balance
  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/coupons/my-wallet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setWalletBalance(Number(data.walletBalance) || 0);
          }
        }
      } catch (err) {
        console.error('Wallet fetch error:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen]);

  // Load coupon usage frequency from past orders & API
  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthToken();
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const usageCounts = { ...couponUsageMap };

        try {
          const resOrders = await fetch(`${API_BASE}/orders/my-orders`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resOrders.ok) {
            const dataOrders = await resOrders.json();
            const orderList = Array.isArray(dataOrders) ? dataOrders : (dataOrders.orders || []);
            const orderCodeCounts = {};
            orderList.forEach((o) => {
              const code = String(o.couponCode || o.coupon || '').trim().toUpperCase();
              if (code) {
                orderCodeCounts[code] = (orderCodeCounts[code] || 0) + 1;
              }
            });
            Object.keys(orderCodeCounts).forEach((c) => {
              usageCounts[c] = Math.max(usageCounts[c] || 0, orderCodeCounts[c]);
            });
          }
        } catch (e) {
          console.error(e);
        }

        try {
          const resCoupons = await fetch(`${API_BASE}/coupons/my-coupons`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resCoupons.ok) {
            const dataCoupons = await resCoupons.json();
            if (dataCoupons.usageMap && typeof dataCoupons.usageMap === 'object') {
              Object.keys(dataCoupons.usageMap).forEach((c) => {
                const upper = c.toUpperCase();
                usageCounts[upper] = Math.max(usageCounts[upper] || 0, Number(dataCoupons.usageMap[c]) || 0);
              });
            } else if (Array.isArray(dataCoupons.usedCoupons)) {
              dataCoupons.usedCoupons.forEach((c) => {
                const upper = String(c).toUpperCase();
                usageCounts[upper] = (usageCounts[upper] || 0) + 1;
              });
            }
          }
        } catch (e) {
          console.error(e);
        }

        if (!cancelled) {
          setCouponUsageMap(usageCounts);
          try {
            localStorage.setItem('sgs_coupon_usage_map', JSON.stringify(usageCounts));
          } catch {}
        }
      } catch (err) {
        console.error('Unable to sync coupon usage count:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Load store settings
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
            shippingTaxPercent: s.shippingTaxPercent ?? 5,
            globalCoupons: ensureArray(s.productGlobalCoupons),
            globalGiftTiers: ensureArray(s.productGlobalGiftTiers)
          });
        }
      } catch (err) {
        console.error('Store settings load error:', err);
      }
    };

    loadSettings();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Load product offers & active coupons from backend
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadOffers = async () => {
      try {
        const [resProducts, resCakes, resCoupons] = await Promise.allSettled([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/cakes`),
          fetch(`${API_BASE}/coupons/available`)
        ]);

        const map = {};
        const allList = [];

        const processList = async (res) => {
          if (res.status === 'fulfilled' && res.value.ok) {
            const data = await res.value.json();
            if (Array.isArray(data)) {
              data.forEach((p) => {
                allList.push(p);
                const entry = {
                  giftTiers: ensureArray(p.giftTiers),
                  couponsList: ensureArray(p.couponsList),
                  bulkTiers: ensureArray(p.bulkTiers),
                  quantityDiscounts: ensureArray(
                    p.quantityDiscounts || p.qtyDiscounts || p.packDiscounts || p.quantityTiers || p.packTiers
                  ),
                  highValueThreshold: p.highValueThreshold,
                  highValueDiscountPercent: p.highValueDiscountPercent,
                  isFreeDelivery: p.isFreeDelivery,
                  inStock: p.inStock
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

        if (resCoupons.status === 'fulfilled' && resCoupons.value.ok) {
          const coupData = await resCoupons.value.json();
          const couponsArr = Array.isArray(coupData) ? coupData : ensureArray(coupData.coupons);
          if (couponsArr.length > 0) {
            setStoreSettings((prev) => ({
              ...prev,
              globalCoupons: couponsArr
            }));
          }
        }

        if (!cancelled) {
          setStoreProducts(allList);
          setProductOffers(map);
        }
      } catch (err) {
        console.error('Unable to load offers from backend:', err);
      }
    };

    loadOffers();
    return () => { cancelled = true; };
  }, [isOpen]);

  const enrichedCartItems = useMemo(() => {
    return cartItems.map((item) => {
      const idKey = extractObjectId(item.productId) || extractObjectId(item.id) || String(item.productId || item.id || '');
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
        img: resolveItemImage(item),
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
  }, [cartItems, productOffers]);

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

  const fetchDeliveryChargeByPincode = useCallback(async (pin) => {
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
        const gst = (data.gstPercent !== undefined && data.gstPercent !== null)
          ? Number(data.gstPercent)
          : GLOBAL_SHIPPING_TAX_PERCENT;

        setPincodeDeliveryCharge(rate);
        setPincodeGstPercent(gst);

        if (data.city) {
          setShippingAddress((prev) => ({ ...prev, city: data.city }));
        }
        setPincodeStatusMsg(`✓ Serviceable Area: ${data.city || ''} (Delivery ₹${formatMoney(rate)} | GST ${gst}%)`);
        setError('');
      } else {
        setPincodeDeliveryCharge(null);
        setPincodeGstPercent(null);
        setPincodeStatusMsg(`⚠️ ${data.message || 'Delivery is currently not available for this pincode.'}`);
      }
    } catch {
      setPincodeDeliveryCharge(null);
      setPincodeGstPercent(null);
      setPincodeStatusMsg('⚠️ Unable to verify delivery charges for this pincode.');
    } finally {
      setIsPincodeLoading(false);
    }
  }, [GLOBAL_SHIPPING_TAX_PERCENT]);

  // Triggered by pincode state change
  useEffect(() => {
    if ((shippingMode === 'delivery' || shippingMode === 'founder') && shippingAddress.pincode && shippingAddress.pincode.length === 6) {
      fetchDeliveryChargeByPincode(shippingAddress.pincode);
    }
  }, [shippingMode, shippingAddress.pincode, fetchDeliveryChargeByPincode]);

  const handlePincodeChange = (e) => {
    const newPin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setShippingAddress((prev) => ({ ...prev, pincode: newPin }));
    if (newPin.length !== 6) {
      setPincodeDeliveryCharge(null);
      setPincodeGstPercent(null);
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
    }, 300);
  };

  const rawSubTotal = enrichedCartItems.reduce((acc, item) => {
    const uPrice = parseNumericPrice(item.unitPrice || item.price);
    const q = Number(item.qty || item.quantity || 1);
    return acc + (uPrice * q);
  }, 0);
  const effectiveCartTotal = round2(rawSubTotal);

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

  const bulkDiscount = round2(itemQtyDiscountsTotal);

  // =========================================================================
  // 🎟️ MULTI-USAGE COUPONS ENGINE
  // =========================================================================
  const availableCoupons = useMemo(() => {
    const list = [];
    const seen = new Set();

    const defaultExcelCoupons = [
      {
        code: 'SGS50',
        noOfTimesUse: 'first_time',
        maxUsagePerUser: 1,
        baseValue: 500,
        discountType: 'lumpsum',
        lumpsumAmount: 50,
        maxDiscountValue: 50,
        productName: 'Min Order ₹500 (1st Order Only)'
      },
      {
        code: 'SGS100',
        noOfTimesUse: '10',
        maxUsagePerUser: 10,
        baseValue: 1500,
        discountType: 'percentage',
        percentageAmount: 5,
        maxDiscountValue: 100,
        productName: 'Min Order ₹1500 (5% OFF upto ₹100)'
      },
      {
        code: 'SGS125',
        noOfTimesUse: '2',
        maxUsagePerUser: 2,
        baseValue: 1000,
        discountType: 'percentage',
        percentageAmount: 10,
        maxDiscountValue: 75,
        productName: 'Min Order ₹1000 (10% OFF upto ₹75)'
      }
    ];

    const allSources = [
      ...defaultExcelCoupons,
      ...ensureArray(storeSettings.globalCoupons).map((c) => ({
        code: c.code,
        noOfTimesUse: c.noOfTimesUse || (c.maxUsagePerUser ? String(c.maxUsagePerUser) : '1'),
        maxUsagePerUser: Number(c.maxUsagePerUser) || (c.noOfTimesUse === 'first_time' ? 1 : Number(c.noOfTimesUse) || 1),
        baseValue: parseNumericPrice(c.baseValue || c.minSpend),
        discountType: c.discountType === 'percentage' ? 'percentage' : 'lumpsum',
        lumpsumAmount: parseNumericPrice(c.lumpsumAmount || c.discountValue),
        percentageAmount: parseNumericPrice(c.percentageAmount || c.discountValue),
        maxDiscountValue: parseNumericPrice(c.maxDiscountValue || c.maxDiscount),
        productName: c.productName || c.code
      }))
    ];

    allSources.forEach((c) => {
      const code = String(c?.code || '').trim().toUpperCase();
      if (!code || seen.has(code)) return;
      seen.add(code);

      const maxUsage = parseMaxUsage(c);
      const usedCount = couponUsageMap[code] || 0;
      const remainingUses = Math.max(0, maxUsage - usedCount);

      if (usedCount >= maxUsage) return;

      const minSpend = parseNumericPrice(c.baseValue);
      const isUnlocked = effectiveCartTotal >= minSpend;

      const isPercentage = c.discountType === 'percentage';
      const discVal = isPercentage
        ? parseNumericPrice(c.percentageAmount)
        : parseNumericPrice(c.lumpsumAmount);

      list.push({
        code,
        noOfTimesUse: c.noOfTimesUse,
        maxUsage,
        usedCount,
        remainingUses,
        discountType: isPercentage ? 'percentage' : 'flat',
        discountValue: discVal,
        maxDiscountValue: parseNumericPrice(c.maxDiscountValue || 0),
        minSpend,
        isUnlocked,
        remaining: round2(Math.max(0, minSpend - effectiveCartTotal)),
        productName: c.productName || 'Special Offer'
      });
    });

    return list;
  }, [storeSettings.globalCoupons, effectiveCartTotal, couponUsageMap]);

  useEffect(() => {
    if (!appliedCoupon) return;
    const matched = availableCoupons.find((c) => c.code === appliedCoupon.code);

    if (matched) {
      if (effectiveCartTotal < matched.minSpend) {
        setAppliedCoupon(null);
        setCouponMsg({
          text: `⚠️ Coupon ${appliedCoupon.code} removed because cart total fell below ₹${matched.minSpend}.`,
          type: 'error'
        });
      } else {
        let newDisc = matched.discountType === 'percentage'
          ? (effectiveCartTotal * matched.discountValue) / 100
          : matched.discountValue;
        if (matched.maxDiscountValue > 0) {
          newDisc = Math.min(newDisc, matched.maxDiscountValue);
        }
        newDisc = round2(newDisc);
        if (newDisc !== appliedCoupon.discount) {
          setAppliedCoupon((prev) => ({ ...prev, discount: newDisc }));
        }
      }
    }
  }, [effectiveCartTotal, availableCoupons, appliedCoupon]);

  const freeGiftState = useMemo(() => {
    if (effectiveCartTotal >= 2500) {
      return {
        activeTitle: 'Special Premium Gift (Tier 2)',
        tier: 2,
        isUnlocked: true,
        message: '🎉 First Free Gift Show Off & New Gift Show!'
      };
    } else if (effectiveCartTotal >= 1500) {
      return {
        activeTitle: 'Delicious Sweets Gift Box (Tier 1)',
        tier: 1,
        isUnlocked: true,
        message: '🎉 Free Gift Automatically show (Order > ₹1500)!'
      };
    }
    return {
      activeTitle: null,
      tier: 0,
      isUnlocked: false,
      remainingForTier1: round2(1500 - effectiveCartTotal)
    };
  }, [effectiveCartTotal]);

  const isFreeDelivery = enrichedCartItems.some((i) => isTrueFlag(i.isFreeDelivery));
  let shippingCharge = 0;

  if (shippingMode === 'pickup') {
    shippingCharge = 0;
  } else if (shippingMode === 'founder') {
    shippingCharge = (pincodeDeliveryCharge !== null) ? FOUNDER_DELIVERY_CHARGE : 0;
  } else if (shippingMode === 'delivery') {
    shippingCharge = isFreeDelivery ? 0 : (pincodeDeliveryCharge !== null ? pincodeDeliveryCharge : 0);
  }
  shippingCharge = round2(shippingCharge);

  const couponDiscount = round2(appliedCoupon ? parseNumericPrice(appliedCoupon.discount) : 0);
  const taxableProductAmount = round2(Math.max(0, effectiveCartTotal - couponDiscount - bulkDiscount));

  const currentShippingGstPercent = (pincodeGstPercent !== null && pincodeGstPercent !== undefined)
    ? pincodeGstPercent
    : GLOBAL_SHIPPING_TAX_PERCENT;

  const productTax = round2((taxableProductAmount * PRODUCT_TAX_PERCENT) / 100);
  const shippingTax = (shippingCharge > 0) ? round2((shippingCharge * currentShippingGstPercent) / 100) : 0;
  const totalTaxAmount = round2(productTax + shippingTax);

  const giftBoxAvailable = storeSettings.giftBoxEnabled && GIFT_BOX_CHARGE > 0;
  const giftBoxAmount = (giftBoxAvailable && isGiftBoxSelected) ? GIFT_BOX_CHARGE : 0;

  // Total payable before applying wallet balance
  const totalBeforeWallet = round2(
    Math.max(0, taxableProductAmount + (shippingMode ? shippingCharge : 0) + totalTaxAmount + giftBoxAmount)
  );

  // 👛 Dynamic Wallet Deduction
  const walletDeduction = (isWalletUsed && walletBalance > 0)
    ? round2(Math.min(walletBalance, totalBeforeWallet))
    : 0;

  // Final Grand Total after deducting Wallet Balance
  const grandTotal = round2(Math.max(0, totalBeforeWallet - walletDeduction));

  const handleProceedToCheckout = () => {
    if (!shippingMode) {
      alert('⚠️ Please select a delivery option first (Mandatory).');
      return;
    }
    if (shippingMode === 'delivery' && (!shippingAddress.pincode || shippingAddress.pincode.length !== 6)) {
      alert('⚠️ Delivery Pincode is Mandatory. Please enter a valid 6-digit Pincode to calculate delivery charges.');
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
    if (shippingMode === 'founder' && pincodeDeliveryCharge === null) {
      alert('⚠️ Founder Delivery is not available for this pincode. Please try another pincode.');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setStep('auth-required');
      return;
    }
    setStep('checkout');
  };

  const handleApplyCoupon = async (overrideCode) => {
    const rawCode = typeof overrideCode === 'string' ? overrideCode : couponCode;
    if (!rawCode.trim()) return setCouponMsg({ text: 'Please enter a coupon code.', type: 'error' });
    const upper = rawCode.trim().toUpperCase();
    setCouponCode(upper);

    const matched = availableCoupons.find((c) => c.code === upper);
    const usedCount = couponUsageMap[upper] || 0;
    const maxAllowed = matched ? matched.maxUsage : 1;

    if (usedCount >= maxAllowed) {
      return setCouponMsg({
        text: `⚠️ You have already used coupon ${upper} ${usedCount} time(s). Maximum limit of ${maxAllowed} reached!`,
        type: 'error'
      });
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/coupons/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ code: upper, cartTotal: effectiveCartTotal })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        return setCouponMsg({ text: data.message || 'Invalid or expired coupon code.', type: 'error' });
      }
      const serverDisc = round2(parseNumericPrice(data.discount));
      setAppliedCoupon({ code: data.code || upper, discount: serverDisc });
      setCouponMsg({ text: data.message || `🎉 Coupon ${upper} applied successfully!`, type: 'success' });
    } catch {
      if (matched) {
        if (effectiveCartTotal < matched.minSpend) {
          return setCouponMsg({
            text: `🔒 Min Base Value ₹${matched.minSpend} required for ${upper}. Add ₹${formatMoney(round2(matched.minSpend - effectiveCartTotal))} more.`,
            type: 'error'
          });
        }
        let calcDisc = matched.discountType === 'percentage'
          ? (effectiveCartTotal * matched.discountValue) / 100
          : matched.discountValue;

        if (matched.maxDiscountValue > 0) {
          calcDisc = Math.min(calcDisc, matched.maxDiscountValue);
        }

        calcDisc = round2(calcDisc);
        setAppliedCoupon({ code: upper, discount: calcDisc });
        return setCouponMsg({ text: `🎉 Coupon ${upper} applied! (₹${calcDisc} OFF)`, type: 'success' });
      }
      setCouponMsg({ text: 'Unable to verify coupon. Please try again.', type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMsg({ text: '', type: '' });
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
      if (!billingAddress.name.trim()) {
        setError('⚠️ Please enter Billing Contact Person Name.');
        return;
      }
      if (!phoneRegex.test(billingAddress.phone.trim())) {
        setError('⚠️ Please enter a valid 10-digit Billing Phone number.');
        return;
      }
      if (!billingAddress.address.trim()) {
        setError('⚠️ Billing Address details are required.');
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

    if (shippingMode === 'founder' && pincodeDeliveryCharge === null) {
      setError('Founder Delivery is not available for this pincode. Please try another pincode.');
      return;
    }

    // Only check UPI transaction reference if grandTotal > 0 and user opted for UPI
    if (grandTotal > 0 && paymentMethod === 'UPI' && !upiRef.trim()) {
      setError('⚠️ Please enter the UPI transaction / reference ID after completing the payment.');
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
            : `Standard Home Delivery - Pincode: ${shippingAddress.pincode} (${shippingAddress.city}) [GST: ${currentShippingGstPercent}%]`;

      const resolvedPaymentMethod = grandTotal === 0 && walletDeduction > 0 ? 'WALLET' : paymentMethod.toUpperCase();

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
        freeGift: freeGiftState.activeTitle || '',
        subTotal: round2(effectiveCartTotal),
        bulkDiscount: round2(bulkDiscount),
        couponDiscount: round2(couponDiscount),
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        shippingCharge: round2(shippingCharge),
        productTax: round2(productTax),
        shippingTax: round2(shippingTax),
        shippingGstPercent: currentShippingGstPercent,
        taxAmount: round2(totalTaxAmount),
        giftBoxCharge: round2(giftBoxAmount),
        giftBoxTitle: giftBoxAmount > 0 ? GIFT_BOX_TITLE : '',
        walletAmountUsed: round2(walletDeduction),
        totalAmount: round2(grandTotal),
        paymentMethod: resolvedPaymentMethod,
        upiTransactionId: grandTotal > 0 ? upiRef : ''
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

      // Deduct wallet balance locally
      if (walletDeduction > 0) {
        setWalletBalance((prev) => Math.max(0, round2(prev - walletDeduction)));
      }

      // Increment Coupon Usage count on successful order
      if (appliedCoupon?.code) {
        const usedCode = appliedCoupon.code.toUpperCase();
        setCouponUsageMap((prev) => {
          const updated = {
            ...prev,
            [usedCode]: (prev[usedCode] || 0) + 1
          };
          try {
            localStorage.setItem('sgs_coupon_usage_map', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        try {
          await fetch(`${API_BASE}/coupons/record-usage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ code: appliedCoupon.code })
          });
        } catch (cErr) {
          console.error(cErr);
        }
      }

      if (shippingAddress.saveAddress) {
        try {
          const userObj = getSavedUser() || {};
          const updatedUser = {
            ...userObj,
            name: shippingAddress.name,
            phone: shippingAddress.phone,
            address: shippingAddress.address,
            landmark: shippingAddress.landmark,
            state: shippingAddress.state,
            city: shippingAddress.city,
            pincode: shippingAddress.pincode
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch {}
      }

      setStep('success');
      setAppliedCoupon(null);
      setCouponCode('');
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      setError(err.message || 'An error occurred while placing your order.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSlip = () => {
    if (!placedOrderDetails) return;
    const d = placedOrderDetails;

    const itemsRows = d.itemsSnapshot.map((item) => `
      <tr>
        <td style="padding:8px 6px;border-bottom:1px solid #eee;">${item.name} <span style="color:#888;">(${item.variant})</span></td>
        <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;">₹${formatMoney(item.unitPrice)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">₹${formatMoney(item.totalPrice)}</td>
      </tr>
    `).join('');

    const receiptHTML = `
      <html>
      <head>
        <title>Order Slip - ${shortOrderId(d.orderId)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 650px; margin: 0 auto; }
          h1 { color: #94191d; font-size: 22px; margin-bottom: 2px; }
          .muted { color: #64748b; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th { text-align: left; background: #f8fafc; padding: 8px 6px; font-size: 13px; border-bottom: 2px solid #b91c1c; }
          .totals { margin-top: 16px; width: 100%; font-size: 14px; }
          .totals td { padding: 4px 6px; }
          .grand { font-size: 18px; font-weight: 900; color: #b91c1c; border-top: 2px dashed #cbd5e1; }
          .addr { margin-top: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; font-size: 13px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <h1>Seedhe Gaon Se</h1>
        <div class="muted">Order Slip / Receipt</div>
        <div class="muted">Order ID: <strong>#${shortOrderId(d.orderId)}</strong> &nbsp;|&nbsp; Date: ${d.createdAt}</div>

        <table>
          <thead>
            <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>

        <table class="totals">
          <tr><td>Sub Total</td><td style="text-align:right;">₹${formatMoney(d.subTotal)}</td></tr>
          ${d.freeGift ? `<tr><td style="color:#15803d;font-weight:bold;">🎁 Free Gift (Complimentary)</td><td style="text-align:right;color:#15803d;font-weight:bold;">${d.freeGift} (FREE)</td></tr>` : ''}
          <tr><td>Coupon Discount ${d.couponCode ? `(${d.couponCode})` : ''}</td><td style="text-align:right;">- ₹${formatMoney(d.couponDiscount)}</td></tr>
          <tr><td>Multi-Pack Discount</td><td style="text-align:right;">- ₹${formatMoney(d.bulkDiscount)}</td></tr>
          <tr><td>Shipping</td><td style="text-align:right;">₹${formatMoney(d.shippingCharge)}</td></tr>
          <tr><td>Tax (GST)</td><td style="text-align:right;">₹${formatMoney(d.taxAmount)}</td></tr>
          ${d.giftBoxCharge > 0 ? `<tr><td>${d.giftBoxTitle}</td><td style="text-align:right;">₹${formatMoney(d.giftBoxCharge)}</td></tr>` : ''}
          ${d.walletAmountUsed > 0 ? `<tr><td style="color:#0284c7;font-weight:bold;">👛 Wallet Balance Used</td><td style="text-align:right;color:#0284c7;font-weight:bold;">- ₹${formatMoney(d.walletAmountUsed)}</td></tr>` : ''}
          <tr class="grand"><td>Grand Total</td><td style="text-align:right;">₹${formatMoney(d.totalAmount)}</td></tr>
        </table>

        <div class="addr">
          <strong>Delivery Address</strong><br/>
          ${d.customer.name} | ${d.customer.phone}<br/>
          ${d.customer.address}, ${d.customer.landmark}<br/>
          ${d.customer.city}, ${d.customer.state} - ${d.customer.pincode}<br/>
          Payment: ${d.paymentMethod}${d.upiTransactionId ? ' (Ref: ' + d.upiTransactionId + ')' : ''}
        </div>

        <p class="muted" style="margin-top:24px;">Thank you for shopping with Seedhe Gaon Se! 🙏</p>

        <div class="no-print" style="margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 20px;background:#881337;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Popup blocked! Please allow popups to print receipt.');
      return;
    }
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '2px solid #b91c1c' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>
                        Store Name : <strong style={{ color: '#0f172a' }}>Seedhe Gaon Se</strong>
                      </span>
                    </div>

                    <div style={{ padding: '12px 18px' }}>
                      {enrichedCartItems.map((item) => {
                        const unitPrice = parseNumericPrice(item.unitPrice || item.price);
                        const qty = Number(item.qty || item.quantity || 1);
                        const lineTotal = round2(unitPrice * qty);
                        const activeQtyDisc = itemAppliedQtyDiscounts[item.id];

                        return (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <img
                                src={item.img}
                                alt={item.name}
                                style={{ width: isSmallMobile ? '52px' : '60px', height: isSmallMobile ? '52px' : '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0', flexShrink: 0 }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
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

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (qty <= 1) {
                                        removeFromCart(item.id);
                                      } else {
                                        changeQty(item.id, -1);
                                      }
                                    }}
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

                  {/* 🎁 EXACT EXCEL SHEET FREE GIFT SECTION */}
                  <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '10px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontWeight: '800', color: '#94191d', fontSize: '0.95rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🎁</span> <strong>Free Gift on Order Value (Base Value)</strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ padding: '12px 14px', borderRadius: '8px', background: freeGiftState.tier === 1 ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${freeGiftState.tier === 1 ? '#22c55e' : '#cbd5e1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: freeGiftState.tier === 1 ? '#15803d' : '#475569' }}>
                            {freeGiftState.tier === 1 ? '🎉' : '🔒'} Order (Base Value) Rs. 1500/- : <strong>Free Gift 1 (Sweet Box)</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            {freeGiftState.tier === 1 ? '✓ Free Gift Automatically show' : freeGiftState.tier === 2 ? '⚠️ First Free Gift Show Off (Upgraded to Tier 2 Gift)' : `Add ₹${formatMoney(freeGiftState.remainingForTier1)} more to get Free Gift`}
                          </div>
                        </div>
                        <div>
                          {freeGiftState.tier === 1 ? (
                            <span style={{ background: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px' }}>
                              ACTIVE (SHOW)
                            </span>
                          ) : freeGiftState.tier === 2 ? (
                            <span style={{ background: '#e2e8f0', color: '#64748b', fontSize: '10px', fontWeight: '700', padding: '3px 7px', borderRadius: '4px' }}>
                              SHOW OFF
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                              LOCKED
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ padding: '12px 14px', borderRadius: '8px', background: freeGiftState.tier === 2 ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${freeGiftState.tier === 2 ? '#22c55e' : '#cbd5e1'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: freeGiftState.tier === 2 ? '#15803d' : '#475569' }}>
                            {freeGiftState.tier === 2 ? '🎉' : '🔒'} Order (Base Value) Rs. 2500/- : <strong>New Premium Gift (Tier 2)</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            {freeGiftState.tier === 2 ? '✓ First Free Gift Show Off and new Gift Show!' : `Add ₹${formatMoney(Math.max(0, 2500 - effectiveCartTotal))} more to upgrade Gift`}
                          </div>
                        </div>
                        <div>
                          {freeGiftState.tier === 2 ? (
                            <span style={{ background: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px' }}>
                              ACTIVE (NEW GIFT SHOW)
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: '800', padding: '4px 9px', borderRadius: '4px', border: '1px solid #fcd34d' }}>
                              LOCKED
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

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
                          if (e.target.value === 'pickup') {
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
                      shippingAddress.pincode.length === 6 && !isPincodeLoading ? (
                        pincodeDeliveryCharge !== null ? (
                          <div style={{ background: '#fef3c7', border: '1px dashed #d97706', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: '#92400e', fontWeight: '600' }}>
                            🎖️ <strong>Founder Delivery (₹5,000 Flat):</strong> Personally hand-delivered by our founder team!
                          </div>
                        ) : (
                          <div style={{ background: '#fee2e2', border: '1px dashed #dc2626', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: '#b91c1c', fontWeight: '600' }}>
                            ⚠️ Founder Delivery is not available for this pincode.
                          </div>
                        )
                      ) : (
                        <div style={{ background: '#fef3c7', border: '1px dashed #d97706', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.78rem', color: '#92400e', fontWeight: '600' }}>
                          🎖️ Enter your 6-digit Pincode below to check Founder Delivery (₹5,000 Flat) availability.
                        </div>
                      )
                    )}

                    {isHomeDeliveryType && (
                      <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1.5px solid #b91c1c' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '800', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
                          Delivery Pincode
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
                        {isPincodeLoading && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '3px' }}>⏳ Calculating delivery charges...</div>
                        )}
                        {pincodeStatusMsg && !isPincodeLoading && (
                          <div style={{ fontSize: '0.78rem', color: pincodeDeliveryCharge !== null ? '#059669' : '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                            {shippingMode === 'founder'
                              ? (pincodeDeliveryCharge !== null ? '✓ Founder Delivery available for this pincode' : pincodeStatusMsg)
                              : pincodeStatusMsg}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.88rem', color: '#334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Sub total</span>
                        <strong>₹{formatMoney(effectiveCartTotal)}</strong>
                      </div>

                      {freeGiftState.activeTitle && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: '700' }}>
                          <span>🎁 Free Gift Unlocked</span>
                          <span>{freeGiftState.activeTitle}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                        <span>Coupon discount</span>
                        <span>- ₹{formatMoney(couponDiscount)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}>
                        <span>Multi-Pack Discount</span>
                        <span>- ₹{formatMoney(bulkDiscount)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Shipping</span>
                        <span>
                          {!shippingMode ? (
                            <em style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '600' }}>Select shipping method</em>
                          ) : shippingMode === 'founder' ? (
                            pincodeDeliveryCharge !== null ? (
                              <strong style={{ color: '#b91c1c' }}>₹{formatMoney(FOUNDER_DELIVERY_CHARGE)}</strong>
                            ) : (
                              <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '700' }}>⚠️ Enter 6-digit Pincode</span>
                            )
                          ) : shippingMode === 'pickup' || isFreeDelivery ? (
                            <strong style={{ color: '#059669' }}>FREE</strong>
                          ) : pincodeDeliveryCharge !== null ? (
                            `₹${formatMoney(shippingCharge)}`
                          ) : (
                            <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '700' }}>⚠️ Enter 6-digit Pincode</span>
                          )}
                        </span>
                      </div>

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
                            <div style={{ position: 'absolute', bottom: '26px', left: '0', width: 'min(240px, 75vw)', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', boxShadow: '0 6px 16px rgba(0,0,0,0.2)', zIndex: 100, pointerEvents: 'none' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ color: '#cbd5e1' }}>Product GST ({PRODUCT_TAX_PERCENT}%):</span>
                                <strong>₹{formatMoney(productTax)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ color: '#cbd5e1' }}>Shipping GST ({currentShippingGstPercent}%):</span>
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

                      {/* 👛 WALLET CHECKBOX & TOGGLE */}
                      {walletBalance > 0 && (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            padding: '10px 11px',
                            borderRadius: '8px',
                            background: isWalletUsed ? '#f0f9ff' : '#f8fafc',
                            border: `1.5px solid ${isWalletUsed ? '#0284c7' : '#e2e8f0'}`,
                            cursor: 'pointer',
                            marginTop: '2px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isWalletUsed}
                            onChange={(e) => setIsWalletUsed(e.target.checked)}
                            style={{ width: '17px', height: '17px', accentColor: '#0284c7', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: '700', color: isWalletUsed ? '#0369a1' : '#334155' }}>
                            👛 Use Wallet Balance (₹{formatMoney(walletBalance)})
                          </span>
                          {isWalletUsed && walletDeduction > 0 && (
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0284c7', whiteSpace: 'nowrap' }}>
                              - ₹{formatMoney(walletDeduction)}
                            </span>
                          )}
                        </label>
                      )}

                      {/* 👛 Show Wallet Deduction Line Item if applied */}
                      {isWalletUsed && walletDeduction > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontWeight: '700' }}>
                          <span>👛 Wallet Amount Used</span>
                          <span>- ₹{formatMoney(walletDeduction)}</span>
                        </div>
                      )}

                      <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>Grand Total</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#b91c1c' }}>
                          ₹{formatMoney(grandTotal)}
                        </span>
                      </div>

                      {/* 🎟️ Available Sheet Coupons Showcase */}
                      {availableCoupons.length > 0 && (
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '6px' }}>
                          <div style={{ fontWeight: '800', color: '#b91c1c', fontSize: '0.82rem', marginBottom: '8px' }}>
                            🎟️ Available Coupons
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {availableCoupons.map((c) => {
                              const isApplied = appliedCoupon?.code === c.code;
                              const active = c.isUnlocked;

                              return (
                                <div
                                  key={c.code}
                                  style={{ padding: '9px 11px', borderRadius: '8px', background: isApplied ? '#f0fdf4' : active ? '#fef2f2' : '#f8fafc', border: `1px dashed ${isApplied ? '#22c55e' : active ? '#b91c1c' : '#cbd5e1'}` }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '0.86rem', fontWeight: '800', color: active ? '#b91c1c' : '#64748b' }}>
                                        🎫 {c.code}
                                      </span>
                                      {c.maxUsage > 1 && (
                                        <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                                          🔁 {c.remainingUses} Uses Left
                                        </span>
                                      )}
                                      {c.maxUsage === 1 && (
                                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                                          1-Time Use
                                        </span>
                                      )}
                                    </div>

                                    <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>
                                      {c.discountType === 'percentage' ? `${c.discountValue}% OFF (Max ₹${c.maxDiscountValue})` : `Flat ₹${c.discountValue} OFF`}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                                    Min Base Value: ₹{formatMoney(c.minSpend)} • {c.productName}
                                  </div>

                                  <div style={{ marginTop: '6px' }}>
                                    {isApplied ? (
                                      <button
                                        type="button"
                                        onClick={handleRemoveCoupon}
                                        style={{ background: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                      >
                                        ✓ APPLIED — Remove
                                      </button>
                                    ) : active ? (
                                      <button
                                        type="button"
                                        onClick={() => handleApplyCoupon(c.code)}
                                        style={{ background: '#b91c1c', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                      >
                                        🔓 APPLY NOW
                                      </button>
                                    ) : (
                                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                                        🔒 Add ₹{formatMoney(c.remaining)} more
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

                    <div style={{ marginTop: '16px' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code (e.g. SGS50, SGS100, SGS125)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box', marginBottom: '8px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        style={{ width: '100%', padding: '10px', background: '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        Apply Code
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
                        ⏪ Continue Shopping
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
                Please log in to your account or register to confirm your order.
              </p>
              <button
                onClick={() => { handleClose(); navigate('/auth'); }}
                style={{ width: '100%', padding: '12px', background: '#94191d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginBottom: '10px' }}
              >
                🔑 Log In / Sign In to Continue
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

                  <label style={labelStyle}>Contact Person Name <span style={{ color: '#b91c1c' }}>*</span></label>
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
                  <input type="text" required placeholder="e.g. Near City Center, 2nd Floor" value={shippingAddress.landmark} onChange={(e) => setShippingAddress({ ...shippingAddress, landmark: e.target.value })} style={inputStyle} />

                  <label style={labelStyle}>State / Union Territory <span style={{ color: '#b91c1c' }}>*</span></label>
                  <select required value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} style={inputStyle}>
                    <option value="">Select State / UT</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <label style={labelStyle}>City <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="text" required placeholder="e.g. Noida, Delhi" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} style={inputStyle} />

                  <label style={labelStyle}>Zip Code (6 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                  <input type="text" maxLength="6" required placeholder="Enter 6-digit zip code" value={shippingAddress.pincode} onChange={handlePincodeChange} style={inputStyle} />

                  <label style={labelStyle}>Country <span style={{ color: '#b91c1c' }}>*</span></label>
                  <select value={shippingAddress.country} onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} style={inputStyle}>
                    <option value="India">India</option>
                  </select>

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

                      <label style={labelStyle}>Zip Code (6 Digits) <span style={{ color: '#b91c1c' }}>*</span></label>
                      <input type="text" maxLength="6" required={!sameAsShipping} placeholder="Enter 6-digit zip code" value={billingAddress.pincode} onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })} style={inputStyle} />
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' }}>💳 Payment Method</h3>

                  {grandTotal === 0 && walletDeduction > 0 ? (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #22c55e', padding: '14px', borderRadius: '8px', color: '#15803d', fontWeight: '700', fontSize: '0.92rem' }}>
                      ✓ ₹{formatMoney(walletDeduction)} deducted from your Wallet. <strong>Your order is fully paid!</strong> No additional payment required.
                    </div>
                  ) : (
                    <>
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
                    </>
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

          {step === 'success' && (
            <div style={{ maxWidth: '680px', margin: '0 auto', background: '#fff', padding: isSmallMobile ? '16px 14px' : '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>

              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#22c55e', color: '#fff', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  ✓
                </div>
                <h2 style={{ color: '#0f172a', margin: '0 0 6px', fontSize: '1.4rem' }}>Order Placed Successfully!</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                  Order ID: <strong style={{ color: '#94191d' }}>#{shortOrderId(confirmedOrderId)}</strong>
                  {placedOrderDetails && <span> • {placedOrderDetails.createdAt}</span>}
                </p>
              </div>

              {placedOrderDetails && (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '2px solid #b91c1c', fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>
                    🧾 Order Items ({placedOrderDetails.itemsSnapshot.length})
                  </div>
                  {placedOrderDetails.itemsSnapshot.map((item, idx) => (
                    <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <img src={item.img} alt={item.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0', flexShrink: 0 }} onError={(e) => { e.target.src = 'https://via.placeholder.com/44'; }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.variant} • Qty: {item.qty} × ₹{formatMoney(item.unitPrice)}</div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>₹{formatMoney(item.totalPrice)}</div>
                    </div>
                  ))}
                </div>
              )}

              {placedOrderDetails && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '16px', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sub Total</span><strong>₹{formatMoney(placedOrderDetails.subTotal)}</strong></div>
                  {placedOrderDetails.freeGift && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 'bold' }}>
                      <span>🎁 Free Gift Awarded</span>
                      <span>{placedOrderDetails.freeGift} (FREE)</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}><span>Coupon Discount {placedOrderDetails.couponCode ? `(${placedOrderDetails.couponCode})` : ''}</span><span>- ₹{formatMoney(placedOrderDetails.couponDiscount)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ec4899' }}><span>Multi-Pack Discount</span><span>- ₹{formatMoney(placedOrderDetails.bulkDiscount)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping ({placedOrderDetails.shippingType})</span><span>₹{formatMoney(placedOrderDetails.shippingCharge)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax (GST)</span><span>₹{formatMoney(placedOrderDetails.taxAmount)}</span></div>
                  {placedOrderDetails.giftBoxCharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{placedOrderDetails.giftBoxTitle}</span><span>₹{formatMoney(placedOrderDetails.giftBoxCharge)}</span></div>
                  )}
                  {placedOrderDetails.walletAmountUsed > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontWeight: 'bold' }}>
                      <span>👛 Wallet Balance Used</span>
                      <span>- ₹{formatMoney(placedOrderDetails.walletAmountUsed)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.02rem', fontWeight: '800' }}>Grand Total</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#b91c1c' }}>₹{formatMoney(placedOrderDetails.totalAmount)}</span>
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                    Payment: <strong>{placedOrderDetails.paymentMethod}</strong>
                    {placedOrderDetails.upiTransactionId ? ` (Ref: ${placedOrderDetails.upiTransactionId})` : ''}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isSmallMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleDownloadSlip}
                  style={{ width: '100%', padding: '14px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.92rem', cursor: 'pointer' }}
                >
                  📥 Download Slip
                </button>
                <button
                  onClick={handleClose}
                  style={{ width: '100%', padding: '14px', background: '#881337', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '800', fontSize: '0.92rem', cursor: 'pointer' }}
                >
                  Continue Shopping 🛍️
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CartDrawer;