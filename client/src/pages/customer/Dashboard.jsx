import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { apiFetch } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const data = await apiFetch('/parcels/my-parcels');
        setParcels(data);
      } catch (err) {
        console.error('Failed to load parcels', err);
        setError('Could not load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchParcels();
  }, []);

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading customer dashboard...
      </div>
    );
  }

  // Calculate stats
  const total = parcels.length;
  const pending = parcels.filter(p => p.status !== 'Delivered').length;
  const delivered = parcels.filter(p => p.status === 'Delivered').length;

  const latestParcels = parcels.slice(0, 3);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
        Customer Dashboard
      </h1>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {/* Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Parcels</p>
          <p className="text-3xl font-bold text-black">{total}</p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pending Pickups</p>
          <p className="text-3xl font-bold text-black">{pending}</p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Delivered Parcels</p>
          <p className="text-3xl font-bold text-black">{delivered}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 py-2 border-t border-b border-gray-100">
        <Link to="/customer/add-parcel" className="btn-primary">
          Register New Parcel
        </Link>
        <Link to="/customer/parcels" className="btn-secondary">
          View All Parcels
        </Link>
        <Link to="/customer/notifications" className="btn-secondary">
          View Notifications
        </Link>
      </div>

      {/* Recent Parcels */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Recent Parcels</h2>
        
        {latestParcels.length === 0 ? (
          <div className="border border-gray-200 p-8 text-center text-sm font-light text-gray-500">
            No parcels registered yet. Start by shipping a parcel to a city shop and register it.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Parcel Name</th>
                  <th className="table-header">Tracking Number</th>
                  <th className="table-header">Pickup Shop</th>
                  <th className="table-header">Status</th>
                  <th className="table-header font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {latestParcels.map((parcel) => (
                  <tr key={parcel._id}>
                    <td className="table-cell font-medium text-black">{parcel.parcelName}</td>
                    <td className="table-cell font-mono text-xs">{parcel.trackingNumber}</td>
                    <td className="table-cell text-xs">
                      {parcel.shopId ? parcel.shopId.shopName : 'N/A'} ({parcel.shopId ? parcel.shopId.city : ''})
                    </td>
                    <td className="table-cell">
                      <span className={`badge-minimal ${
                        parcel.status === 'Expected' ? 'border-gray-300 text-gray-600' :
                        parcel.status === 'Arrived' ? 'border-blue-300 text-blue-800' :
                        parcel.status === 'Ready for Pickup' ? 'border-yellow-500 text-yellow-800 font-bold' :
                        'border-black text-black bg-gray-50'
                      }`}>
                        {parcel.status}
                      </span>
                    </td>
                    <td className="table-cell font-semibold">
                      {parcel.status === 'Expected' ? '—' : `₹${parcel.currentFee || parcel.fee}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
