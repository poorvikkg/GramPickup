import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Shops = () => {
  const { apiFetch, user } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  
  // Rating and review states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingTags, setRatingTags] = useState([]);
  const [customComment, setCustomComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/shops/approved');
      setShops(data);
      // Update selected shop if it's currently open to reflect new rating/reviews
      if (selectedShop) {
        const updated = data.find(s => s._id === selectedShop._id);
        if (updated) setSelectedShop(updated);
      }
    } catch (err) {
      console.error('Failed to load approved shops', err);
      setError('Could not retrieve verified shops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleOpenReviews = (shop) => {
    setSelectedShop(shop);
    // Check if customer already rated this shop
    const userRating = shop.ratings?.find(r => r.customerId === user?._id);
    if (userRating) {
      setRatingValue(userRating.rating);
      // Split tags and custom comment from the stored feedback
      // In previous implementation, feedback was stored as a comma-separated list of tags + comment or just text.
      // Let's parse it safely:
      const savedFeedback = userRating.feedback || '';
      const tagsList = ["Fast Handover", "Secure Storage", "Polite Owner", "Convenient Location", "Fair Fees"];
      const matchedTags = tagsList.filter(tag => savedFeedback.includes(tag));
      setRatingTags(matchedTags);
      
      // The rest of the feedback is the custom comment
      let cleanedComment = savedFeedback;
      matchedTags.forEach(tag => {
        cleanedComment = cleanedComment.replace(tag, '');
      });
      cleanedComment = cleanedComment.replace(/^[\s,]+|[\s,]+$/g, ''); // Clean leading/trailing commas and spaces
      setCustomComment(cleanedComment);
    } else {
      setRatingValue(5);
      setRatingTags([]);
      setCustomComment('');
    }
    setShowRatingForm(false);
  };

  const handleToggleTag = (tag) => {
    if (ratingTags.includes(tag)) {
      setRatingTags(ratingTags.filter(t => t !== tag));
    } else {
      setRatingTags([...ratingTags, tag]);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!selectedShop) return;

    setSubmittingRating(true);
    try {
      // Combine selected tags and custom comment
      const parts = [...ratingTags];
      if (customComment.trim()) {
        parts.push(customComment.trim());
      }
      const combinedFeedback = parts.join(', ');

      await apiFetch(`/shops/${selectedShop._id}/rate`, {
        method: 'POST',
        body: JSON.stringify({
          rating: ratingValue,
          feedback: combinedFeedback
        })
      });

      alert('Thank you! Your rating and review has been submitted.');
      setShowRatingForm(false);
      await fetchShops();
    } catch (err) {
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return (
      <span className="text-yellow-500 tracking-tighter">
        {'★'.repeat(full)}
        {half ? '½' : ''}
        {'☆'.repeat(empty)}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get unique cities for filtering
  const cities = [...new Set(shops.map(s => s.city))].filter(Boolean);

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shop.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter ? shop.city === cityFilter : true;
    return matchesSearch && matchesCity;
  });

  if (loading && shops.length === 0) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading shop network list...
      </div>
    );
  }

  const existingUserRating = selectedShop?.ratings?.find(r => r.customerId === user?._id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
          Verified Pickup Shops
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          Browse verified shops in our pickup network, view ratings, and read customer feedback.
        </p>
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-100 pb-6">
        <div className="sm:col-span-2">
          <input
            type="text"
            placeholder="Search by shop name, address, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="input-field bg-white"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filteredShops.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider">
          No verified shops found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <div key={shop._id} className="border border-gray-200 bg-white flex flex-col justify-between hover:border-black transition-colors duration-150">
              <div>
                {/* Shop Photo */}
                {shop.shopPhoto ? (
                  <img
                    src={shop.shopPhoto}
                    alt={shop.shopName}
                    className="w-full h-48 object-cover border-b border-gray-200"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-48 border-b border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400 uppercase tracking-widest">
                    No Shop Image Provided
                  </div>
                )}
                
                {/* Shop Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <span className="badge-minimal border-black bg-gray-50 text-black py-0.5 px-2 text-[9px] font-bold">
                      {shop.city}
                    </span>
                    <h2 className="text-lg font-bold text-black uppercase mt-1.5">{shop.shopName}</h2>
                  </div>

                  <p className="text-xs text-gray-500 font-light leading-relaxed">{shop.address}</p>

                  <div className="flex items-center gap-1.5 text-sm">
                    {shop.averageRating ? (
                      <>
                        {renderStars(shop.averageRating)}
                        <span className="font-bold text-black ml-1">{shop.averageRating}/5</span>
                        <span className="text-xs text-gray-400">({shop.ratings?.length || 0} reviews)</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic font-light">No ratings yet</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleOpenReviews(shop)}
                  className="btn-secondary w-full text-center"
                >
                  View Details & Reviews
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details & Reviews Slideover/Modal Overlay */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white min-h-screen flex flex-col justify-between border-l border-gray-200 shadow-2xl relative animate-slide-in">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedShop(null)}
              className="absolute top-4 left-4 z-10 w-8 h-8 rounded-full border border-gray-200 bg-white hover:border-black flex items-center justify-center font-bold text-black shadow-xs transition-colors"
            >
              ✕
            </button>

            {/* Content Scroll Area */}
            <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6 pt-16">
              
              {/* Photo header if available */}
              {selectedShop.shopPhoto && (
                <img
                  src={selectedShop.shopPhoto}
                  alt={selectedShop.shopName}
                  className="w-full h-56 object-cover border border-gray-200"
                />
              )}

              {/* Info details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="badge-minimal border-black bg-black text-white py-0.5 px-2.5 text-[9px] font-bold">
                    {selectedShop.city}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                    Verified pickup partner
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-black uppercase">{selectedShop.shopName}</h2>
                <p className="text-sm text-gray-600 font-light">{selectedShop.address}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-b border-gray-100 py-3 mt-4">
                  <p><strong className="uppercase font-semibold text-gray-500 mr-1.5">Owner:</strong>{selectedShop.ownerName}</p>
                  <p><strong className="uppercase font-semibold text-gray-500 mr-1.5">Contact:</strong>{selectedShop.phone}</p>
                </div>
              </div>

              {/* Rating Overview */}
              <div className="border border-gray-200 p-5 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total rating score</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-black">
                      {selectedShop.averageRating ? selectedShop.averageRating : '0.0'}
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-sm leading-none">{renderStars(selectedShop.averageRating || 0)}</div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                        Based on {selectedShop.ratings?.length || 0} customer reviews
                      </p>
                    </div>
                  </div>
                </div>

                {!showRatingForm && (
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="btn-primary py-2 px-5 text-xs self-stretch sm:self-auto"
                  >
                    {existingUserRating ? 'Edit Your Review' : 'Rate This Store'}
                  </button>
                )}
              </div>

              {/* Rating Form Panel */}
              {showRatingForm && (
                <form onSubmit={handleSubmitRating} className="border border-black p-5 bg-white space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-black">
                      {existingUserRating ? 'Edit your store rating' : 'Submit your store rating'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowRatingForm(false)}
                      className="text-xs text-gray-400 uppercase font-bold hover:text-black"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Stars input */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">Rating Score:</label>
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
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Quick Service Tags (Click to toggle)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Fast Handover", "Secure Storage", "Polite Owner", "Convenient Location", "Fair Fees"].map((tag) => {
                        const isSelected = ratingTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
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

                  {/* Custom Written Comments */}
                  <div>
                    <label htmlFor="customComment" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                      Written Review Details (Optional)
                    </label>
                    <textarea
                      id="customComment"
                      value={customComment}
                      onChange={(e) => setCustomComment(e.target.value)}
                      rows={3}
                      className="input-field"
                      placeholder="Share your personal experience with pickup service, reliability, storage condition, etc."
                    />
                  </div>

                  {/* Form Submission */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingRating}
                      className="btn-primary py-2 px-5 text-xs"
                    >
                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRatingForm(false)}
                      className="btn-secondary py-2 px-5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews timeline list */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                  Customer Reviews ({selectedShop.ratings?.length || 0})
                </h3>

                {selectedShop.ratings && selectedShop.ratings.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {selectedShop.ratings.map((review, idx) => (
                      <div key={idx} className="py-4 space-y-2 text-sm first:pt-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black">{review.customerName}</span>
                            {review.customerId === user?._id && (
                              <span className="badge-minimal border-gray-300 text-gray-500 text-[8px] bg-gray-50 font-semibold px-1 py-0 mt-0.5">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-light">{formatDate(review.createdAt)}</span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-500 font-bold">{review.rating}/5</span>
                        </div>

                        {/* Feedback / Tags */}
                        {review.feedback && (
                          <div className="space-y-1.5">
                            {/* Parse tags vs review comments */}
                            <div className="flex flex-wrap gap-1.5">
                              {["Fast Handover", "Secure Storage", "Polite Owner", "Convenient Location", "Fair Fees"].map(tag => {
                                if (review.feedback.includes(tag)) {
                                  return (
                                    <span key={tag} className="inline-block text-[9px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 font-medium uppercase tracking-wider">
                                      {tag}
                                    </span>
                                  );
                                }
                                return null;
                              })}
                            </div>
                            
                            {/* Detailed review comment */}
                            {(() => {
                              const tags = ["Fast Handover", "Secure Storage", "Polite Owner", "Convenient Location", "Fair Fees"];
                              let comment = review.feedback;
                              tags.forEach(tag => {
                                comment = comment.replace(tag, '');
                              });
                              comment = comment.replace(/^[\s,]+|[\s,]+$/g, '');
                              return comment ? (
                                <p className="text-gray-700 font-light text-xs italic bg-gray-50 p-2.5 border-l-2 border-black">
                                  "{comment}"
                                </p>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-4">No reviews have been written for this shop yet.</p>
                )}
              </div>

            </div>

            {/* Bottom Footer block */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                GramPickup Network Verified
              </span>
              <button
                onClick={() => setSelectedShop(null)}
                className="btn-secondary py-1.5 px-4 text-xs font-semibold"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;
