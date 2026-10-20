const crypto = require('crypto');

const BASE_URL = 'http://localhost:5000/api';

async function testRazorpay() {
  console.log('=== GYMFLOW RAZORPAY TEST SUITE ===\n');
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
    // 1. Get Public Key
    console.log('--- TEST 1: Retrieve Public Razorpay Key ID ---');
    const keyRes = await fetch(`${BASE_URL}/payments/razorpay-key`).then(r => r.json());
    assert(keyRes.success === true, 'Razorpay key endpoint responded with 200 OK');
    assert(keyRes.keyId === 'rzp_test_TqHLmAEv4kbwsP', `Key ID matches .env: ${keyRes.keyId}`);

    // 2. Fetch Plan from MongoDB
    console.log('\n--- TEST 2: Fetch Membership Plan from MongoDB ---');
    const plansRes = await fetch(`${BASE_URL}/plans`).then(r => r.json());
    assert(plansRes.success === true && plansRes.data.length > 0, `Plans loaded from MongoDB (${plansRes.data.length} plans)`);
    const testPlan = plansRes.data[0];
    console.log(`Testing with plan: "${testPlan.name}" (Price: ₹${testPlan.price})`);

    // 3. Create Razorpay Order
    console.log('\n--- TEST 3: Create Order via Razorpay Node.js SDK ---');
    const orderRes = await fetch(`${BASE_URL}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: testPlan._id,
        couponCode: 'FITNESS10'
      })
    }).then(r => r.json());

    assert(orderRes.success === true, 'Razorpay order created successfully');
    assert(typeof orderRes.data?.orderId === 'string' && orderRes.data?.orderId.startsWith('order_'), `Order ID received: ${orderRes.data?.orderId}`);
    assert(orderRes.data?.amount === Math.round(orderRes.data?.plan?.finalPrice * 100), `Order amount in paise verified: ${orderRes.data?.amount} paise (₹${orderRes.data?.plan?.finalPrice})`);
    const generatedOrderId = orderRes.data?.orderId;

    // 4. Test Invalid Signature Rejection (Requirement 8: Do not activate for unverified payments)
    console.log('\n--- TEST 4: Invalid Signature Rejection Security Check ---');
    const fakePaymentId = `pay_fake_${Date.now()}`;
    const badVerifyRes = await fetch(`${BASE_URL}/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: generatedOrderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: 'invalid_fraudulent_signature_hex_code',
        planId: testPlan._id,
        registrationData: {
          name: 'Hacker User',
          email: 'hacker@example.com',
          password: 'Password@123'
        }
      })
    });
    assert(badVerifyRes.status === 400, 'Invalid signature correctly rejected with HTTP 400');
    const badData = await badVerifyRes.json();
    assert(badData.success === false, `Rejection message: "${badData.message}"`);

    // 5. Test Cryptographically Valid Signature & Activation
    console.log('\n--- TEST 5: Cryptographic Signature Verification & Membership Activation ---');
    const mockPaymentId = `pay_test_${Date.now()}`;
    const secret = 'tWesZfy56fq4qTUBCp0t6mU5'; // from .env
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${generatedOrderId}|${mockPaymentId}`)
      .digest('hex');

    const testUserEmail = `razorpay_member_${Date.now()}@gymflow.com`;
    const goodVerifyRes = await fetch(`${BASE_URL}/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: generatedOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature,
        planId: testPlan._id,
        couponCode: 'FITNESS10',
        registrationData: {
          name: 'Razorpay Verified Member',
          email: testUserEmail,
          phone: '9876599999',
          password: 'Password@123'
        }
      })
    });

    assert(goodVerifyRes.status === 200, 'Valid signature verified with HTTP 200 OK');
    const goodData = await goodVerifyRes.json();
    assert(goodData.success === true && goodData.verified === true, 'Verification succeeded');
    assert(goodData.data?.membership?.status === 'Active', `Membership activated with status: "${goodData.data?.membership?.status}"`);
    assert(goodData.data?.payment?.transactionId === mockPaymentId, `Payment transaction ID recorded: ${goodData.data?.payment?.transactionId}`);
    assert(goodData.data?.user?.role === 'Member', `User role strictly assigned: "${goodData.data?.user?.role}"`);

    // 6. Test Duplicate Payment Rejection (Requirement 7: Prevent duplicate processing)
    console.log('\n--- TEST 6: Duplicate Payment Rejection Check ---');
    const dupVerifyRes = await fetch(`${BASE_URL}/payments/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: generatedOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature,
        planId: testPlan._id
      })
    });
    assert(dupVerifyRes.status === 400, 'Duplicate payment attempt correctly rejected with HTTP 400');

  } catch (error) {
    console.error('Test execution exception:', error);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`RAZORPAY VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

testRazorpay();
