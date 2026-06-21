import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout, apiFetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'text-black border-b-2 border-black font-semibold' : 'text-gray-500 hover:text-black';
  };

  const isMobileActive = (path) => {
    return location.pathname === path ? 'text-black font-bold border-l-2 border-black pl-2' : 'text-gray-500 hover:text-black pl-2';
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
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Hamburger icon for mobile screen */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-black focus:outline-none p-2 relative"
                aria-label="Open mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black border border-white"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay & Content */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer container */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col justify-between border-l border-gray-200 z-10 animate-slide-in">
            <div>
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                <span className="text-lg font-bold uppercase tracking-wider text-black">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:border-black flex items-center justify-center font-bold text-black shadow-xs transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* User Profile (if logged in) */}
              {user && (
                <div className="py-4 border-b border-gray-100 mb-4">
                  <p className="text-sm font-bold text-black uppercase">{user.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono font-bold mt-0.5">{user.role}</p>
                </div>
              )}

              {/* Navigation Links list */}
              <nav className="flex flex-col space-y-4 text-sm font-semibold uppercase tracking-wider py-4">
                {/* Public routes */}
                {!user && (
                  <>
                    <Link to="/" className={isMobileActive('/')}>Home</Link>
                    <Link to="/about" className={isMobileActive('/about')}>About</Link>
                    <Link to="/contact" className={isMobileActive('/contact')}>Contact</Link>
                  </>
                )}

                {/* Customer routes */}
                {user && user.role === 'customer' && (
                  <>
                    <Link to="/customer/dashboard" className={isMobileActive('/customer/dashboard')}>Dashboard</Link>
                    <Link to="/customer/parcels" className={isMobileActive('/customer/parcels')}>My Parcels</Link>
                    <Link to="/customer/shops" className={isMobileActive('/customer/shops')}>Verified Shops</Link>
                    <Link to="/customer/add-parcel" className={isMobileActive('/customer/add-parcel')}>Add Parcel</Link>
                    <Link to="/customer/notifications" className={isMobileActive('/customer/notifications')}>
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </Link>
                    <Link to="/customer/profile" className={isMobileActive('/customer/profile')}>Profile</Link>
                  </>
                )}

                {/* Shopkeeper routes */}
                {user && user.role === 'shopkeeper' && (
                  <>
                    <Link to="/shopkeeper/dashboard" className={isMobileActive('/shopkeeper/dashboard')}>Dashboard</Link>
                    <Link to="/shopkeeper/incoming" className={isMobileActive('/shopkeeper/incoming')}>Incoming</Link>
                    <Link to="/shopkeeper/pending" className={isMobileActive('/shopkeeper/pending')}>Pending Pickups</Link>
                    <Link to="/shopkeeper/revenue" className={isMobileActive('/shopkeeper/revenue')}>Revenue</Link>
                    <Link to="/shopkeeper/profile" className={isMobileActive('/shopkeeper/profile')}>Shop Details</Link>
                  </>
                )}

                {/* Admin routes */}
                {user && user.role === 'admin' && (
                  <>
                    <Link to="/admin/dashboard" className={isMobileActive('/admin/dashboard')}>Dashboard</Link>
                    <Link to="/admin/shops" className={isMobileActive('/admin/shops')}>Shops</Link>
                    <Link to="/admin/users" className={isMobileActive('/admin/users')}>Users</Link>
                    <Link to="/admin/parcels" className={isMobileActive('/admin/parcels')}>Parcels</Link>
                    <Link to="/admin/analytics" className={isMobileActive('/admin/analytics')}>Analytics</Link>
                  </>
                )}
              </nav>
            </div>

            {/* Drawer Footer Auth Button */}
            <div className="pt-6 border-t border-gray-100">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full btn-primary py-2.5 text-center text-xs font-semibold"
                >
                  Logout
                </button>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center border border-gray-300 text-black py-2.5 text-xs font-semibold uppercase tracking-wider hover:border-black transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center bg-black text-white py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
