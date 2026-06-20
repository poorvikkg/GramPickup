import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { apiFetch } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read`, {
        method: 'PUT',
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, readStatus: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', {
        method: 'PUT',
      });
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, readStatus: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Loading notifications...
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
            Notifications
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">
            You have {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Mark All As Read
          </button>
        )}
      </div>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider">
          No notifications found.
        </div>
      ) : (
        <div className="divide-y divide-gray-200 border border-gray-200">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.readStatus && markAsRead(n._id)}
              className={`p-5 transition-colors duration-150 relative bg-white cursor-pointer ${
                !n.readStatus ? 'hover:bg-gray-50 font-medium' : 'opacity-60 hover:bg-gray-50'
              }`}
            >
              {/* Unread circle indicator (simple minimal block) */}
              {!n.readStatus && (
                <div className="absolute top-6 left-2.5 w-1.5 h-1.5 bg-black"></div>
              )}
              
              <div className="pl-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-sm font-semibold text-black uppercase">{n.title}</h3>
                  <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">{formatDate(n.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-light">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
