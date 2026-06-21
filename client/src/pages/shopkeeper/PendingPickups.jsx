import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const PendingPickups = () => {
  const { apiFetch } = useAuth();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpFields, setOtpFields] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchPendingPickups = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/parcels/incoming?status=Ready for Pickup');
      setParcels(data);
    } catch (err) {
      console.error('Failed to load pending pickups', err);
      setError('Could not load pending pickups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPickups();
  }, []);

  const handleOtpDigitChange = (parcelId, index, value) => {
    // Only accept numeric inputs or empty
    if (value && !/^\d$/.test(value)) return;

    const currentDigits = otpFields[parcelId] || ['', '', '', '', '', ''];
    const updatedDigits = [...currentDigits];
    updatedDigits[index] = value;

    setOtpFields(prev => ({
      ...prev,
      [parcelId]: updatedDigits,
    }));

    // Auto-focus next input if value is entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${parcelId}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (parcelId, index, e) => {
    if (e.key === 'Backspace') {
      const currentDigits = otpFields[parcelId] || ['', '', '', '', '', ''];
      
      // If current is empty, focus previous and delete it
      if (!currentDigits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${parcelId}-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const updatedDigits = [...currentDigits];
          updatedDigits[index - 1] = '';
          setOtpFields(prev => ({
            ...prev,
            [parcelId]: updatedDigits,
          }));
        }
      }
    }
  };

  const handleOtpPaste = (parcelId, e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const updatedDigits = pasteData.split('');
    setOtpFields(prev => ({
      ...prev,
      [parcelId]: updatedDigits,
    }));

    // Focus last input
    const lastInput = document.getElementById(`otp-${parcelId}-5`);
    if (lastInput) lastInput.focus();
  };

  const handleVerifyDeliver = async (e, parcelId) => {
    e.preventDefault();
    const digits = otpFields[parcelId] || ['', '', '', '', '', ''];
    const enteredOtp = digits.join('');
    
    if (enteredOtp.length !== 6) {
      alert('Please enter a complete 6-digit OTP code');
      return;
    }

    setVerifyingId(parcelId);
    setError('');

    try {
      await apiFetch(`/parcels/${parcelId}/deliver`, {
        method: 'PUT',
        body: JSON.stringify({ otp: enteredOtp }),
      });
      alert('OTP Verified! Parcel successfully marked as delivered.');
      
      // Clear inputs for this parcel
      setOtpFields(prev => {
        const copy = { ...prev };
        delete copy[parcelId];
        return copy;
      });

      // Refresh list
      fetchPendingPickups();
    } catch (err) {
      alert(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeliverDirect = async (parcelId) => {
    if (!window.confirm("Are you sure you want to mark this parcel as collected directly? This will bypass OTP, lock in the current storage fee, and stop calculations.")) {
      return;
    }
    setVerifyingId(parcelId);
    try {
      await apiFetch(`/parcels/${parcelId}/deliver-direct`, {
        method: 'PUT',
      });
      alert('Parcel marked as delivered/collected successfully! Storage fee locked.');
      
      // Clear inputs for this parcel if any
      setOtpFields(prev => {
        const copy = { ...prev };
        delete copy[parcelId];
        return copy;
      });

      // Refresh list
      fetchPendingPickups();
    } catch (err) {
      alert(err.message || 'Error marking parcel as delivered');
    } finally {
      setVerifyingId(null);
    }
  };

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
        Loading pending pickups ledger...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold uppercase tracking-wider text-black">
        Verify Pending Pickups
      </h1>

      {error && (
        <div className="border border-red-500 text-red-600 p-3 text-sm uppercase tracking-wider font-semibold">
          {error}
        </div>
      )}

      {parcels.length === 0 ? (
        <div className="border border-gray-200 p-12 text-center text-sm font-light text-gray-500 uppercase tracking-wider bg-white">
          No parcels are currently ready for pickup.
        </div>
      ) : (
        <div className="space-y-6">
          {parcels.map((parcel) => (
            <div key={parcel._id} className="border border-gray-200 p-6 bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Info Column */}
              <div>
                <span className="badge-minimal border-yellow-500 text-yellow-800 font-bold mb-2">Ready For Pickup</span>
                <h2 className="text-lg font-bold text-black uppercase mt-1">{parcel.parcelName}</h2>
                <p className="text-xs font-mono text-gray-500">Tracking: {parcel.trackingNumber}</p>
                <p className="text-xs text-gray-500 mt-2">Arrived At Shop: {formatDate(parcel.arrivalDate)}</p>
              </div>

              {/* Customer & Storage Column */}
              <div className="text-sm font-light text-gray-600 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-1">Customer & Fee</h3>
                <p className="font-semibold text-black">{parcel.customerId?.name}</p>
                <p className="text-xs">Phone: {parcel.customerId?.phone}</p>
                <p className="text-xs pt-1 text-black font-medium">Storage Days: {parcel.daysStored} days</p>
                <p className="text-base font-bold text-black pt-1">
                  Collect Fee: ₹{parcel.currentFee || parcel.fee}
                </p>
              </div>

              {/* Verification Column */}
              <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  OTP Secure Handover
                </h3>
                <form onSubmit={(e) => handleVerifyDeliver(e, parcel._id)} className="space-y-3">
                  <div className="flex justify-between items-center gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digits = otpFields[parcel._id] || ['', '', '', '', '', ''];
                      return (
                        <input
                          key={index}
                          id={`otp-${parcel._id}-${index}`}
                          type="text"
                          maxLength="1"
                          required
                          value={digits[index] || ''}
                          onChange={(e) => handleOtpDigitChange(parcel._id, index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(parcel._id, index, e)}
                          onPaste={(e) => handleOtpPaste(parcel._id, e)}
                          className="w-10 h-10 text-center font-mono text-lg font-bold border border-gray-300 bg-white focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-150"
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={verifyingId === parcel._id}
                      className="btn-primary flex-1 py-2 text-xs uppercase tracking-wider font-semibold"
                    >
                      {verifyingId === parcel._id ? 'Verifying...' : 'Verify & Handover'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeliverDirect(parcel._id)}
                      disabled={verifyingId === parcel._id}
                      className="btn-secondary py-2 px-3 text-xs uppercase tracking-wider font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    >
                      Collect Directly
                    </button>
                  </div>
                </form>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingPickups;
