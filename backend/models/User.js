const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,

  // Farmer fields
  farmerName:     String,
  contact:        String,
  aadharNo:       String,
  farmLocation:   String,
  village:        String,

  // Transporter fields
  transporterName: String,
  transporterPhone: String,
  vehicleNumber:   String,
  licenseNumber:   String,
  companyName:     String,
  vehicleType:     String,

  // Retailer fields
  retailerName:    String,
  shopName:        String,
  shopAddress:     String,
  city:            String,
  state:           String,
  retailerPhone:   String,
  gstin:           String,
});

module.exports = mongoose.model("User", userSchema);