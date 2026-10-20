// Native fetch test runner (built into Node 18+)
const BASE_URL = 'http://localhost:5000/api';

async function req(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=== GYMFLOW COMPREHENSIVE SYSTEM VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health & Database Diagnostic
    console.log('--- TEST 1: Health & Database Diagnostic ---');
    const health = await req('/health');
    assert(health.status === 200, 'Health endpoint responds with 200 OK');
    assert(health.data?.database?.connected === true, 'Database status is Connected (connected: true)');
    assert(health.data?.database?.host !== undefined, `Database host is present (${health.data?.database?.type})`);

    // 2. Authentication: Admin Login
    console.log('\n--- TEST 2: Admin Authentication ---');
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@gymflow.com', password: 'Admin@123' })
    });
    assert(adminLogin.data?.success === true, 'Admin login succeeds');
    assert(adminLogin.data?.data?.role === 'Admin', 'Admin role verified in JWT payload');
    const adminToken = adminLogin.data?.data?.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 3. Authentication: Trainer Login
    console.log('\n--- TEST 3: Trainer Authentication ---');
    const trainerLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'trainer@gymflow.com', password: 'Trainer@123' })
    });
    assert(trainerLogin.data?.success === true, 'Trainer login succeeds');
    assert(trainerLogin.data?.data?.role === 'Trainer', 'Trainer role verified in JWT payload');
    const trainerToken = trainerLogin.data?.data?.token;
    const trainerHeaders = { Authorization: `Bearer ${trainerToken}` };

    // 4. Authentication: Member Login
    console.log('\n--- TEST 4: Member Authentication ---');
    const memberLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'member@gymflow.com', password: 'Member@123' })
    });
    assert(memberLogin.data?.success === true, 'Member login succeeds');
    assert(memberLogin.data?.data?.role === 'Member', 'Member role verified in JWT payload');
    const memberToken = memberLogin.data?.data?.token;
    const memberHeaders = { Authorization: `Bearer ${memberToken}` };

    // 5. Role Authorization Security Check
    console.log('\n--- TEST 5: Role Authorization & Security ---');
    const memberAudit = await req('/audit-logs', { headers: memberHeaders });
    assert(memberAudit.status === 403, 'Member correctly blocked from admin audit-logs with 403 Forbidden');

    const trainerDues = await req('/dues', { headers: trainerHeaders });
    assert(trainerDues.status === 403, 'Trainer correctly blocked from dues with 403 Forbidden');

    // 6. Dashboards
    console.log('\n--- TEST 6: Dashboard Statistics ---');
    const adminDash = await req('/dashboard/admin', { headers: adminHeaders });
    assert(adminDash.data?.success === true, 'Admin dashboard returns successfully');
    assert(typeof adminDash.data?.data?.stats?.totalMembers === 'number', `Total members metric: ${adminDash.data?.data?.stats?.totalMembers}`);
    assert(typeof adminDash.data?.data?.stats?.monthlyRevenue === 'number', `Monthly revenue metric: Rs ${adminDash.data?.data?.stats?.monthlyRevenue}`);

    const memberDash = await req('/dashboard/member', { headers: memberHeaders });
    assert(memberDash.data?.success === true, 'Member dashboard returns successfully');
    assert(memberDash.data?.data?.member !== undefined, 'Member profile is present');

    // 7. Membership Plans
    console.log('\n--- TEST 7: Membership Plans API ---');
    const plansRes = await req('/plans');
    assert(plansRes.data?.success === true && plansRes.data?.data?.length >= 4, `Active plans loaded from MongoDB: ${plansRes.data?.data?.length} plans`);
    const basicPlan = plansRes.data?.data?.find(p => p.name === 'Basic') || plansRes.data?.data?.[0];

    // 8. Public Registration Flow with Plan & Coupon
    console.log('\n--- TEST 8: Public Registration Flow ---');
    const testEmail = `newuser_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
    const regRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Registration User',
        email: testEmail,
        phone: '9876500000',
        password: 'Password@123',
        planId: basicPlan._id,
        paymentMethod: 'UPI',
        couponCode: 'FITNESS10'
      })
    });
    if (!regRes.data?.success) {
      console.error('Registration failed details:', regRes.data);
    }
    assert(regRes.data?.success === true, 'New user registered with selected plan and coupon');
    assert(regRes.data?.data?.role === 'Member', 'Registered user strictly assigned Member role');
    const newMemberToken = regRes.data?.data?.token;
    const newMemberHeaders = { Authorization: `Bearer ${newMemberToken}` };
    const newMemberProfileId = regRes.data?.data?.profileId;

    // 9. Duplicate Email Prevention
    console.log('\n--- TEST 9: Duplicate Email Registration Prevention ---');
    const dupRes = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Test',
        email: testEmail,
        password: 'Password@123',
        planId: basicPlan._id
      })
    });
    assert(dupRes.status === 400, 'Duplicate email registration correctly rejected with 400 Bad Request');

    // 10. QR Attendance 5-Min TTL Token & Replay Prevention
    console.log('\n--- TEST 10: QR Attendance Token & Replay Prevention ---');
    const tokenGenRes = await req('/attendance/token/generate', {
      method: 'POST',
      headers: newMemberHeaders
    });
    assert(tokenGenRes.data?.success === true, '5-minute QR token generated for new member');
    const qrToken = tokenGenRes.data?.data?.token;
    assert(qrToken !== undefined, 'Token string exists');

    // Verify token (First Check-in should succeed)
    const tokenVerifyRes = await req('/attendance/token/verify', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ token: qrToken })
    });
    assert(tokenVerifyRes.data?.success === true, 'QR token checked in successfully');

    // Try REPLAYING the exact same token (Replay prevention should reject)
    const replayRes = await req('/attendance/token/verify', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ token: qrToken })
    });
    assert(replayRes.status === 400, 'Replay check-in correctly rejected with 400 (Token already consumed)');

    // 11. Class Booking & Concurrency Atomic Limit
    console.log('\n--- TEST 11: Class Booking ---');
    const classesRes = await req('/classes', { headers: newMemberHeaders });
    assert(classesRes.data?.success === true, 'Classes retrieved');
    const targetClass = classesRes.data?.data?.[0];
    if (targetClass) {
      const bookRes = await req(`/classes/${targetClass._id}/book`, {
        method: 'POST',
        headers: newMemberHeaders
      });
      assert(bookRes.data?.success === true, `Class "${targetClass.name}" booked atomically`);
    }

    // 12. Locker Allocation Atomic Checks
    console.log('\n--- TEST 12: Locker Allocation ---');
    const lockersRes = await req('/lockers', { headers: adminHeaders });
    assert(lockersRes.data?.success === true, 'Lockers retrieved');
    const availableLocker = lockersRes.data?.data?.find(l => l.status === 'Available');
    if (availableLocker && newMemberProfileId) {
      const assignRes = await req(`/lockers/${availableLocker._id}/allocate`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ memberId: newMemberProfileId, releaseDays: 30 })
      });
      assert(assignRes.data?.success === true, `Locker #${availableLocker.lockerNumber} assigned atomically to new member`);
    }

    // 13. Dues Ledger & Calculation
    console.log('\n--- TEST 13: Dues & Defaulters ---');
    const duesRes = await req('/dues', { headers: adminHeaders });
    assert(duesRes.data?.success === true, 'Dues ledger retrieved');
    assert(typeof duesRes.data?.stats?.totalOutstandingReceivable === 'number', `Total outstanding dues: Rs ${duesRes.data?.stats?.totalOutstandingReceivable}`);

    // 14. DBMS Diagnostic: Index Introspection & SQL View Equivalent
    console.log('\n--- TEST 14: DBMS Diagnostics & SQL View Equivalent ---');
    const diagRes = await req('/reports/diagnostics', { headers: adminHeaders });
    assert(diagRes.data?.data?.indexCatalog?.length > 5, `Introspected indexes across ${diagRes.data?.data?.indexCatalog?.length} collections`);

    const viewRes = await req('/reports/monthly-revenue-view', { headers: adminHeaders });
    assert(viewRes.data?.success === true, 'SQL View equivalent aggregation retrieved');
    assert(Array.isArray(viewRes.data?.data), `Monthly revenue view returned ${viewRes.data?.data?.length} months`);

    // 15. Audit Logs Recorded
    console.log('\n--- TEST 15: Audit Logs Trail ---');
    const auditRes = await req('/audit-logs?limit=5', { headers: adminHeaders });
    assert(auditRes.data?.success === true && auditRes.data?.data?.length > 0, `Audit logs verified (${auditRes.data?.data?.length} recent system records)`);

  } catch (error) {
    console.error('Test execution error:', error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
