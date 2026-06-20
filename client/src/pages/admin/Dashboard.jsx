import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { apiFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await apiFetch('/analytics/dashboard');
        setData(res);
      } catch (err) {
        console.error('Failed to load admin metrics', err);
        setError('Could not load administrative analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading administrator control panel...
      </div>
    );
  }

  const { summary, monthlyParcels = [], monthlyRevenue = [] } = data || {};

  // Calculate growth indicators
  const currentMonthParcels = monthlyParcels[monthlyParcels.length - 1]?.count || 0;
  const prevMonthParcels = monthlyParcels[monthlyParcels.length - 2]?.count || 0;
  const parcelGrowth = prevMonthParcels > 0
    ? (((currentMonthParcels - prevMonthParcels) / prevMonthParcels) * 100).toFixed(0)
    : currentMonthParcels > 0 ? '+100' : '0';

  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;
  const prevMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0;
  const revenueGrowth = prevMonthRevenue > 0
    ? (((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(0)
    : currentMonthRevenue > 0 ? '+100' : '0';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
          Admin Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
          GramPickup Network Administration Panel
        </p>
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Customers</p>
          <p className="text-3xl font-bold text-black">{summary?.totalCustomers}</p>
          <p className="text-xs text-gray-400 mt-1">{summary?.totalShopkeepers} shopkeepers</p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Registered Shops</p>
          <p className="text-3xl font-bold text-black">
            {summary?.totalShops}
            {summary?.shopBreakdown?.pending > 0 && (
              <span className="text-xs font-normal text-red-600 block mt-1 font-sans">
                ({summary.shopBreakdown.pending} awaiting review)
              </span>
            )}
          </p>
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Parcels Logged</p>
          <p className="text-3xl font-bold text-black">{summary?.totalParcels}</p>
          {parcelGrowth !== '0' && (
            <p className={`text-xs mt-1 font-semibold ${Number(parcelGrowth) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Number(parcelGrowth) > 0 ? '↑' : '↓'} {Math.abs(parcelGrowth)}% this month
            </p>
          )}
        </div>
        <div className="border border-gray-200 p-6 bg-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Network Revenue</p>
          <p className="text-3xl font-bold text-black">₹{summary?.totalRevenue}</p>
          {revenueGrowth !== '0' && (
            <p className={`text-xs mt-1 font-semibold ${Number(revenueGrowth) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Number(revenueGrowth) > 0 ? '↑' : '↓'} {Math.abs(revenueGrowth)}% this month
            </p>
          )}
        </div>
      </div>

      {/* Admin Quick Links */}
      <div className="flex flex-wrap gap-4 py-2 border-t border-b border-gray-100">
        <Link to="/admin/shops" className="btn-primary">
          Verify Shops {summary?.shopBreakdown?.pending > 0 && `(${summary.shopBreakdown.pending})`}
        </Link>
        <Link to="/admin/parcels" className="btn-secondary">
          Monitor All Parcels
        </Link>
        <Link to="/admin/users" className="btn-secondary">
          Manage Users
        </Link>
        <Link to="/admin/analytics" className="btn-secondary">
          View Trends & Charts
        </Link>
      </div>

      {/* Network breakdown table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Parcel Status Aggregation */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Parcel Status Aggregation</h2>
          <div className="border border-gray-200 divide-y divide-gray-100 bg-white">
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600">Expected (In-transit to City)</span>
              <span className="font-semibold text-black">{summary?.statusBreakdown?.Expected}</span>
            </div>
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600">Arrived at Shop (Unprocessed)</span>
              <span className="font-semibold text-black">{summary?.statusBreakdown?.Arrived}</span>
            </div>
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600">Ready for Pickup (Awaiting OTP)</span>
              <span className="font-semibold text-black">{summary?.statusBreakdown?.Ready}</span>
            </div>
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600">Delivered to Customer</span>
              <span className="font-semibold text-black">{summary?.statusBreakdown?.Delivered}</span>
            </div>
          </div>
        </div>

        {/* Shop Review Ledger */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Shop Registrations</h2>
          <div className="border border-gray-200 divide-y divide-gray-100 bg-white">
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600 font-semibold">Approved & Verified</span>
              <span className="font-bold text-black">{summary?.shopBreakdown?.approved}</span>
            </div>
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600">Pending Review</span>
              <span className="font-bold text-red-600">{summary?.shopBreakdown?.pending}</span>
            </div>
            <div className="flex justify-between p-3 text-sm font-light">
              <span className="text-gray-600">Rejected Shops</span>
              <span className="font-bold text-gray-500">{summary?.shopBreakdown?.rejected}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini monthly trend bars */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Monthly Activity Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 bg-white p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Parcels / Month</h3>
            <div className="flex items-end gap-2 h-24">
              {monthlyParcels.map((m, idx) => {
                const maxCount = Math.max(...monthlyParcels.map(mp => mp.count), 1);
                const height = (m.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-black">{m.count}</span>
                    <div
                      className="w-full bg-black transition-all duration-300"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    ></div>
                    <span className="text-[9px] text-gray-400 uppercase">{m.label.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="border border-gray-200 bg-white p-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Revenue / Month</h3>
            <div className="flex items-end gap-2 h-24">
              {monthlyRevenue.map((m, idx) => {
                const maxRev = Math.max(...monthlyRevenue.map(mr => mr.revenue), 1);
                const height = (m.revenue / maxRev) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-black">₹{m.revenue}</span>
                    <div
                      className="w-full bg-gray-500 transition-all duration-300"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    ></div>
                    <span className="text-[9px] text-gray-400 uppercase">{m.label.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
