import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Parcels = () => {
  const { apiFetch } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchParcels = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/parcels?status=${statusFilter}&search=${searchQuery}`);
      setParcels(data);
    } catch (err) {
      console.error('Failed to load parcels', err);
      setError('Could not load parcel data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, [statusFilter, searchQuery]);

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
        Parcel Monitoring System
      </h1>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {/* Filter and Search Box */}
      <div className="border border-gray-200 p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Search Tracking Number</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracking #..."
            className="input-field py-1.5"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field py-1.5 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Expected">Expected</option>
            <option value="Arrived">Arrived</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

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
          Loading parcel monitoring ledger...
        </div>
      ) : parcels.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider bg-white">
          No matching parcels logged.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Parcel Name & Tracking</th>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Pickup Shop</th>
                  <th className="table-header">Dates</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Fee (Storage Days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {parcels.map((parcel) => (
                  <tr key={parcel._id}>
                    <td className="table-cell">
                      <div className="text-sm">
                        <p className="font-semibold text-black">{parcel.parcelName}</p>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{parcel.trackingNumber}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-xs">
                        <p className="font-semibold text-black">{parcel.customerId?.name}</p>
                        <p className="text-gray-500">{parcel.customerId?.phone}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="text-xs">
                        <p className="font-semibold text-black">{parcel.shopId?.shopName}</p>
                        <p className="text-gray-500">{parcel.shopId?.city}</p>
                      </div>
                    </td>
                    <td className="table-cell text-xs">
                      <p>Expected: {formatDate(parcel.expectedArrivalDate)}</p>
                      {parcel.arrivalDate && <p>Arrived: {formatDate(parcel.arrivalDate)}</p>}
                      {parcel.pickupDate && <p className="font-medium text-black">Picked Up: {formatDate(parcel.pickupDate)}</p>}
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
                    <td className="table-cell text-right font-bold text-black whitespace-nowrap">
                      {parcel.status === 'Expected' ? '—' : `₹${parcel.currentFee || parcel.fee}`}
                      {parcel.arrivalDate && (
                        <span className="text-[10px] text-gray-400 block font-normal tracking-wide mt-0.5">
                          ({parcel.daysStored} days stored)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-4">
            {parcels.map((parcel) => (
              <div key={parcel._id} className="border border-gray-200 p-4 bg-white space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-black text-sm uppercase">{parcel.parcelName}</h3>
                    <p className="text-xs font-mono text-gray-500 mt-0.5">{parcel.trackingNumber}</p>
                  </div>
                  <span className={`badge-minimal flex-shrink-0 ${
                    parcel.status === 'Expected' ? 'border-gray-300 text-gray-600' :
                    parcel.status === 'Arrived' ? 'border-blue-300 text-blue-800' :
                    parcel.status === 'Ready for Pickup' ? 'border-yellow-500 text-yellow-800 font-bold' :
                    'border-black text-black bg-gray-50'
                  }`}>
                    {parcel.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-100 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Customer</span>
                    <span className="text-black font-semibold block leading-tight">{parcel.customerId?.name}</span>
                    <span className="text-gray-500 block mt-0.5">{parcel.customerId?.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Pickup Shop</span>
                    <span className="text-black font-semibold block leading-tight">{parcel.shopId?.shopName}</span>
                    <span className="text-gray-500 block mt-0.5">{parcel.shopId?.city}</span>
                  </div>
                  <div className="col-span-2 pt-1">
                    <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-1">Timeline & Dates</span>
                    <div className="space-y-0.5 font-light">
                      <p>Expected: {formatDate(parcel.expectedArrivalDate)}</p>
                      {parcel.arrivalDate && <p>Arrived: {formatDate(parcel.arrivalDate)}</p>}
                      {parcel.pickupDate && <p className="font-medium text-black">Picked Up: {formatDate(parcel.pickupDate)}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Storage Days</span>
                    <span className="text-black font-semibold">{parcel.arrivalDate ? `${parcel.daysStored} days` : '—'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Fee</span>
                    <span className="text-black font-bold text-sm">
                      {parcel.status === 'Expected' ? '—' : `₹${parcel.currentFee || parcel.fee}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Parcels;
