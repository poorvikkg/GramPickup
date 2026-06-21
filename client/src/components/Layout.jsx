import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const notifications = await apiFetch('/notifications');
      const unread = notifications.filter(n => !n.readStatus).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications count:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds for new notifications
    let interval;
    if (user) {
      interval = setInterval(fetchUnreadCount, 30000);
    }
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-black border-b-2 border-black font-semibold' : 'text-gray-500 hover:text-black';
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold uppercase tracking-wider text-black">
                GramPickup
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-wider">
              {/* Public routes */}
              {!user && (
                <>
                  <Link to="/" className={`py-5 ${isActive('/')}`}>Home</Link>
                  <Link to="/about" className={`py-5 ${isActive('/about')}`}>About</Link>
                  <Link to="/contact" className={`py-5 ${isActive('/contact')}`}>Contact</Link>
                </>
              )}

              {/* Customer routes */}
              {user && user.role === 'customer' && (
                <>
                  <Link to="/customer/dashboard" className={`py-5 ${isActive('/customer/dashboard')}`}>Dashboard</Link>
                  <Link to="/customer/parcels" className={`py-5 ${isActive('/customer/parcels')}`}>My Parcels</Link>
                  <Link to="/customer/shops" className={`py-5 ${isActive('/customer/shops')}`}>Verified Shops</Link>
                  <Link to="/customer/add-parcel" className={`py-5 ${isActive('/customer/add-parcel')}`}>Add Parcel</Link>
                  <Link to="/customer/notifications" className={`py-5 ${isActive('/customer/notifications')}`}>
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                  <Link to="/customer/profile" className={`py-5 ${isActive('/customer/profile')}`}>Profile</Link>
                </>
              )}

              {/* Shopkeeper routes */}
              {user && user.role === 'shopkeeper' && (
                <>
                  <Link to="/shopkeeper/dashboard" className={`py-5 ${isActive('/shopkeeper/dashboard')}`}>Dashboard</Link>
                  <Link to="/shopkeeper/incoming" className={`py-5 ${isActive('/shopkeeper/incoming')}`}>Incoming</Link>
                  <Link to="/shopkeeper/pending" className={`py-5 ${isActive('/shopkeeper/pending')}`}>Pending Pickups</Link>
                  <Link to="/shopkeeper/revenue" className={`py-5 ${isActive('/shopkeeper/revenue')}`}>Revenue</Link>
                  <Link to="/shopkeeper/profile" className={`py-5 ${isActive('/shopkeeper/profile')}`}>Shop Details</Link>
                </>
              )}

              {/* Admin routes */}
              {user && user.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard" className={`py-5 ${isActive('/admin/dashboard')}`}>Dashboard</Link>
                  <Link to="/admin/shops" className={`py-5 ${isActive('/admin/shops')}`}>Shops</Link>
                  <Link to="/admin/users" className={`py-5 ${isActive('/admin/users')}`}>Users</Link>
                  <Link to="/admin/parcels" className={`py-5 ${isActive('/admin/parcels')}`}>Parcels</Link>
                  <Link to="/admin/analytics" className={`py-5 ${isActive('/admin/analytics')}`}>Analytics</Link>
                </>
              )}
            </nav>

            {/* Auth panel */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="text-right">
                    <p className="font-semibold text-black">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="border border-black text-black px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white transition-colors duration-150"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-x-3">
                  <Link
                    to="/login"
                    className="text-xs font-semibold uppercase tracking-wider text-black border border-gray-300 px-3 py-1.5 hover:border-black transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs font-semibold uppercase tracking-wider bg-black text-white px-3 py-1.5 hover:bg-gray-800 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu (Horizontal, simple text-based scrollable list of links for simplicity & aesthetics) */}
        <div className="md:hidden border-t border-gray-100 flex overflow-x-auto py-2.5 px-4 space-x-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap scrollbar-none">
          {!user && (
            <>
              <Link to="/" className={location.pathname === '/' ? 'text-black font-bold' : 'text-gray-500'}>Home</Link>
              <Link to="/about" className={location.pathname === '/about' ? 'text-black font-bold' : 'text-gray-500'}>About</Link>
              <Link to="/contact" className={location.pathname === '/contact' ? 'text-black font-bold' : 'text-gray-500'}>Contact</Link>
            </>
          )}
          {user && user.role === 'customer' && (
            <>
              <Link to="/customer/dashboard" className={location.pathname === '/customer/dashboard' ? 'text-black font-bold' : 'text-gray-500'}>Dashboard</Link>
              <Link to="/customer/parcels" className={location.pathname === '/customer/parcels' ? 'text-black font-bold' : 'text-gray-500'}>My Parcels</Link>
              <Link to="/customer/shops" className={location.pathname === '/customer/shops' ? 'text-black font-bold' : 'text-gray-500'}>Verified Shops</Link>
              <Link to="/customer/add-parcel" className={location.pathname === '/customer/add-parcel' ? 'text-black font-bold' : 'text-gray-500'}>Add Parcel</Link>
              <Link to="/customer/notifications" className={location.pathname === '/customer/notifications' ? 'text-black font-bold' : 'text-gray-500'}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Link>
              <Link to="/customer/profile" className={location.pathname === '/customer/profile' ? 'text-black font-bold' : 'text-gray-500'}>Profile</Link>
            </>
          )}
          {user && user.role === 'shopkeeper' && (
            <>
              <Link to="/shopkeeper/dashboard" className={location.pathname === '/shopkeeper/dashboard' ? 'text-black font-bold' : 'text-gray-500'}>Dashboard</Link>
              <Link to="/shopkeeper/incoming" className={location.pathname === '/shopkeeper/incoming' ? 'text-black font-bold' : 'text-gray-500'}>Incoming</Link>
              <Link to="/shopkeeper/pending" className={location.pathname === '/shopkeeper/pending' ? 'text-black font-bold' : 'text-gray-500'}>Pending Pickups</Link>
              <Link to="/shopkeeper/revenue" className={location.pathname === '/shopkeeper/revenue' ? 'text-black font-bold' : 'text-gray-500'}>Revenue</Link>
              <Link to="/shopkeeper/profile" className={location.pathname === '/shopkeeper/profile' ? 'text-black font-bold' : 'text-gray-500'}>Shop Details</Link>
            </>
          )}
          {user && user.role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'text-black font-bold' : 'text-gray-500'}>Dashboard</Link>
              <Link to="/admin/shops" className={location.pathname === '/admin/shops' ? 'text-black font-bold' : 'text-gray-500'}>Shops</Link>
              <Link to="/admin/users" className={location.pathname === '/admin/users' ? 'text-black font-bold' : 'text-gray-500'}>Users</Link>
              <Link to="/admin/parcels" className={location.pathname === '/admin/parcels' ? 'text-black font-bold' : 'text-gray-500'}>Parcels</Link>
              <Link to="/admin/analytics" className={location.pathname === '/admin/analytics' ? 'text-black font-bold' : 'text-gray-500'}>Analytics</Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} GramPickup. Plain, Simple, Functional.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
