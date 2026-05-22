const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  stringId:                    String,
  numericId:                   Number,
  farmerUsername:              String,
  productName:                 String,
  quantity:                    Number,
  quantityUnit:                { type: String, default: 'kg' },
  assignedTransporter:         String,
  transporterQuantityReceived: Number,
  quantityMismatch:            { type: Boolean, default: false },
  custodyConfirmedAt:          Date,
  expiryDate:                  Date,
  createdAt:                   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Batch", batchSchema);