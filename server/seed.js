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

    console.log('Clean reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during clean reset:', error);
    process.exit(1);
  }
};

seedData();

