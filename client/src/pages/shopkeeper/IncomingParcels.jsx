import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const IncomingParcels = () => {
  const { apiFetch } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('Expected'); // Default show Expected
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchParcels = async () => {
    try {
      setLoading(true);
      // Fetch incoming parcels with query params
      const endpoint = `/parcels/incoming?status=${statusFilter}&search=${searchQuery}`;
      const data = await apiFetch(endpoint);
      setParcels(data);
    } catch (err) {
      console.error('Failed to load incoming parcels', err);
      setError('Could not load incoming parcels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [statusFilter, searchQuery]);

  const handleMarkReceived = async (id) => {
    setActionLoadingId(id);
    try {
      const updatedParcel = await apiFetch(`/parcels/${id}/received`, {
        method: 'PUT',
      });
      alert(`Status updated to "Arrived"! Automated SMS alert & dashboard notification sent to customer.`);
      // Refresh list
      fetchParcels();
    } catch (err) {
      alert(err.message || 'Error marking parcel as received');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (id) => {
    setActionLoadingId(id);
    try {
      const updatedParcel = await apiFetch(`/parcels/${id}/ready`, {
        method: 'PUT',
      });
      alert(`Status updated to "Ready for Pickup"! OTP secure code generated & sent via SMS to customer.`);
      // Refresh list
      fetchParcels();
    } catch (err) {
      alert(err.message || 'Error marking parcel as ready');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeliverDirect = async (id) => {
    if (!window.confirm("Are you sure you want to mark this parcel as collected? This will lock in the current storage fee and stop calculations.")) {
      return;
    }
    setActionLoadingId(id);
    try {
      await apiFetch(`/parcels/${id}/deliver-direct`, {
        method: 'PUT',
      });
      alert(`Parcel marked as delivered/collected successfully! Storage fee locked.`);
      fetchParcels();
    } catch (err) {
      alert(err.message || 'Error marking parcel as delivered');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
        Manage Incoming Parcels
      </h1>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="border border-gray-200 p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lookup Search box */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Customer Search / Tracking</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking # or customer name..."
            className="input-field py-1.5"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-1.5 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Expected">Expected (Not yet at shop)</option>
            <option value="Arrived">Arrived (Awaiting processing)</option>
            <option value="Ready for Pickup">Ready for Pickup (Awaiting OTP)</option>
            <option value="Delivered">Delivered (Handed over)</option>
          </select>
        </div>

        {/* Clear filters */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
            }}
            className="btn-secondary py-1.5 px-4 w-full text-xs"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
          Loading incoming parcel ledger...
        </div>
      ) : parcels.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider">
          No matching incoming parcels found.
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="table-header">Parcel Name</th>
                <th className="table-header">Tracking Details</th>
                <th className="table-header">Customer Info</th>
                <th className="table-header">Expected Date</th>
                <th className="table-header">Status</th>
                <th className="table-header">Current Fee</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {parcels.map((parcel) => (
                <tr key={parcel._id}>
                  <td className="table-cell font-medium text-black">{parcel.parcelName}</td>
                  <td className="table-cell font-mono text-xs">{parcel.trackingNumber}</td>
                  <td className="table-cell">
                    <div className="text-xs">
                      <p className="font-semibold text-black">{parcel.customerId?.name}</p>
                      <p className="text-gray-500">{parcel.customerId?.phone}</p>
                    </div>
                  </td>
                  <td className="table-cell text-xs">{formatDate(parcel.expectedArrivalDate)}</td>
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
                  <td className="table-cell text-sm font-semibold">
                    {parcel.status === 'Expected' ? '—' : `₹${parcel.currentFee || parcel.fee}`}
                  </td>
                  <td className="table-cell text-right whitespace-nowrap">
                    {parcel.status === 'Expected' && (
                      <button
                        onClick={() => handleMarkReceived(parcel._id)}
                        disabled={actionLoadingId === parcel._id}
                        className="btn-primary py-1 px-3 text-xs"
                      >
                        Mark Received
                      </button>
                    )}
                    {parcel.status === 'Arrived' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleMarkReady(parcel._id)}
                          disabled={actionLoadingId === parcel._id}
                          className="btn-secondary border-black text-black py-1 px-3 text-xs"
                        >
                          Mark Ready
                        </button>
                        <button
                          onClick={() => handleDeliverDirect(parcel._id)}
                          disabled={actionLoadingId === parcel._id}
                          className="btn-primary py-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                        >
                          Deliver Direct
                        </button>
                      </div>
                    )}
                    {parcel.status === 'Ready for Pickup' && (
                      <div className="flex justify-end gap-2 items-center">
                        <span className="text-xs text-yellow-800 font-semibold uppercase tracking-wider">Awaiting OTP</span>
                        <button
                          onClick={() => handleDeliverDirect(parcel._id)}
                          disabled={actionLoadingId === parcel._id}
                          className="btn-primary py-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                        >
                          Deliver Direct
                        </button>
                      </div>
                    )}
                    {parcel.status === 'Delivered' && (
                      <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold font-mono">Delivered</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IncomingParcels;
