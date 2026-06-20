import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { apiFetch, syncShopContext } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    shopName: '',
    address: '',
    city: '',
    phone: '',
    shopPhoto: '',
    latitude: '',
    longitude: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const data = await apiFetch('/shops/mine');
        setShop(data);
        setFormData({
          shopName: data.shopName || '',
          address: data.address || '',
          city: data.city || '',
          phone: data.phone || '',
          shopPhoto: data.shopPhoto || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
        });
      } catch (err) {
        console.error('Failed to load shop', err);
        setError('No registered shop details found.');
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      const data = await apiFetch('/shops/mine', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setShop(data);
      syncShopContext(data);
      setSuccess('Shop details updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update shop details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading shop details...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold uppercase tracking-wider text-black mb-6">
        Shop Profile Details
      </h1>

      <div className="border border-gray-200 p-6 bg-white space-y-6">
        
        {/* Verification Status Banner */}
        {shop && (
          <div className="border-t border-b border-gray-100 py-3 flex justify-between items-center text-xs">
            <span className="font-semibold uppercase tracking-wider text-gray-500">Verification Status:</span>
            <span className={`badge-minimal ${
              shop.verificationStatus === 'pending' ? 'border-yellow-400 text-yellow-800' :
              shop.verificationStatus === 'approved' ? 'border-black text-black font-semibold' :
              'border-red-400 text-red-700'
            }`}>
              {shop.verificationStatus}
            </span>
          </div>
        )}

        {success && (
          <div className="border border-black text-black p-3 text-sm uppercase tracking-wider font-semibold">
            {success}
          </div>
        )}

        {error && !shop && (
          <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        {shop && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="shopName" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Shop Name
              </label>
              <input
                type="text"
                id="shopName"
                name="shopName"
                required
                value={formData.shopName}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Shop Address (For parcel shipping)
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                City / Town
              </label>
              <input
                type="text"
                id="city"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Shop Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="shopPhoto" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Shop Photo URL
              </label>
              <input
                type="url"
                id="shopPhoto"
                name="shopPhoto"
                value={formData.shopPhoto}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. https://images.unsplash.com/... or upload image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 28.6139"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g. 77.2090"
                />
              </div>
            </div>

            {formData.shopPhoto && (
              <div className="mt-2 border border-gray-200 p-2">
                <p className="text-[10px] uppercase font-semibold text-gray-400 mb-1">Photo Preview</p>
                <img src={formData.shopPhoto} alt="Shop preview" className="w-full h-32 object-cover grayscale" />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
