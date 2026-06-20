import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, apiFetch, syncShopContext } = useAuth();
  const [shop, setShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(true);
  const [stats, setStats] = useState({
    received: 0,
    pending: 0,
    delivered: 0,
    revenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');

  // Shop Registration Form State
  const [regData, setRegData] = useState({
    shopName: '',
    address: '',
    city: '',
    phone: user?.phone || '',
    shopPhoto: '',
    latitude: '',
    longitude: '',
  });
  const [registering, setRegistering] = useState(false);

  const fetchShopDetails = async () => {
    try {
      setLoadingShop(true);
      const data = await apiFetch('/shops/mine');
      setShop(data);
      syncShopContext(data);
      // If approved, fetch stats
      if (data.verificationStatus === 'approved') {
        fetchStats();
      }
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('404')) {
        setShop(null); // Shop doesn't exist
      } else {
        setError('Failed to fetch shop registration details.');
      }
    } finally {
      setLoadingShop(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      
      // Get all parcels for this shop
      const parcels = await apiFetch('/parcels/incoming');
      
      // Calculate statistics
      const received = parcels.filter(p => p.status !== 'Expected').length;
      const pending = parcels.filter(p => p.status === 'Arrived' || p.status === 'Ready for Pickup').length;
      const delivered = parcels.filter(p => p.status === 'Delivered').length;
      const revenue = parcels
        .filter(p => p.status === 'Delivered')
        .reduce((sum, p) => sum + p.fee, 0);

      setStats({ received, pending, delivered, revenue });
    } catch (err) {
      console.error('Error fetching shop statistics', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchShopDetails();
  }, []);

  const handleRegisterChange = (e) => {
    setRegData({
      ...regData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);
    setError('');

    try {
      const data = await apiFetch('/shops', {
        method: 'POST',
        body: JSON.stringify(regData),
      });
      setShop(data);
      syncShopContext(data);
    } catch (err) {
      setError(err.message || 'Failed to register shop. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loadingShop) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading shop profile details...
      </div>
    );
  }

  // CASE 1: No shop registered
  if (!shop) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black mb-6">
          Register Your Shop
        </h1>
        <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider leading-relaxed">
          To begin accepting parcels, you must first register your shop details. Your registration will be reviewed and approved by the system administrator.
        </p>

        <div className="border border-gray-200 p-6 bg-white">
          {error && (
            <div className="border border-red-500 text-red-600 p-3 text-sm mb-4 uppercase tracking-wider font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label htmlFor="shopName" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Shop Name
              </label>
              <input
                type="text"
                id="shopName"
                name="shopName"
                required
                value={regData.shopName}
                onChange={handleRegisterChange}
                className="input-field"
                placeholder="e.g. City Corner General Store"
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
                value={regData.address}
                onChange={handleRegisterChange}
                className="input-field"
                placeholder="e.g. Shop No. 12, Main Bazar Road"
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
                value={regData.city}
                onChange={handleRegisterChange}
                className="input-field"
                placeholder="e.g. Rampur"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={regData.phone}
                onChange={handleRegisterChange}
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
                value={regData.shopPhoto}
                onChange={handleRegisterChange}
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
                  value={regData.latitude}
                  onChange={handleRegisterChange}
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
                  value={regData.longitude}
                  onChange={handleRegisterChange}
                  className="input-field"
                  placeholder="e.g. 77.2090"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registering}
              className="btn-primary w-full disabled:opacity-50"
            >
              {registering ? 'Submitting Registration...' : 'Register Shop'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CASE 2: Shop is registered but NOT approved (Pending or Rejected)
  if (shop.verificationStatus !== 'approved') {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="border border-black p-8 bg-white space-y-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-black">
            Shop Verification: {shop.verificationStatus.toUpperCase()}
          </h1>
          
          {shop.verificationStatus === 'pending' ? (
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              Your shop <strong>"{shop.shopName}"</strong> registration has been successfully received and is currently under review by our administrator team. You will be notified once approval is completed.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-600 font-medium">
                Your shop registration has been rejected by the administrator.
              </p>
              <p className="text-xs text-gray-500">
                You can review or update your shop details in the "Shop Details" tab to resubmit for review.
              </p>
              <Link to="/shopkeeper/profile" className="btn-secondary inline-block">
                Edit Shop Details
              </Link>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-100 flex flex-col items-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Registered Details</span>
            <span className="text-xs text-gray-600 mt-1">{shop.shopName} — {shop.city}</span>
          </div>
        </div>
      </div>
    );
  }

  // CASE 3: Approved Shop Dashboard
  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
            Shopkeeper Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            Verified Store: <strong className="text-black">{shop.shopName}</strong> ({shop.city})
          </p>
        </div>
        <div className="text-xs text-gray-500 border border-gray-200 py-1.5 px-3 uppercase tracking-wider font-semibold">
          Status: Verified Active
        </div>
      </div>

      {/* Stats counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Parcels Received</p>
          <p className="text-3xl font-bold text-black">{stats.received}</p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pending Pickups</p>
          <p className="text-3xl font-bold text-black">{stats.pending}</p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Delivered</p>
          <p className="text-3xl font-bold text-black">{stats.delivered}</p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Revenue Earned</p>
          <p className="text-3xl font-bold text-black">₹{stats.revenue}</p>
        </div>
      </div>

      {/* Quick Access Menu */}
      <div className="flex flex-wrap gap-4 py-2 border-t border-b border-gray-100">
        <Link to="/shopkeeper/incoming" className="btn-primary">
          Manage Incoming Parcels
        </Link>
        <Link to="/shopkeeper/pending" className="btn-secondary">
          Verify Pending Pickups
        </Link>
        <Link to="/shopkeeper/revenue" className="btn-secondary">
          View Revenue Statements
        </Link>
      </div>

      {/* Summary instruction card */}
      <div className="border border-gray-200 p-6 bg-gray-50 text-sm leading-relaxed text-gray-600 font-light max-w-3xl">
        <h3 className="text-xs font-bold uppercase tracking-widest text-black mb-2">Delivery Service Guidelines</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Instruct villagers to use your shop's address and name as shipping destination when ordering online.</li>
          <li>When a parcel arrives, go to <strong>Incoming Parcels</strong> and mark it as <strong>Received</strong>.</li>
          <li>When processing is done, click <strong>Mark Ready</strong> to generate a verification OTP for the customer.</li>
          <li>Upon customer pickup, verify their OTP code in <strong>Pending Pickups</strong> to unlock the parcel, collect the storage fee, and release it.</li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
