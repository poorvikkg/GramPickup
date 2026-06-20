const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const Parcel = require('../models/Parcel');
const { protect, authorize } = require('../middleware/auth');

// Helper to get month names
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// @desc    Get dashboard metrics and monthly analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin only)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    // 1. Core counters
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalShopkeepers = await User.countDocuments({ role: 'shopkeeper' });
    const totalShops = await Shop.countDocuments({});
    const totalParcels = await Parcel.countDocuments({});
    
    // Revenue from delivered parcels
    const deliveredParcels = await Parcel.find({ status: 'Delivered' });
    const totalRevenue = deliveredParcels.reduce((sum, p) => sum + p.fee, 0);

    // Status breakdowns
    const expectedCount = await Parcel.countDocuments({ status: 'Expected' });
    const arrivedCount = await Parcel.countDocuments({ status: 'Arrived' });
    const readyCount = await Parcel.countDocuments({ status: 'Ready for Pickup' });
    const deliveredCount = await Parcel.countDocuments({ status: 'Delivered' });

    // Shop approval breakdowns
    const approvedShopsCount = await Shop.countDocuments({ verificationStatus: 'approved' });
    const pendingShopsCount = await Shop.countDocuments({ verificationStatus: 'pending' });
    const rejectedShopsCount = await Shop.countDocuments({ verificationStatus: 'rejected' });

    // 2. Aggregate monthly parcel registration counts (last 6 months)
    const parcelCountsByMonth = await Parcel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    // 3. Aggregate monthly revenue (last 6 months)
    const revenueByMonth = await Parcel.aggregate([
      { $match: { status: 'Delivered', pickupDate: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: "$pickupDate" },
            month: { $month: "$pickupDate" }
          },
          revenue: { $sum: "$fee" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    // Format monthly data to be client-friendly, filling in the current/past 6 months
    const analyticsParcels = [];
    const analyticsRevenue = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1; // 1-indexed for MongoDB comparison
      const label = `${MONTHS[d.getMonth()]} ${year}`;

      // Find matching item in aggregation results
      const parcelMatch = parcelCountsByMonth.find(
        item => item._id.year === year && item._id.month === monthNum
      );
      analyticsParcels.push({
        label,
        count: parcelMatch ? parcelMatch.count : 0
      });

      const revenueMatch = revenueByMonth.find(
        item => item._id.year === year && item._id.month === monthNum
      );
      analyticsRevenue.push({
        label,
        revenue: revenueMatch ? revenueMatch.revenue : 0
      });
    }

    res.json({
      summary: {
        totalCustomers,
        totalShopkeepers,
        totalShops,
        totalParcels,
        totalRevenue,
        statusBreakdown: {
          Expected: expectedCount,
          Arrived: arrivedCount,
          Ready: readyCount,
          Delivered: deliveredCount
        },
        shopBreakdown: {
          approved: approvedShopsCount,
          pending: pendingShopsCount,
          rejected: rejectedShopsCount
        }
      },
      monthlyParcels: analyticsParcels,
      monthlyRevenue: analyticsRevenue
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user list for admin management
// @route   GET /api/analytics/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  const { role } = req.query;

  let query = {};
  if (role && ['customer', 'shopkeeper'].includes(role)) {
    query.role = role;
  } else {
    query.role = { $in: ['customer', 'shopkeeper'] };
  }

  try {
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a user (Admin only)
// @route   DELETE /api/analytics/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Cascade: remove associated shop if shopkeeper
    if (user.role === 'shopkeeper') {
      const shop = await Shop.findOne({ ownerId: user._id });
      if (shop) {
        // Remove all parcels associated with this shop
        await Parcel.deleteMany({ shopId: shop._id });
        await shop.deleteOne();
      }
    }

    // Remove parcels created by this customer
    if (user.role === 'customer') {
      await Parcel.deleteMany({ customerId: user._id });
    }

    // Remove notifications for this user
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ userId: user._id });

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
