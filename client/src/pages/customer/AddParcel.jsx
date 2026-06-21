import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AddParcel = () => {
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    parcelName: '',
    trackingNumber: '',
    shopId: '',
    expectedArrivalDate: '',
  });

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await apiFetch('/shops/approved');
        setShops(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, shopId: data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load approved shops', err);
        setError('Could not load shop network. Please try again.');
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.shopId) {
      return setError('Please select a pickup shop');
    }

    setSubmitting(true);

    try {
      await apiFetch('/parcels', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      navigate('/customer/parcels');
    } catch (err) {
      setError(err.message || 'Failed to register parcel. Check details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedShop = shops.find(s => s._id === formData.shopId);

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold uppercase tracking-wider text-black mb-6">
        Register Expected Parcel
      </h1>

      <div className="border border-gray-200 p-6 bg-white">
        {error && (
          <div className="border border-red-500 text-red-600 p-3 text-sm mb-4 uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        {loadingShops ? (
          <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-4">
            Loading verified shop network...
          </div>
        ) : shops.length === 0 ? (
          <div className="text-sm border border-gray-300 p-4 text-gray-600 text-center">
            No verified city shops are registered in our network yet. Please try again later.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="parcelName" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Parcel Description / Name
              </label>
              <input
                type="text"
                id="parcelName"
                name="parcelName"
                required
                value={formData.parcelName}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Mechanical Spares, Book Package"
              />
            </div>

            <div>
              <label htmlFor="trackingNumber" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Tracking Number
              </label>
              <input
                type="text"
                id="trackingNumber"
                name="trackingNumber"
                required
                value={formData.trackingNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. TRK10293847"
              />
            </div>

            <div>
              <label htmlFor="shopId" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Select Pickup Shop
              </label>
              <select
                id="shopId"
                name="shopId"
                required
                value={formData.shopId}
                onChange={handleChange}
                className="input-field bg-white"
              >
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.shopName} - {shop.city} {shop.averageRating ? `★${shop.averageRating}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Shop Preview */}
            {selectedShop && (
              <div className="space-y-3">
                <div className="border border-gray-200 bg-gray-50/50 p-3 flex items-start gap-3">
                  {selectedShop.shopPhoto ? (
                    <img
                      src={selectedShop.shopPhoto}
                      alt={selectedShop.shopName}
                      className="w-16 h-16 object-cover border border-gray-200 flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-16 h-16 border border-gray-200 bg-gray-100 flex items-center justify-center text-[9px] text-gray-400 uppercase flex-shrink-0">
                      No Photo
                    </div>
                  )}
                  <div className="text-xs">
                    <p className="font-bold text-black">{selectedShop.shopName}</p>
                    <p className="text-gray-500">{selectedShop.address}, {selectedShop.city}</p>
                    <p className="text-gray-900 font-semibold mt-0.5">Shopkeeper Contact: {selectedShop.phone}</p>
                    {selectedShop.averageRating ? (
                      <p className="mt-1">
                        <span className="text-yellow-500">{renderStars(selectedShop.averageRating)}</span>
                        <span className="text-gray-600 ml-1 font-semibold">{selectedShop.averageRating}/5</span>
                        <span className="text-gray-400 ml-1">({selectedShop.ratings?.length || 0} reviews)</span>
                      </p>
                    ) : (
                      <p className="text-gray-400 mt-1 italic">No ratings yet</p>
                    )}
                  </div>
                </div>

                {/* Shipping helper utility */}
                <div className="border border-black bg-black text-white p-4 text-xs uppercase tracking-wider space-y-3">
                  <p className="font-bold text-center">Delivery Details for Online Orders</p>
                  <p className="text-[10px] text-gray-300 normal-case leading-relaxed font-light">
                    Copy and paste these details into Amazon, Flipkart, or any online store during checkout:
                  </p>
                <div className="bg-gray-900 p-3 space-y-2 font-mono text-[10px] text-gray-200 border border-gray-800 normal-case break-words">
                    <p><strong>Name:</strong> [Your Name] (c/o {selectedShop.shopName})</p>
                    <p><strong>Address:</strong> {selectedShop.address}, {selectedShop.city}</p>
                    <p className="text-yellow-400 font-semibold"><strong>Phone Number:</strong> {selectedShop.phone}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="expectedArrivalDate" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Expected Arrival Date
              </label>
              <input
                type="date"
                id="expectedArrivalDate"
                name="expectedArrivalDate"
                required
                value={formData.expectedArrivalDate}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Parcel'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddParcel;
