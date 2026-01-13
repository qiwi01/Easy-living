const express = require('express');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Top-up wallet (verify Paystack payment)
router.post('/topup', auth, async (req, res) => {
  const { ref } = req.body;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${ref}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    if (response.data.data.status === 'success') {
      const amount = response.data.data.amount / 100; // Convert kobo to naira
      req.user.walletBalance += amount;
      await req.user.save();

      const transaction = new Transaction({
        userId: req.user.id,
        type: 'topup',
        amount,
        status: 'success',
        paystackRef: ref
      });
      await transaction.save();

      res.json({ msg: 'Top-up successful', balance: req.user.walletBalance });
    } else {
      res.status(400).json({ msg: 'Payment failed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  res.json({ balance: req.user.walletBalance });
});

module.exports = router;