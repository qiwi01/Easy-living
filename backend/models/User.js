const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['tenant', 'admin', 'sub-admin'], default: 'tenant' },
  walletBalance: { type: Number, default: 0 },
  roomId: { type: String },
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
