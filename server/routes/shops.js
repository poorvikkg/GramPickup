const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @desc    Register a new shop
// @route   POST /api/shops
// @access  Private (Shopkeeper only)
router.post('/', protect, authorize('shopkeeper'), async (req, res) => {
  const { shopName, address, city, phone, shopPhoto, latitude, longitude } = req.body;

  try {
    const existingShop = await Shop.findOne({ ownerId: req.user._id });
    if (existingShop) {
      return res.status(400).json({ message: 'Shop already registered for this user' });
    }

    const shop = await Shop.create({
      shopName,
      ownerId: req.user._id,
      ownerName: req.user.name,
      address,
      city,
      phone,
      shopPhoto,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      verificationStatus: 'pending',
    });

    res.status(201).json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get current shopkeeper's shop
// @route   GET /api/shops/mine
// @access  Private (Shopkeeper only)
router.get('/mine', protect, authorize('shopkeeper'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update shop details
// @route   PUT /api/shops/mine
// @access  Private (Shopkeeper only)
router.put('/mine', protect, authorize('shopkeeper'), async (req, res) => {
  const { shopName, address, city, phone, shopPhoto, latitude, longitude } = req.body;

  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.shopName = shopName || shop.shopName;
    shop.address = address || shop.address;
    shop.city = city || shop.city;
    shop.phone = phone || shop.phone;
    if (shopPhoto !== undefined) {
      shop.shopPhoto = shopPhoto;
    }
    if (latitude !== undefined) {
      shop.latitude = latitude ? Number(latitude) : undefined;
    }
    if (longitude !== undefined) {
      shop.longitude = longitude ? Number(longitude) : undefined;
    }

    // Reset status to pending if vital details are changed? Or keep it approved unless they request change?
    // Let's keep status as is but allow changes, or set to pending. The requirement says:
    // "Update shop details"
    // Let's just update and save. We will keep current status or reset? Let's just keep status.
    
    const updatedShop = await shop.save();
    res.json(updatedShop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all approved shops
// @route   GET /api/shops/approved
// @access  Private (Customers / Shopkeepers / Admin)
router.get('/approved', protect, async (req, res) => {
  try {
    const shops = await Shop.find({ verificationStatus: 'approved' });
    res.json(shops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all shops (Admin only)
// @route   GET /api/shops
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const shops = await Shop.find({}).sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Approve or Reject a shop
// @route   PUT /api/shops/:id/status
// @access  Private (Admin only)
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
  }

  try {
    const shop = await Shop.findById(req.id || req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    shop.verificationStatus = status;
    await shop.save();

    // Notify the shop owner
    await Notification.create({
      userId: shop.ownerId,
      title: `Shop Verification: ${status.toUpperCase()}`,
      message: `Your shop "${shop.shopName}" registration request has been ${status} by the administrator.`,
    });

    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Submit rating for a shop
// @route   POST /api/shops/:id/rate
// @access  Private (Customer only)
router.post('/:id/rate', protect, authorize('customer'), async (req, res) => {
  const { rating, feedback } = req.body;
  const shopId = req.id || req.params.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5' });
  }

  try {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Check if customer already rated this shop
    const existingRatingIndex = shop.ratings.findIndex(
      (r) => r.customerId.toString() === req.user._id.toString()
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      shop.ratings[existingRatingIndex].rating = Number(rating);
      shop.ratings[existingRatingIndex].feedback = feedback || '';
      shop.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      shop.ratings.push({
        customerId: req.user._id,
        customerName: req.user.name,
        rating: Number(rating),
        feedback: feedback || '',
      });
    }

    // Recalculate average rating
    const totalRating = shop.ratings.reduce((sum, r) => sum + r.rating, 0);
    shop.averageRating = Number((totalRating / shop.ratings.length).toFixed(1));

    await shop.save();
    res.json(shop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single shop details
// @route   GET /api/shops/:id
// @access  Private (Authenticated users)
router.get('/:id', protect, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
