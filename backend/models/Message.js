const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['message', 'announcement'], default: 'message' },
  isAnnouncement: { type: Boolean, default: false },
  attachments: [{ type: String }], // URLs to attached files/images
}, { timestamps: true });

// Index for efficient querying
MessageSchema.index({ houseId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
