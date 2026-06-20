import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Analytics = () => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiFetch('/analytics/dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics', err);
        setError('Could not load monthly analytics ledger.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading analytics profiles...
      </div>
    );
  }

  const { summary, monthlyParcels = [], monthlyRevenue = [] } = data || {};

  // Find max values to scale percentage bars
  const maxCount = Math.max(...monthlyParcels.map(m => m.count), 1);
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
          Analytics Ledger
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          GramPickup Network System Growth Trends
        </p>
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {/* Aggregate metrics */}
      <div className="border border-gray-200 p-6 bg-white max-w-xl">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Total Aggregate Metrics</h2>
        <div className="grid grid-cols-2 gap-6 text-sm font-light">
          <div>
            <span className="text-gray-500 block">Total Customers Logged:</span>
            <span className="text-lg font-bold text-black">{summary?.totalCustomers}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Verified Shops:</span>
            <span className="text-lg font-bold text-black">{summary?.shopBreakdown?.approved}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Parcels Managed:</span>
            <span className="text-lg font-bold text-black">{summary?.totalParcels}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Network Revenue:</span>
            <span className="text-lg font-bold text-black">₹{summary?.totalRevenue}</span>
          </div>
        </div>
      </div>

      {/* Monthly graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Parcels registered by month */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-gray-200 pb-2">
            Parcels Registered By Month (Last 6 Months)
          </h2>

          <div className="space-y-4">
            {monthlyParcels.map((m, idx) => {
              const percentage = (m.count / maxCount) * 100;
              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600 uppercase font-bold">{m.label}</span>
                    <span className="text-black font-semibold">{m.count} parcel{m.count === 1 ? '' : 's'}</span>
                  </div>
                  {/* Monochrome Bar Chart */}
                  <div className="w-full bg-gray-100 h-6 border border-gray-200">
                    <div
                      className="bg-black h-full border-r border-black"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue earned by month */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-black border-b border-gray-200 pb-2">
            Storage Revenue By Month (Last 6 Months)
          </h2>

          <div className="space-y-4">
            {monthlyRevenue.map((m, idx) => {
              const percentage = (m.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-600 uppercase font-bold">{m.label}</span>
                    <span className="text-black font-semibold">₹{m.revenue}</span>
                  </div>
                  {/* Monochrome Bar Chart */}
                  <div className="w-full bg-gray-100 h-6 border border-gray-200">
                    <div
                      className="bg-gray-500 h-full border-r border-gray-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
