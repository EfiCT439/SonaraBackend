const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');

// Verify Flutterwave payment and activate premium
router.post('/verify', async (req, res) => {
  try {
    const { transaction_id, email } = req.body;

    if (!transaction_id || !email) {
      return res.status(400).json({ message: 'transaction_id and email are required' });
    }

    // Verify transaction with Flutterwave
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );

    const { data } = response.data;

    const isValid =
      data.status === 'successful' &&
      parseFloat(data.amount) >= 1 &&
      data.customer.email.toLowerCase() === email.toLowerCase();

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        isPremium: true,
        premiumActivatedAt: new Date(),
        premiumTransactionId: String(transaction_id),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No Sonara account found with that email. Make sure you use the same email as your app account.',
      });
    }

    res.json({
      success: true,
      message: "Premium activated! Open the Sonara app and enjoy unlimited music.",
    });
  } catch (error) {
    console.error('Payment verification error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Server error during payment verification. Please contact support.' });
  }
});

// Flutterwave webhook (backup — fires server-side after payment)
router.post('/webhook', async (req, res) => {
  const hash = req.headers['verif-hash'];
  if (!process.env.FLW_WEBHOOK_HASH || hash !== process.env.FLW_WEBHOOK_HASH) {
    return res.status(401).end();
  }

  const { event, data } = req.body;

  if (event === 'charge.completed' && data.status === 'successful') {
    const email = data.customer.email.toLowerCase();
    await User.findOneAndUpdate({ email }, { isPremium: true }).catch(() => {});
  }

  res.status(200).json({ received: true });
});

// POST /api/payment/mobile-money — initiate direct charge (STK push / USSD)
router.post('/mobile-money', async (req, res) => {
  try {
    const { phone, email, name, provider, plan, country } = req.body;

    if (!phone || !email || !name) {
      return res.status(400).json({ success: false, message: 'Phone number, email, and name are required.' });
    }

    // Flutterwave requires digits only — strip +, spaces, dashes, brackets
    const cleanPhone = phone.replace(/[^\d]/g, '');

    const txRef = 'sonara-mm-' + Date.now();
    const isYearly = plan === 'yearly';

    let type, currency, amount;

    if (country === 'NG') {
      // Nigeria — USSD charge (returns a code the user dials to enter PIN)
      type = 'ussd';
      currency = 'NGN';
      amount = isYearly ? 20000 : 1550;
    } else {
      // Cameroon / francophone Africa — STK push (prompt appears on phone, user enters PIN)
      type = 'mobile_money_franco';
      currency = 'XAF';
      amount = isYearly ? 8000 : 650;
    }

    const payload = {
      tx_ref: txRef,
      amount,
      currency,
      email,
      fullname: name,
      phone_number: cleanPhone,
      is_subscription: false,
    };

    const response = await axios.post(
      `https://api.flutterwave.com/v3/charges?type=${type}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { data, meta } = response.data;
    const ussdCode = meta?.authorization?.note || data?.meta?.authorization?.note || null;

    res.json({
      success: true,
      txRef,
      type,
      status: data?.status || 'pending',
      message: ussdCode
        ? `Dial ${ussdCode} on your phone to complete the payment.`
        : 'A payment prompt has been sent to your phone. Enter your PIN to confirm.',
      ussdCode,
    });
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error('Mobile money charge error:', errMsg);
    res.status(500).json({ success: false, message: errMsg || 'Could not initiate mobile money payment. Please try again.' });
  }
});

// GET /api/payment/mobile-money/status/:txRef — poll for PIN confirmation
router.get('/mobile-money/status/:txRef', async (req, res) => {
  try {
    const { txRef } = req.params;
    const { email } = req.query;

    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions?tx_ref=${txRef}`,
      { headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` } }
    );

    const transactions = response.data?.data;
    if (!transactions || transactions.length === 0) {
      return res.json({ status: 'pending' });
    }

    const tx = transactions[0];

    if (tx.status === 'successful') {
      if (email) {
        await User.findOneAndUpdate(
          { email: email.toLowerCase() },
          {
            isPremium: true,
            premiumActivatedAt: new Date(),
            premiumTransactionId: String(tx.id),
          }
        ).catch(() => {});
      }
      return res.json({ status: 'successful' });
    }

    if (tx.status === 'failed') {
      return res.json({ status: 'failed', message: 'Payment was not completed. Please try again.' });
    }

    res.json({ status: 'pending' });
  } catch (error) {
    console.error('MM status check error:', error.response?.data || error.message);
    res.json({ status: 'pending' });
  }
});

// Check premium status by email (used by the website after payment)
router.get('/status/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('isPremium email');
    if (!user) return res.status(404).json({ isPremium: false });
    res.json({ isPremium: user.isPremium, email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
