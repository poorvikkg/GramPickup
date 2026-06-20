import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Contact = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Contact Info */}
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-wider text-black mb-6">Contact Us</h1>
        <p className="text-sm text-gray-600 mb-8 font-light leading-relaxed">
          Have questions about the network, or want to register a shop outside of our standard cities? Send us a message and our support team will get in touch with you.
        </p>

        <div className="space-y-4 text-sm font-light text-gray-600">
          <div>
            <h3 className="font-semibold text-black uppercase text-xs tracking-wider">Office Address</h3>
            <p>Mangalore, Karnataka</p>
          </div>
          <div>
            <h3 className="font-semibold text-black uppercase text-xs tracking-wider">Email Address</h3>
            <p>poorvik935@gmail.com</p>
          </div>
          <div>
            <h3 className="font-semibold text-black uppercase text-xs tracking-wider">Phone Support</h3>
            <p>+91 8867070511</p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="border border-gray-200 p-6 bg-white">
        <h2 className="text-lg font-bold uppercase tracking-wider text-black mb-6">Send Message</h2>
        
        {submitted ? (
          <div className="border border-black p-4 text-sm text-black">
            Thank you for your message. We will get back to you shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email address"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="4"
                required
                value={formData.message}
                onChange={handleChange}
                className="input-field"
                placeholder="Describe your query..."
              ></textarea>
            </div>
            <button type="submit" className="btn-primary w-full">
              Submit Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;
