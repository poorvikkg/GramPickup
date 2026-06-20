const BASE = 'http://127.0.0.1:5000/api';

async function api(endpoint, options = {}) {
  const { headers, ...rest } = options;
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...rest,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${data.message}`);
  return data;
}

async function run() {
  console.log('=== GramPickup E2E API Test ===\n');

  // 1. Customer login
  const customer = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer1@grampickup.com', password: 'customer123' }),
  });
  console.log('1. Customer login OK:', customer.name, customer.role);
  const custAuth = { Authorization: `Bearer ${customer.token}` };

  const shops = await api('/shops/approved', { headers: custAuth });
  console.log('2. Approved shops:', shops.length, '- First:', shops[0]?.shopName);
  console.log('Shops[0] details:', shops[0]);

  // 3. Register a new parcel
  const newParcel = await api('/parcels', {
    method: 'POST',
    headers: custAuth,
    body: JSON.stringify({
      parcelName: 'Test Gardening Kit',
      trackingNumber: 'TRKTEST001',
      shopId: shops[0]._id,
      expectedArrivalDate: '2026-06-25',
    }),
  });
  console.log('3. Parcel registered:', newParcel.parcelName, 'Status:', newParcel.status);

  // 4. Customer views parcels
  const myParcels = await api('/parcels/my-parcels', { headers: custAuth });
  console.log('4. Customer parcels count:', myParcels.length);

  // 5. Shopkeeper login
  const shopkeeper = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'shopkeeper1@grampickup.com', password: 'shopkeeper123' }),
  });
  console.log('5. Shopkeeper login OK:', shopkeeper.name, shopkeeper.role);
  const skAuth = { Authorization: `Bearer ${shopkeeper.token}` };

  // 6. Shopkeeper views incoming parcels
  const incoming = await api('/parcels/incoming', { headers: skAuth });
  console.log('6. Incoming parcels count:', incoming.length);

  // 7. Mark parcel as received (arrived)
  const received = await api(`/parcels/${newParcel._id}/received`, {
    method: 'PUT',
    headers: skAuth,
  });
  console.log('7. Parcel marked received. Status:', received.status, 'Fee:', received.fee);

  // 8. Mark parcel as ready for pickup (generates OTP)
  const ready = await api(`/parcels/${newParcel._id}/ready`, {
    method: 'PUT',
    headers: skAuth,
  });
  console.log('8. Parcel marked ready. Status:', ready.status, 'OTP:', ready.otp, 'Fee:', ready.fee);

  // 9. Customer checks notifications
  const notifications = await api('/notifications', { headers: custAuth });
  const unread = notifications.filter(n => !n.readStatus).length;
  console.log('9. Customer notifications:', notifications.length, 'Unread:', unread);

  // 10. Shopkeeper verifies OTP and delivers
  const delivered = await api(`/parcels/${newParcel._id}/deliver`, {
    method: 'PUT',
    headers: skAuth,
    body: JSON.stringify({ otp: ready.otp }),
  });
  console.log('10. OTP verified, delivered! Status:', delivered.status, 'Final Fee:', delivered.fee);

  // 11. Check revenue
  const revenue = await api('/parcels/revenue', { headers: skAuth });
  console.log('11. Shopkeeper revenue: Rs', revenue.totalRevenue, 'from', revenue.parcels.length, 'deliveries');

  // 12. Admin login
  const admin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@grampickup.com', password: 'admin123' }),
  });
  console.log('12. Admin login OK:', admin.name, admin.role);
  const adminAuth = { Authorization: `Bearer ${admin.token}` };

  // 13. Admin dashboard analytics
  const analytics = await api('/analytics/dashboard', { headers: adminAuth });
  console.log('13. Admin analytics:', JSON.stringify(analytics.summary, null, 2));

  // 14. Admin approves pending shop
  const allShops = await api('/shops', { headers: adminAuth });
  const pendingShop = allShops.find(s => s.verificationStatus === 'pending');
  if (pendingShop) {
    const approved = await api(`/shops/${pendingShop._id}/status`, {
      method: 'PUT',
      headers: adminAuth,
      body: JSON.stringify({ status: 'approved' }),
    });
    console.log('14. Approved shop:', approved.shopName, 'Status:', approved.verificationStatus);
  } else {
    console.log('14. No pending shops to approve.');
  }

  // 15. Admin views users
  const users = await api('/analytics/users', { headers: adminAuth });
  console.log('15. Total users (non-admin):', users.length);

  // 16. Admin views all parcels
  const allParcels = await api('/parcels', { headers: adminAuth });
  console.log('16. Total parcels in system:', allParcels.length);

  // Cleanup test parcel
  console.log('\n=== ALL 16 TESTS PASSED ===');
}

run().catch(e => console.error('TEST FAILED:', e.message));
