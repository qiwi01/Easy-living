const express = require('express');
const { v4: uuidv4 } = require('uuid');
const House = require('../models/House');
const User = require('../models/User');
const Bill = require('../models/Bill');
const auth = require('../middleware/auth');

const router = express.Router();

// Create house
router.post('/create', auth, async (req, res) => {
  const { name } = req.body;

  try {
    // Generate a 6-digit numeric code
    const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

    const house = new House({
      name,
      adminId: req.user.id,
      joinCode,
      tenants: [req.user.id],
      subAdmins: []
    });
    await house.save();

    // Update user houseId
    req.user.houseId = house.id;
    await req.user.save();

    res.json({ house, joinCode });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Join house
router.post('/join', auth, async (req, res) => {
  const { code } = req.body;

  try {
    const house = await House.findOne({ joinCode: code });
    if (!house) return res.status(400).json({ msg: 'Invalid join code' });

    if (house.tenants.includes(req.user.id)) return res.status(400).json({ msg: 'Already in house' });

    house.tenants.push(req.user.id);
    await house.save();

    req.user.houseId = house.id;
    await req.user.save();

    res.json({ house });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get house info
router.get('/info', auth, async (req, res) => {
  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const house = await House.findById(req.user.houseId).populate('tenants').populate('subAdmins');
    res.json(house);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get my house (alias for /info for frontend compatibility)
router.get('/my-house', auth, async (req, res) => {
  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const house = await House.findById(req.user.houseId).populate('tenants').populate('subAdmins');
    res.json(house);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Manage house (add/remove tenants, promote)
router.put('/manage', auth, async (req, res) => {
  const { action, userId } = req.body; // action: 'add', 'remove', 'promote', 'demote'

  try {
    const house = await House.findById(req.user.houseId);
    if (!house || house.adminId.toString() !== req.user.id) return res.status(403).json({ msg: 'Not authorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (action === 'add') {
      if (!house.tenants.includes(userId)) {
        house.tenants.push(userId);
        user.houseId = house.id;
        await user.save();
      }
    } else if (action === 'remove') {
      house.tenants = house.tenants.filter(id => id.toString() !== userId);
      house.subAdmins = house.subAdmins.filter(id => id.toString() !== userId);
      user.houseId = null;
      await user.save();
    } else if (action === 'promote') {
      if (!house.subAdmins.includes(userId)) {
        house.subAdmins.push(userId);
      }
    } else if (action === 'demote') {
      house.subAdmins = house.subAdmins.filter(id => id.toString() !== userId);
    }

    await house.save();
    res.json(house);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Leave house
router.post('/leave', auth, async (req, res) => {
  try {
    const house = await House.findById(req.user.houseId);
    if (!house) return res.status(404).json({ msg: 'House not found' });

    // Remove user from house tenants
    house.tenants = house.tenants.filter(id => id.toString() !== req.user.id);
    house.subAdmins = house.subAdmins.filter(id => id.toString() !== req.user.id);

    // If user is admin and there are other members, transfer admin to another member
    if (house.adminId.toString() === req.user.id && house.tenants.length > 0) {
      house.adminId = house.tenants[0]; // Transfer admin to first remaining member
    }

    await house.save();

    // Remove houseId from user
    req.user.houseId = null;
    await req.user.save();

    res.json({ msg: 'Successfully left the house' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete house (admin only)
router.delete('/delete', auth, async (req, res) => {
  try {
    const house = await House.findById(req.user.houseId);
    if (!house) return res.status(404).json({ msg: 'House not found' });

    if (house.adminId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only house admin can delete the house' });
    }

    // Remove houseId from all tenants
    await User.updateMany(
      { houseId: house._id },
      { $unset: { houseId: '' } }
    );

    // Delete all bills for this house
    await Bill.deleteMany({ houseId: house._id });

    // Delete the house
    await House.findByIdAndDelete(house._id);

    res.json({ msg: 'House deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
