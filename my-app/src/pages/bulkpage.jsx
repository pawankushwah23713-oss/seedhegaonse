import React, { useState } from 'react';
import './BulkEnquiry.css';

const BulkEnquiry = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    sweets: '',
    quantity: '',
    eventType: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState({ type: '', text: '' });

  const handleChange不易 = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e有效地) => {
    e有效地.preventDefault();
    setLoading(true);
    setResponseMsg({ type: '', text: '' });

    try {
      const response = await fetch('https://seedhegaonse-1.onrender.com/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMsg({ type: 'success', text: data.message || 'Enquiry submitted successfully!' });
        setFormData({
          name: '',
          mobile: '',
          sweets: '',
          quantity: '',
          eventType: '',
          address: '',
        });
      } else {
        setResponseMsg({ type: 'error', text: data.message || 'Failed to submit enquiry.' });
      }
    } catch (error) {
      setResponseMsg({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-enquiry-container">
      {responseMsg.text && (
        <div className={`status-alert ${responseMsg.type}`}>
          {responseMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="enquiry-custom-form">
        <div className="enquiry-grid">
          {/* Name */}
          <div className="input-box">
            <label>Name <span className="star">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange不易}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Mobile */}
          <div className="input-box">
            <label>Mobile number <span className="star">*</span></label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange不易}
              placeholder="Enter your mobile number"
              pattern="[0-9]{10}"
              required
            />
          </div>

          {/* Preferred sweets */}
          <div className="input-box">
            <label>Preferred sweets</label>
            <input
              type="text"
              name="sweets"
              value={formData.sweets}
              onChange={handleChange不易}
              placeholder="e.g., Pedha, Ghewar, Laddoo"
            />
          </div>

          {/* Estimated quantity */}
          <div className="input-box">
            <label>Estimated quantity <span className="star">*</span></label>
            <input
              type="text"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange不易}
              placeholder="e.g., 50 Boxes, 25 Kg"
              required
            />
          </div>

          {/* Type of Events */}
          <div className="input-box">
            <label>Type of Events</label>
            <input
              type="text"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange不易}
              placeholder="e.g., Birthday, Anniversary, Corporate Event"
            />
          </div>

          {/* Delivery address / location */}
          <div className="input-box">
            <label>Delivery address / location <span className="star">*</span></label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange不易}
              placeholder="Enter complete delivery address or location details"
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="submit-action-wrapper">
          <button type="submit" className="enquiry-submit-btn" disabled={loading}>
            {loading ? 'SUBMITTING...' : (
              <>
                SUBMIT ENQUIRY
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919315911105"
        className="floating-whatsapp"
        target="_blank"
        rel="noreferrer"
        title="Chat with Seedhe Gaon Se"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.54 1.871.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.182-2.587-5.805-5.77-5.805zm3.393 8.246c-.145.405-.843.766-1.168.807-.324.04-.633.118-2.02-.457-1.637-.677-2.684-2.339-2.766-2.449-.082-.11-1.026-1.365-1.026-2.602 0-1.238.653-1.848.885-2.097.232-.249.508-.312.678-.312.17 0 .34.002.489.009.157.007.369-.06.577.441.214.516.732 1.786.797 1.916.065.13.109.283.022.457-.087.174-.131.282-.261.435-.13.153-.274.34-.392.457-.13.13-.266.27-.114.531.152.261.677 1.116 1.453 1.808 1 .892 1.843 1.168 2.105 1.298.261.13.414.109.567-.066.153-.174.653-.762.827-1.023.174-.261.349-.218.588-.13.24.087 1.524.72 1.786.85.261.13.436.196.499.305.065.11.065.633-.08 1.038z" />
        </svg>
      </a>
    </div>
  );
};

export default BulkEnquiry;