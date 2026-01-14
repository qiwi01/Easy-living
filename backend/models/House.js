const mongoose = require('mongoose');

const HouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinCode: { type: String, required: true, unique: true },
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Chat settings
  chatSettings: {
    allowEveryoneToPost: { type: Boolean, default: true }, // If false, only admins can post
    announcementsEnabled: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('House', HouseSchema);
