import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Revenue = () => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState({ parcels: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await apiFetch('/parcels/revenue');
        setData(res);
      } catch (err) {
        console.error('Failed to load revenue statements', err);
        setError('Could not load revenue statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading revenue ledger...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
          Revenue Statements
        </h1>
        <div className="border border-black p-4 bg-white text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Total Revenue Earned</p>
          <p className="text-2xl font-bold text-black">₹{data.totalRevenue}</p>
        </div>
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Delivered Parcels & Fees Collected</h2>

        {data.parcels.length === 0 ? (
          <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider bg-white animate-pulse">
            No revenue records found yet. Hand over parcels to begin earning.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="table-header">Parcel Name</th>
                    <th className="table-header">Tracking #</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Arrival Date</th>
                    <th className="table-header">Pickup Date</th>
                    <th className="table-header font-semibold text-right">Fee Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.parcels.map((parcel) => {
                    // Calculate storage days
                    const arrival = new Date(parcel.arrivalDate);
                    const pickup = new Date(parcel.pickupDate);
                    const diffTime = pickup.getTime() - arrival.getTime();
                    const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

                    return (
                      <tr key={parcel._id}>
                        <td className="table-cell font-medium text-black">{parcel.parcelName}</td>
                        <td className="table-cell font-mono text-xs text-gray-500">{parcel.trackingNumber}</td>
                        <td className="table-cell">
                          <div className="text-xs">
                            <p className="font-semibold text-black">{parcel.customerId?.name}</p>
                            <p className="text-gray-500">{parcel.customerId?.phone}</p>
                          </div>
                        </td>
                        <td className="table-cell text-xs text-gray-600">{formatDate(parcel.arrivalDate)}</td>
                        <td className="table-cell text-xs text-gray-600 font-medium">{formatDate(parcel.pickupDate)}</td>
                        <td className="table-cell text-right font-bold text-black">
                          ₹{parcel.fee}
                          <span className="text-[10px] text-gray-400 block font-normal tracking-wide">
                            ({days} days storage)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-4">
              {data.parcels.map((parcel) => {
                // Calculate storage days
                const arrival = new Date(parcel.arrivalDate);
                const pickup = new Date(parcel.pickupDate);
                const diffTime = pickup.getTime() - arrival.getTime();
                const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

                return (
                  <div key={parcel._id} className="border border-gray-200 p-4 bg-white space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-black text-sm uppercase">{parcel.parcelName}</h3>
                        <p className="text-xs font-mono text-gray-500 mt-0.5">{parcel.trackingNumber}</p>
                      </div>
                      <span className="text-sm font-bold text-black">
                        ₹{parcel.fee}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Customer</span>
                        <span className="text-black font-semibold block leading-tight">{parcel.customerId?.name}</span>
                        <span className="text-gray-500 block mt-0.5">{parcel.customerId?.phone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Storage Days</span>
                        <span className="text-black font-semibold block">{days} day{days === 1 ? '' : 's'}</span>
                      </div>
                      <div className="col-span-2 flex justify-between pt-1 text-[11px]">
                        <div>
                          <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Arrival Date</span>
                          <span className="text-gray-700 block">{formatDate(parcel.arrivalDate)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 uppercase block text-[9px] font-bold tracking-wider mb-0.5">Pickup Date</span>
                          <span className="text-gray-700 block font-semibold">{formatDate(parcel.pickupDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Revenue;
