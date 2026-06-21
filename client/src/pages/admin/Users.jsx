import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Users = () => {
  const { apiFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/analytics/users?role=${roleFilter}`);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
      setError('Could not load user data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(userId);
    try {
      await apiFetch(`/analytics/users/${userId}`, { method: 'DELETE' });
      alert(`User "${userName}" has been deleted.`);
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Client-side search filter
  const filteredUsers = searchQuery
    ? users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery)
      )
    : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
            User Ledger Management
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            {users.length} total accounts registered
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 py-1.5 px-3 bg-white focus:outline-none focus:border-black"
            >
              <option value="">All Accounts</option>
              <option value="customer">Customers</option>
              <option value="shopkeeper">Shopkeepers</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border border-gray-200 bg-white p-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Search Users</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="input-field py-1.5"
        />
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
          Loading user records...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider bg-white">
          No registered users found.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="table-header">Name</th>
                  <th className="table-header">Email Address</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Registration Date</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="table-cell font-semibold text-black">{u.name}</td>
                    <td className="table-cell font-mono text-xs">{u.email}</td>
                    <td className="table-cell text-xs">{u.phone}</td>
                    <td className="table-cell">
                      <span className={`badge-minimal ${
                        u.role === 'customer' ? 'border-gray-300 text-gray-600' : 'border-black text-black font-semibold'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="table-cell text-xs">{formatDate(u.createdAt)}</td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        disabled={deletingId === u._id}
                        className="btn-danger py-1 px-3 text-xs uppercase"
                      >
                        {deletingId === u._id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-4">
            {filteredUsers.map((u) => (
              <div key={u._id} className="border border-gray-200 p-4 bg-white space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-black text-sm uppercase">{u.name}</h3>
                    <span className={`badge-minimal mt-1 ${
                      u.role === 'customer' ? 'border-gray-300 text-gray-600' : 'border-black text-black font-semibold'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{formatDate(u.createdAt)}</span>
                </div>

                <div className="pt-2.5 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                  <p><strong className="text-gray-400 uppercase text-[9px] font-bold tracking-wider mr-2">Email:</strong><span className="font-mono">{u.email}</span></p>
                  <p><strong className="text-gray-400 uppercase text-[9px] font-bold tracking-wider mr-2">Phone:</strong>{u.phone}</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteUser(u._id, u.name)}
                    disabled={deletingId === u._id}
                    className="btn-danger w-full py-2 text-center text-xs uppercase tracking-wider"
                  >
                    {deletingId === u._id ? 'Deletes...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Users;
