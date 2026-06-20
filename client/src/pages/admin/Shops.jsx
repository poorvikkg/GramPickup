import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Shops = () => {
  const { apiFetch } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/shops');
      setShops(data);
    } catch (err) {
      console.error('Failed to load shops', err);
      setError('Could not load registered shops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      await apiFetch(`/shops/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      alert(`Shop has been successfully ${status}.`);
      fetchShops();
    } catch (err) {
      alert(err.message || 'Failed to update shop status.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredShops = filter
    ? shops.filter(shop => shop.verificationStatus === filter)
    : shops;

  const statusColor = (status) => {
    if (status === 'pending') return 'border-yellow-400 text-yellow-800 bg-yellow-50';
    if (status === 'approved') return 'border-emerald-400 text-emerald-800 bg-emerald-50';
    return 'border-red-400 text-red-700 bg-red-50';
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      <span className="text-sm tracking-tighter">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading shop database ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
            Shop Verification Panel
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            {shops.length} total registrations &bull; {shops.filter(s => s.verificationStatus === 'pending').length} pending review
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider">
          <span>Filter Status:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 py-1.5 px-3 bg-white focus:outline-none focus:border-black"
          >
            <option value="">All Registrations</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved & Active</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {filteredShops.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider bg-white">
          No shops found matching the selected status.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredShops.map((shop) => (
            <div key={shop._id} className="border border-gray-200 bg-white">
              {/* Shop Card Header */}
              <div className="flex items-start gap-4 p-4">
                {/* Shop Photo */}
                <div className="w-20 h-20 flex-shrink-0 border border-gray-200 bg-gray-50 overflow-hidden">
                  {shop.shopPhoto ? (
                    <img
                      src={shop.shopPhoto}
                      alt={shop.shopName}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] uppercase tracking-wider">
                      No Photo
                    </div>
                  )}
                </div>

                {/* Shop Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-black text-sm">{shop.shopName}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {shop._id}</p>
                    </div>
                    <span className={`badge-minimal ${statusColor(shop.verificationStatus)}`}>
                      {shop.verificationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                    <div>
                      <span className="text-gray-400 uppercase tracking-wider block text-[10px] font-bold">Owner</span>
                      <span className="text-black font-semibold">{shop.ownerName}</span>
                      <span className="text-gray-500 block">{shop.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 uppercase tracking-wider block text-[10px] font-bold">Location</span>
                      <span className="text-black">{shop.address}</span>
                      <span className="text-gray-500 block">{shop.city}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 uppercase tracking-wider block text-[10px] font-bold">Coordinates</span>
                      {shop.latitude && shop.longitude ? (
                        <span className="text-black font-mono text-[11px]">
                          {shop.latitude.toFixed(4)}, {shop.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-400 uppercase tracking-wider block text-[10px] font-bold">Rating</span>
                      {shop.averageRating ? (
                        <div>
                          <span className="text-black font-bold">{shop.averageRating}</span>
                          <span className="text-gray-400 ml-1">/5</span>
                          <span className="text-yellow-500 ml-1">{renderStars(shop.averageRating)}</span>
                          <span className="text-gray-400 block">({shop.ratings?.length || 0} reviews)</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No ratings</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Registered: {formatDate(shop.createdAt)}</span>
                  <button
                    onClick={() => setExpandedId(expandedId === shop._id ? null : shop._id)}
                    className="text-black font-semibold uppercase tracking-wider hover:underline"
                  >
                    {expandedId === shop._id ? 'Hide Reviews' : `View Reviews (${shop.ratings?.length || 0})`}
                  </button>
                </div>

                <div className="flex gap-2">
                  {shop.verificationStatus !== 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(shop._id, 'approved')}
                      disabled={processingId === shop._id}
                      className="btn-primary py-1 px-3.5 text-xs uppercase"
                    >
                      {processingId === shop._id ? '...' : 'Approve'}
                    </button>
                  )}
                  {shop.verificationStatus !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(shop._id, 'rejected')}
                      disabled={processingId === shop._id}
                      className="btn-danger py-1 px-3.5 text-xs uppercase"
                    >
                      {processingId === shop._id ? '...' : 'Reject'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Reviews Section */}
              {expandedId === shop._id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50/30">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Customer Reviews</h4>
                  {shop.ratings && shop.ratings.length > 0 ? (
                    <div className="space-y-3">
                      {shop.ratings.map((r, idx) => (
                        <div key={idx} className="border border-gray-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-black">{r.customerName}</span>
                              <span className="text-yellow-500 text-sm">{renderStars(r.rating)}</span>
                              <span className="text-xs text-gray-400 font-bold">{r.rating}/5</span>
                            </div>
                            <span className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</span>
                          </div>
                          {r.feedback && (
                            <p className="text-xs text-gray-600 mt-1.5 font-light leading-relaxed">"{r.feedback}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No customer reviews yet.</p>
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

export default Shops;
