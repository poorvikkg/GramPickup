import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-black sm:text-5xl uppercase mb-6">
        Village Parcel Pickup Network
      </h1>
      
      <p className="text-lg text-gray-600 mb-8 font-light leading-relaxed">
        A platform connecting villagers with trusted city shops for parcel collection and storage.
        Eliminate failed deliveries, reduce travel costs, and keep your online purchases secure.
      </p>

      {user ? (
        <div>
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest font-medium">Logged in as {user.name} ({user.role})</p>
          <Link
            to={
              user.role === 'admin'
                ? '/admin/dashboard'
                : user.role === 'shopkeeper'
                ? '/shopkeeper/dashboard'
                : '/customer/dashboard'
            }
            className="btn-primary"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex justify-center space-x-4">
          <Link to="/register" className="btn-primary">
            Register
          </Link>
          <Link to="/login" className="btn-secondary">
            Login
          </Link>
        </div>
      )}

      {/* Structured monochrome list of simple cards outlining the simple workflow */}
      <div className="mt-20 border-t border-gray-200 pt-16 text-left">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-black uppercase mb-2">1. Register</h3>
            <p className="text-sm text-gray-600">Customers choose verified pickup shops in their nearest city. Use that shop's address as your shipping destination when buying online.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black uppercase mb-2">2. Ship & Track</h3>
            <p className="text-sm text-gray-600">Register the parcel tracking details in the dashboard. When the parcel reaches the shop, the shopkeeper updates the status and generates a secure OTP.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-black uppercase mb-2">3. Pickup</h3>
            <p className="text-sm text-gray-600">Visit the shop, present the OTP, clear the calculated storage fee, and receive your parcel securely.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
