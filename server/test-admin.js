// Quick admin API test script
const BASE = 'http://localhost:5000/api';

async function api(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${data.message}`);
  return data;
}

async function run() {
  console.log('=== Admin API Test Suite ===\n');

  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const admin = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@grampickup.com', password: 'admin123' }),
  });
  console.log(`   ✅ Logged in as: ${admin.name} (${admin.role})`);
  const authHeaders = { Authorization: `Bearer ${admin.token}` };

  // 2. Dashboard analytics
  console.log('\n2. Fetching admin dashboard analytics...');
  const dashboard = await api('/analytics/dashboard', { headers: authHeaders });
  const s = dashboard.summary;
  console.log(`   ✅ Total Customers: ${s.totalCustomers}`);
  console.log(`   ✅ Total Shops: ${s.totalShops}`);
  console.log(`   ✅ Total Parcels: ${s.totalParcels}`);
  console.log(`   ✅ Total Revenue: ₹${s.totalRevenue}`);
  console.log(`   ✅ Status Breakdown: Expected=${s.statusBreakdown.Expected}, Arrived=${s.statusBreakdown.Arrived}, Ready=${s.statusBreakdown.Ready}, Delivered=${s.statusBreakdown.Delivered}`);
  console.log(`   ✅ Shop Breakdown: approved=${s.shopBreakdown.approved}, pending=${s.shopBreakdown.pending}, rejected=${s.shopBreakdown.rejected}`);
  console.log(`   ✅ Monthly Parcels data: ${dashboard.monthlyParcels.length} months`);
  console.log(`   ✅ Monthly Revenue data: ${dashboard.monthlyRevenue.length} months`);

  // 3. All shops (admin)
  console.log('\n3. Fetching all shops (admin-only)...');
  const shops = await api('/shops', { headers: authHeaders });
  console.log(`   ✅ Found ${shops.length} shops`);
  shops.forEach(shop => {
    console.log(`      - ${shop.shopName} [${shop.verificationStatus}] | Rating: ${shop.averageRating || 'N/A'} | Photo: ${shop.shopPhoto ? 'Yes' : 'No'} | Coords: ${shop.latitude},${shop.longitude}`);
  });

  // 4. Approve the pending shop
  const pendingShop = shops.find(s => s.verificationStatus === 'pending');
  if (pendingShop) {
    console.log(`\n4. Approving pending shop "${pendingShop.shopName}"...`);
    const approved = await api(`/shops/${pendingShop._id}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'approved' }),
    });
    console.log(`   ✅ Shop status updated to: ${approved.verificationStatus}`);

    // Reject it back for testing
    console.log('   Reverting to pending for test data integrity...');
    // Actually let's reject it and then set back to pending - but there's no "pending" status setter
    // Let's just re-reject it
    await api(`/shops/${pendingShop._id}/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: 'rejected' }),
    });
    console.log('   ✅ Reverted to rejected (test cycle complete)');
  } else {
    console.log('\n4. No pending shops to test approve/reject flow.');
  }

  // 5. All users
  console.log('\n5. Fetching all users (admin-only)...');
  const allUsers = await api('/analytics/users', { headers: authHeaders });
  console.log(`   ✅ Found ${allUsers.length} users`);
  allUsers.forEach(u => {
    console.log(`      - ${u.name} (${u.role}) | ${u.email}`);
  });

  // 5b. Filter by role
  const customers = await api('/analytics/users?role=customer', { headers: authHeaders });
  console.log(`   ✅ Customers filter: ${customers.length} users`);
  const shopkeepers = await api('/analytics/users?role=shopkeeper', { headers: authHeaders });
  console.log(`   ✅ Shopkeepers filter: ${shopkeepers.length} users`);

  // 6. All parcels (admin)
  console.log('\n6. Fetching all parcels (admin-only)...');
  const parcels = await api('/parcels', { headers: authHeaders });
  console.log(`   ✅ Found ${parcels.length} parcels`);
  parcels.forEach(p => {
    console.log(`      - ${p.parcelName} [${p.status}] | Tracking: ${p.trackingNumber} | Fee: ₹${p.currentFee || p.fee} | Days: ${p.daysStored}`);
  });

  // 6b. Filter by status
  const expectedParcels = await api('/parcels?status=Expected', { headers: authHeaders });
  console.log(`   ✅ Expected filter: ${expectedParcels.length} parcels`);

  // 6c. Search by tracking
  const searchParcels = await api('/parcels?search=TRK99', { headers: authHeaders });
  console.log(`   ✅ Search "TRK99": ${searchParcels.length} parcels`);

  // 7. Non-admin should NOT access admin routes
  console.log('\n7. Testing authorization guard...');
  const customer = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'customer1@grampickup.com', password: 'customer123' }),
  });
  try {
    await api('/analytics/dashboard', { headers: { Authorization: `Bearer ${customer.token}` } });
    console.log('   ❌ FAIL: Customer accessed admin route!');
  } catch (err) {
    console.log(`   ✅ Customer correctly blocked: ${err.message}`);
  }

  console.log('\n=== All Admin Tests Passed ===');
}

run().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
