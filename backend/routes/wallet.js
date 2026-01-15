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

// Get house wallet balance
router.get('/house-balance', auth, async (req, res) => {
  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const House = require('../models/House');
    const house = await House.findById(req.user.houseId);
    if (!house) return res.status(404).json({ msg: 'House not found' });

    res.json({ balance: house.groupWalletBalance });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Withdraw from house wallet (admin only)
router.post('/house-withdraw', auth, async (req, res) => {
  const { amount, bankDetails } = req.body;

  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const House = require('../models/House');
    const house = await House.findById(req.user.houseId);
    if (!house) return res.status(404).json({ msg: 'House not found' });

    // Check if user is admin
    if (house.adminId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only house admin can withdraw funds' });
    }

    if (house.groupWalletBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient house balance' });
    }

    // Deduct from house wallet
    house.groupWalletBalance -= parseFloat(amount);
    await house.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'house_withdrawal',
      amount: parseFloat(amount),
      status: 'success',
      houseId: req.user.houseId,
      description: `House withdrawal to ${bankDetails.accountName} (${bankDetails.accountNumber})`
    });
    await transaction.save();

    res.json({
      msg: 'Withdrawal initiated successfully',
      balance: house.groupWalletBalance,
      transaction: transaction
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
