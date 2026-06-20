import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      
      // Redirect based on role
      if (data.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (data.role === 'shopkeeper') {
        navigate('/shopkeeper/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickAccess = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await login('admin@grampickup.com', 'admin123');
      if (data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Login successful, but user is not an admin.');
      }
    } catch (err) {
      setError(err.message || 'Failed to auto-login as Admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="border border-gray-200 p-8 bg-white">
        <h1 className="text-2xl font-bold uppercase tracking-wider text-black mb-6 text-center">
          Sign In
        </h1>

        {error && (
          <div className="border border-red-500 text-red-600 p-3 text-sm mb-4 uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-white px-2 text-gray-500">Quick Access</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdminQuickAccess}
          disabled={loading}
          className="btn-secondary w-full disabled:opacity-50 font-medium"
        >
          {loading ? 'Processing...' : 'Access Admin Page'}
        </button>

        <div className="mt-6 text-center text-xs text-gray-500 uppercase tracking-wider">
          Don't have an account?{' '}
          <Link to="/register" className="text-black font-semibold underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
