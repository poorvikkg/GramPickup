const Parcel = require('../models/Parcel');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');

const getFeeDetails = (parcel) => {
  if (!parcel.arrivalDate || parcel.status === 'Expected') {
    return { daysStored: 0, fee: 0 };
  }
  const start = new Date(parcel.arrivalDate);
  const end = parcel.pickupDate ? new Date(parcel.pickupDate) : new Date();
  
  const diffTime = end.getTime() - start.getTime();
  const daysStored = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const fee = 10 + daysStored * 2;
  return { daysStored, fee };
};

const updateFees = async () => {
  try {
    // Find all parcels currently stored in the shop (either 'Arrived' or 'Ready for Pickup')
    const activeParcels = await Parcel.find({
      status: { $in: ['Arrived', 'Ready for Pickup'] }
    }).populate('shopId');

    console.log(`[FeeScheduler] Checking fee updates for ${activeParcels.length} active parcels...`);

    for (const parcel of activeParcels) {
      const { daysStored, fee: newFee } = getFeeDetails(parcel);
      
      // If the calculated fee has increased from the stored fee
      if (newFee > parcel.fee) {
        const oldFee = parcel.fee;
        parcel.fee = newFee;
        await parcel.save();

        const shopName = parcel.shopId ? parcel.shopId.shopName : 'the pickup store';

        // Notify user about fee increase
        await Notification.create({
          userId: parcel.customerId,
          title: `Storage Fee Update: ₹${newFee}`,
          message: `Your parcel "${parcel.parcelName}" (Tracking: ${parcel.trackingNumber}) has been stored for ${daysStored} days at "${shopName}". The storage fee has updated from ₹${oldFee} to ₹${newFee}. Please pick it up soon.`,
        });

        console.log(`[FeeScheduler] Updated parcel ${parcel.trackingNumber} fee: ₹${oldFee} -> ₹${newFee}`);
      }
    }
  } catch (error) {
    console.error('[FeeScheduler] Error updating fees:', error);
  }
};

const startFeeScheduler = () => {
  // Run immediately on start
  updateFees();
  
  // Set interval to run every 1 hour (3600000 ms)
  const intervalMs = 60 * 60 * 1000;
  setInterval(updateFees, intervalMs);
  console.log('[FeeScheduler] Background storage fee scheduler initialized (Interval: 1 hour).');
};

module.exports = {
  startFeeScheduler,
  updateFees
};
