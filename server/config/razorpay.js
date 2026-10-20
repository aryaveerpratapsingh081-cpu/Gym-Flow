const Razorpay = require('razorpay');

/**
 * DBMS LAB & GATEWAY INTEGRATION:
 * Initialize Razorpay SDK using Test Mode credentials from environment variables.
 * Key ID is public/safe for client; Key Secret is strictly kept on the backend.
 */
let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.warn('⚠️ Razorpay credentials missing in server/.env (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET).');
      return null;
    }

    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
  }

  return razorpayInstance;
};

module.exports = {
  getRazorpayInstance
};
