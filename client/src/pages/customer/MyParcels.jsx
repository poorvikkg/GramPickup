import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const MyParcels = () => {
  const { apiFetch } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Rating state
  const [ratingShopId, setRatingShopId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchParcels = async () => {
    try {
      const data = await apiFetch('/parcels/my-parcels');
      setParcels(data);
    } catch (err) {
      console.error('Failed to load parcels', err);
      setError('Could not load your parcels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleRateShop = async (shopId) => {
    setSubmittingRating(true);
    try {
      await apiFetch(`/shops/${shopId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating: ratingValue, feedback: ratingFeedback }),
      });
      alert('Thank you for your feedback!');
      setRatingShopId(null);
      setRatingValue(5);
      setRatingFeedback('');
    } catch (err) {
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Filter parcels
  const filteredParcels = statusFilter
    ? parcels.filter(p => p.status === statusFilter)
    : parcels;

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading your parcels...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
          My Registered Parcels
        </h1>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
          <span>Filter by Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 py-1.5 px-3 bg-white focus:outline-none focus:border-black"
          >
            <option value="">All Statuses</option>
            <option value="Expected">Expected</option>
            <option value="Arrived">Arrived</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {filteredParcels.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider">
          No parcels found matching the selection.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredParcels.map((parcel) => (
            <div key={parcel._id} className="border border-gray-200 p-6 bg-white space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-bold text-black uppercase">{parcel.parcelName}</h2>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">Tracking: {parcel.trackingNumber}</p>
                </div>
                <div>
                  <span className={`badge-minimal ${
                    parcel.status === 'Expected' ? 'border-gray-300 text-gray-600' :
                    parcel.status === 'Arrived' ? 'border-blue-300 text-blue-800' :
                    parcel.status === 'Ready for Pickup' ? 'border-yellow-500 text-yellow-800 font-bold' :
                    'border-black text-black bg-gray-50'
                  }`}>
                    {parcel.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-light text-gray-600">
                {/* Shop details */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1">Pickup Store</h3>
                  <p className="font-semibold text-black">{parcel.shopId?.shopName}</p>
                  <p className="text-xs mt-0.5">{parcel.shopId?.address}</p>
                  <p className="text-xs">{parcel.shopId?.city}</p>
                  <p className="text-xs mt-1">Phone: {parcel.shopId?.phone}</p>
                </div>

                {/* Dates & Storage */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1">Timeline</h3>
                  <p className="text-xs">Expected: {formatDate(parcel.expectedArrivalDate)}</p>
                  {parcel.arrivalDate && (
                    <p className="text-xs mt-0.5">Arrived: {formatDate(parcel.arrivalDate)}</p>
                  )}
                  {parcel.pickupDate && (
                    <p className="text-xs mt-0.5 font-medium text-black">Picked Up: {formatDate(parcel.pickupDate)}</p>
                  )}
                  {parcel.arrivalDate && (
                    <p className="text-xs mt-1 font-semibold text-black">
                      Storage Days: {parcel.daysStored} {parcel.daysStored === 1 ? 'day' : 'days'}
                    </p>
                  )}
                </div>

                {/* OTP & Fees */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1">Fee & Verification</h3>
                  
                  {parcel.status === 'Expected' ? (
                    <p className="text-xs text-gray-400 italic">No charges accrued yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500 uppercase block">Fee Details:</span>
                        <span className="text-xl font-bold text-black">₹{parcel.currentFee || parcel.fee}</span>
                        {parcel.status !== 'Delivered' && (
                          <span className="text-[10px] text-gray-400 block mt-0.5 uppercase tracking-wide">
                            (Base ₹10 + ₹2/day, accruing)
                          </span>
                        )}
                      </div>

                      {parcel.status === 'Ready for Pickup' && parcel.otp && (
                        <div className="border border-black p-2 inline-block bg-gray-50">
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-semibold">Verification OTP</span>
                          <span className="text-lg font-mono font-bold tracking-widest text-black">{parcel.otp}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rate Shop - visible only for Delivered parcels */}
              {parcel.status === 'Delivered' && parcel.shopId && (
                <div className="border-t border-gray-100 pt-4">
                  {ratingShopId === parcel.shopId._id ? (
                    <div className="border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Rate "{parcel.shopId.shopName}"
                      </h4>
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">Rating:</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingValue(star)}
                              className={`text-2xl transition-all duration-150 ${
                                star <= ratingValue ? 'text-yellow-500 scale-110' : 'text-gray-300'
                              } hover:text-yellow-400`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-black">{ratingValue}/5</span>
                      </div>

                      {/* Quick Tags Selector */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Quick Feedback Tags (Click to toggle)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {["Fast Handover", "Secure Storage", "Polite Owner", "Convenient Location", "Fair Fees"].map((tag) => {
                            const isSelected = ratingFeedback.split(',').map(t => t.trim()).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  let currentTags = ratingFeedback.split(',').map(t => t.trim()).filter(Boolean);
                                  if (currentTags.includes(tag)) {
                                    currentTags = currentTags.filter(t => t !== tag);
                                  } else {
                                    currentTags.push(tag);
                                  }
                                  setRatingFeedback(currentTags.join(', '));
                                }}
                                className={`text-[10px] uppercase tracking-wider px-2.5 py-1 border transition-all duration-150 font-medium ${
                                  isSelected
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                          Written Review Details (Optional)
                        </label>
                        <textarea
                          value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          rows={2}
                          className="input-field"
                          placeholder="Provide additional details or customize tags here..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRateShop(parcel.shopId._id)}
                          disabled={submittingRating}
                          className="btn-primary py-1.5 px-4 text-xs"
                        >
                          {submittingRating ? 'Submitting...' : 'Submit Rating'}
                        </button>
                        <button
                          onClick={() => { setRatingShopId(null); setRatingValue(5); setRatingFeedback(''); }}
                          className="btn-secondary py-1.5 px-4 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRatingShopId(parcel.shopId._id)}
                      className="btn-secondary py-1.5 px-4 text-xs"
                    >
                      ★ Rate This Shop
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyParcels;
