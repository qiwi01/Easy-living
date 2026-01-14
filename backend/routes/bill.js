const express = require('express');
const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const House = require('../models/House');
const auth = require('../middleware/auth');

const router = express.Router();

// Create bill
router.post('/create', auth, async (req, res) => {
  const { name, amount, dueDate, assignedTo, targetAmount } = req.body;

  try {
    const house = await House.findById(req.user.houseId);
    if (!house || (house.adminId.toString() !== req.user.id && !house.subAdmins.includes(req.user.id))) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const bill = new Bill({
      houseId: req.user.houseId,
      name,
      amount,
      dueDate,
      assignedTo: assignedTo || 'all',
      targetAmount
    });
    await bill.save();

    res.json(bill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// List bills
router.get('/list', auth, async (req, res) => {
  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const bills = await Bill.find({ houseId: req.user.houseId }).populate('payments.tenantId');
    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get my bills (alias for /list for frontend compatibility)
router.get('/my-bills', auth, async (req, res) => {
  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const bills = await Bill.find({ houseId: req.user.houseId }).populate('payments.tenantId');
    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Pay bill
router.post('/pay', auth, async (req, res) => {
  const { billId, paymentMethod } = req.body; // paymentMethod: 'wallet' or 'paystack'

  try {
    const bill = await Bill.findById(billId);
    if (!bill || bill.houseId.toString() !== req.user.houseId.toString()) {
      return res.status(404).json({ msg: 'Bill not found' });
    }

    // Check if user is assigned
    if (bill.assignedTo !== 'all' && !bill.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Not assigned to this bill' });
    }

    // Check if already paid
    const existingPayment = bill.payments.find(p => p.tenantId.toString() === req.user.id);
    if (existingPayment && existingPayment.paid) {
      return res.status(400).json({ msg: 'Already paid' });
    }

    if (paymentMethod === 'wallet') {
      if (req.user.walletBalance < bill.amount) {
        return res.status(400).json({ msg: 'Insufficient balance' });
      }

      req.user.walletBalance -= bill.amount;
      await req.user.save();

      const payment = {
        tenantId: req.user.id,
        paid: true,
        amountPaid: bill.amount,
        date: new Date()
      };
      bill.payments.push(payment);
      await bill.save();

      const transaction = new Transaction({
        userId: req.user.id,
        type: 'payment',
        amount: bill.amount,
        status: 'success'
      });
      await transaction.save();

      res.json({ msg: 'Payment successful' });
    } else {
      // For paystack, similar to topup, but need ref
      // For now, assume wallet only
      res.status(400).json({ msg: 'Paystack payment not implemented yet' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
