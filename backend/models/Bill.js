const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  houseId: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  targetAmount: { type: Number },
  assignedTo: { type: String, enum: ['all'], default: 'all' }, // or array of user IDs, but for simplicity, 'all' or specific
  payments: [{
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paid: { type: Boolean, default: false },
    amountPaid: { type: Number, default: 0 },
    date: { type: Date }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Bill', BillSchema);