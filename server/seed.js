require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shop = require('./models/Shop');
const Parcel = require('./models/Parcel');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for clean reset...');

    // Clear existing data
    await User.deleteMany({});
    await Shop.deleteMany({});
    await Parcel.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing collections.');

    // 1. Create Users
    // Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@grampickup.com',
      phone: '1112223333',
      password: 'admin123',
      role: 'admin',
    });
    console.log('Seeded Admin: admin@grampickup.com / admin123');

    // Seed Customer
    const customer = await User.create({
      name: 'Ramesh Kumar',
      email: 'customer1@grampickup.com',
      phone: '9998887777',
      password: 'customer123',
      role: 'customer',
    });
    console.log('Seeded Customer: customer1@grampickup.com / customer123');

    // Seed Shopkeeper
    const shopkeeper = await User.create({
      name: 'Suresh Patel',
      email: 'shopkeeper1@grampickup.com',
      phone: '8887776666',
      password: 'shopkeeper123',
      role: 'shopkeeper',
    });
    console.log('Seeded Shopkeeper: shopkeeper1@grampickup.com / shopkeeper123');

    // Seed Approved Shop
    const shop = await Shop.create({
      shopName: 'Patel Kirana & General Store',
      ownerId: shopkeeper._id,
      ownerName: shopkeeper.name,
      address: 'Shop No. 5, Main Chowk, Village Rampur',
      city: 'Rampur',
      phone: shopkeeper.phone,
      verificationStatus: 'approved',
      shopPhoto: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80',
      latitude: 28.6139,
      longitude: 77.2090,
    });
    console.log('Seeded Approved Shop: Patel Kirana & General Store');

    console.log('Clean reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during clean reset:', error);
    process.exit(1);
  }
};

seedData();

