const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  stringId:        String,   // "roh-ap1-xw3k"
  numericId:       Number,   // 1, 2, 3... (used on blockchain)
  farmerUsername:  String,   // "rohit"
  productName:     String,   // "apples"
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model("Batch", batchSchema);