import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Public pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import MyParcels from './pages/customer/MyParcels';
import AddParcel from './pages/customer/AddParcel';
import CustomerProfile from './pages/customer/Profile';
import CustomerShops from './pages/customer/Shops';

// Shopkeeper pages
import ShopkeeperDashboard from './pages/shopkeeper/Dashboard';
import IncomingParcels from './pages/shopkeeper/IncomingParcels';
import PendingPickups from './pages/shopkeeper/PendingPickups';
import Revenue from './pages/shopkeeper/Revenue';
import ShopkeeperProfile from './pages/shopkeeper/Profile';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminShops from './pages/admin/Shops';
import AdminUsers from './pages/admin/Users';
import AdminParcels from './pages/admin/Parcels';
import AdminAnalytics from './pages/admin/Analytics';

// Shared pages
import Notifications from './pages/Notifications';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-sm font-light text-gray-500 uppercase tracking-widest text-center py-12">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/parcels"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <MyParcels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/shops"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerShops />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/add-parcel"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <AddParcel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/notifications"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />

            {/* Shopkeeper Routes */}
            <Route
              path="/shopkeeper/dashboard"
              element={
                <ProtectedRoute allowedRoles={['shopkeeper']}>
                  <ShopkeeperDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopkeeper/incoming"
              element={
                <ProtectedRoute allowedRoles={['shopkeeper']}>
                  <IncomingParcels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopkeeper/pending"
              element={
                <ProtectedRoute allowedRoles={['shopkeeper']}>
                  <PendingPickups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopkeeper/revenue"
              element={
                <ProtectedRoute allowedRoles={['shopkeeper']}>
                  <Revenue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shopkeeper/profile"
              element={
                <ProtectedRoute allowedRoles={['shopkeeper']}>
                  <ShopkeeperProfile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/shops"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminShops />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/parcels"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminParcels />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
