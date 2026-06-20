const express = require('express');
const router = express.Router();
const Parcel = require('../models/Parcel');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Utility to calculate storage days and fee
const getFeeDetails = (parcel) => {
  if (!parcel.arrivalDate || parcel.status === 'Expected') {
    return { daysStored: 0, fee: 0 };
  }
  const start = new Date(parcel.arrivalDate);
  const end = parcel.pickupDate ? new Date(parcel.pickupDate) : new Date();
  
  // Calculate difference in days
  const diffTime = end.getTime() - start.getTime();
  const daysStored = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const fee = 10 + daysStored * 2;
  return { daysStored, fee };
};

// @desc    Register expected parcel
// @route   POST /api/parcels
// @access  Private (Customer only)
router.post('/', protect, authorize('customer'), async (req, res) => {
  const { parcelName, trackingNumber, shopId, expectedArrivalDate } = req.body;

  try {
    const trackingExists = await Parcel.findOne({ trackingNumber });
    if (trackingExists) {
      return res.status(400).json({ message: 'A parcel with this tracking number is already registered' });
    }

    const shop = await Shop.findById(shopId);
    if (!shop || shop.verificationStatus !== 'approved') {
      return res.status(400).json({ message: 'Selected pickup shop is not available or not verified' });
    }

    const parcel = await Parcel.create({
      customerId: req.user._id,
      shopId,
      parcelName,
      trackingNumber,
      expectedArrivalDate,
      status: 'Expected',
      fee: 0,
    });

    res.status(201).json(parcel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get customer's parcels
// @route   GET /api/parcels/my-parcels
// @access  Private (Customer only)
router.get('/my-parcels', protect, authorize('customer'), async (req, res) => {
  try {
    const parcels = await Parcel.find({ customerId: req.user._id })
      .populate('shopId', 'shopName address city phone')
      .sort({ createdAt: -1 });

    const parcelsWithFees = parcels.map(parcel => {
      const details = getFeeDetails(parcel);
      return {
        ...parcel.toObject(),
        daysStored: details.daysStored,
        currentFee: details.fee,
      };
    });

    res.json(parcelsWithFees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get incoming parcels for shopkeeper
// @route   GET /api/parcels/incoming
// @access  Private (Shopkeeper only)
router.get('/incoming', protect, authorize('shopkeeper'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'No shop registered for this shopkeeper' });
    }

    // Get filter options from query params
    const { status, search } = req.query;
    
    let query = { shopId: shop._id };
    
    if (status) {
      query.status = status;
    }

    const parcels = await Parcel.find(query)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    let filteredParcels = parcels.map(parcel => {
      const details = getFeeDetails(parcel);
      return {
        ...parcel.toObject(),
        daysStored: details.daysStored,
        currentFee: details.fee,
      };
    });

    // Apply search filters manually or via regex in query if name is needed
    // In our case, customer details are populated, so search by trackingNumber or customerName
    if (search) {
      const searchLower = search.toLowerCase();
      filteredParcels = filteredParcels.filter(parcel => {
        const trackingMatch = parcel.trackingNumber.toLowerCase().includes(searchLower);
        const nameMatch = parcel.customerId && parcel.customerId.name.toLowerCase().includes(searchLower);
        return trackingMatch || nameMatch;
      });
    }

    res.json(filteredParcels);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark parcel as received
// @route   PUT /api/parcels/:id/received
// @access  Private (Shopkeeper only)
router.put('/:id/received', protect, authorize('shopkeeper'), async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.id || req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Verify shop ownership
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || parcel.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this parcel' });
    }

    if (parcel.status !== 'Expected') {
      return res.status(400).json({ message: 'Parcel status must be Expected to mark as received' });
    }

    parcel.status = 'Arrived';
    parcel.arrivalDate = new Date();
    // Default initial fee calculated immediately (which is 10)
    const details = getFeeDetails(parcel);
    parcel.fee = details.fee;

    await parcel.save();

    // Notify customer
    await Notification.create({
      userId: parcel.customerId,
      title: 'Parcel Arrived',
      message: `Your parcel "${parcel.parcelName}" (Tracking: ${parcel.trackingNumber}) has arrived at "${shop.shopName}".`,
    });

    res.json(parcel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark parcel as ready for pickup (generates OTP)
// @route   PUT /api/parcels/:id/ready
// @access  Private (Shopkeeper only)
router.put('/:id/ready', protect, authorize('shopkeeper'), async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.id || req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Verify shop ownership
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || parcel.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this parcel' });
    }

    if (parcel.status !== 'Arrived') {
      return res.status(400).json({ message: 'Parcel status must be Arrived to mark as ready' });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    parcel.status = 'Ready for Pickup';
    parcel.otp = generatedOtp;
    
    // Update current fee
    const details = getFeeDetails(parcel);
    parcel.fee = details.fee;

    await parcel.save();

    // Notify customer
    await Notification.create({
      userId: parcel.customerId,
      title: 'Parcel Ready for Pickup',
      message: `Your parcel "${parcel.parcelName}" (Tracking: ${parcel.trackingNumber}) is ready for pickup at "${shop.shopName}". Use OTP: ${generatedOtp} to claim. Fee: ₹${details.fee}.`,
    });

    res.json(parcel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark parcel as delivered (verifies OTP and completes transaction)
// @route   PUT /api/parcels/:id/deliver
// @access  Private (Shopkeeper only)
router.put('/:id/deliver', protect, authorize('shopkeeper'), async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'OTP is required to deliver the parcel' });
  }

  try {
    const parcel = await Parcel.findById(req.id || req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    // Verify shop ownership
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop || parcel.shopId.toString() !== shop._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this parcel' });
    }

    if (parcel.status !== 'Ready for Pickup') {
      return res.status(400).json({ message: 'Parcel must be Ready for Pickup to deliver' });
    }

    if (parcel.otp !== otp.toString()) {
      return res.status(400).json({ message: 'Invalid OTP code. Access denied.' });
    }

    parcel.status = 'Delivered';
    parcel.pickupDate = new Date();
    
    // Lock in final fee
    const details = getFeeDetails(parcel);
    parcel.fee = details.fee;
    
    await parcel.save();

    // Notify customer
    await Notification.create({
      userId: parcel.customerId,
      title: 'Parcel Delivered',
      message: `Your parcel "${parcel.parcelName}" (Tracking: ${parcel.trackingNumber}) was successfully picked up from "${shop.shopName}". Collected fee: ₹${details.fee}.`,
    });

    res.json(parcel);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get revenue stats for current shopkeeper
// @route   GET /api/parcels/revenue
// @access  Private (Shopkeeper only)
router.get('/revenue', protect, authorize('shopkeeper'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Find all delivered parcels for this shop
    const deliveredParcels = await Parcel.find({
      shopId: shop._id,
      status: 'Delivered',
    }).populate('customerId', 'name email phone').sort({ pickupDate: -1 });

    const totalRevenue = deliveredParcels.reduce((sum, parcel) => sum + parcel.fee, 0);

    res.json({
      parcels: deliveredParcels,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all parcels (Admin only)
// @route   GET /api/parcels
// @access  Private (Admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  const { status, search } = req.query;

  let query = {};
  if (status) {
    query.status = status;
  }
  if (search) {
    query.trackingNumber = { $regex: search, $options: 'i' };
  }

  try {
    const parcels = await Parcel.find(query)
      .populate('customerId', 'name email phone')
      .populate('shopId', 'shopName address city ownerName')
      .sort({ createdAt: -1 });

    const parcelsWithFees = parcels.map(parcel => {
      const details = getFeeDetails(parcel);
      return {
        ...parcel.toObject(),
        daysStored: details.daysStored,
        currentFee: details.fee,
      };
    });

    res.json(parcelsWithFees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
