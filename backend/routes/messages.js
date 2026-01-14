const express = require('express');
const Message = require('../models/Message');
const House = require('../models/House');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all messages for user's house
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const messages = await Message.find({ houseId: req.user.houseId })
      .populate('senderId', 'email')
      .sort({ createdAt: 1 }) // Oldest first for chat flow
      .limit(100); // Limit to last 100 messages

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Post a new message
router.post('/', auth, async (req, res) => {
  const { content, type = 'message' } = req.body;

  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });
    if (!content || content.trim().length === 0) return res.status(400).json({ msg: 'Message content is required' });

    // Check permissions based on house settings
    const house = await House.findById(req.user.houseId);
    if (!house) return res.status(404).json({ msg: 'House not found' });

    // Check if user can post messages
    const isAdmin = house.adminId.toString() === req.user.id;
    const isSubAdmin = house.subAdmins.includes(req.user.id);

    if (!house.chatSettings.allowEveryoneToPost && !isAdmin && !isSubAdmin) {
      return res.status(403).json({ msg: 'Only admins can post messages in this house' });
    }

    // Check if user can post announcements
    if (type === 'announcement' && !isAdmin && !isSubAdmin) {
      return res.status(403).json({ msg: 'Only admins can post announcements' });
    }

    const message = new Message({
      houseId: req.user.houseId,
      senderId: req.user.id,
      content: content.trim(),
      type,
      isAnnouncement: type === 'announcement'
    });

    await message.save();

    // Populate sender info for response
    await message.populate('senderId', 'email');

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update chat settings (admin only)
router.put('/settings', auth, async (req, res) => {
  const { allowEveryoneToPost, announcementsEnabled } = req.body;

  try {
    if (!req.user.houseId) return res.status(400).json({ msg: 'Not in a house' });

    const house = await House.findById(req.user.houseId);
    if (!house) return res.status(404).json({ msg: 'House not found' });

    // Check if user is admin
    if (house.adminId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only house admin can update chat settings' });
    }

    // Update chat settings
    if (typeof allowEveryoneToPost === 'boolean') {
      house.chatSettings.allowEveryoneToPost = allowEveryoneToPost;
    }
    if (typeof announcementsEnabled === 'boolean') {
      house.chatSettings.announcementsEnabled = announcementsEnabled;
    }

    await house.save();

    res.json({
      msg: 'Chat settings updated successfully',
      chatSettings: house.chatSettings
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a message (sender or admin only)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ msg: 'Message not found' });

    // Check if user can delete (sender or admin)
    const house = await House.findById(message.houseId);
    const isAdmin = house.adminId.toString() === req.user.id;
    const isSender = message.senderId.toString() === req.user.id;

    if (!isAdmin && !isSender) {
      return res.status(403).json({ msg: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    res.json({ msg: 'Message deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
