const express = require("express");
const { ethers } = require("ethers");
const Batch = require("./models/Batch");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const app = express();
app.use(express.json());
app.use(cors());

// Load ABI
const abi = require("./abi.json");

// Connect to blockchain
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Contract address
const contractAddress = "0x7Bc267d597bc24f079F0a449122D15D0a252A488";

// Wallet (Hardhat account)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contracts
const contractWrite = new ethers.Contract(contractAddress, abi, wallet);
const contractRead = new ethers.Contract(contractAddress, abi, provider);

// Home
app.get("/", (req, res) => {
  res.send("Backend + Blockchain Connected");
});


// CREATE BATCH (dynamic)
// Helper: generate string batch ID
function generateBatchId(farmerUsername, productName, count) {
  const farmerPart = farmerUsername.toLowerCase().slice(0, 3);
  const productPart = productName.toLowerCase().replace(/\s+/g, '').slice(0, 2);
  const countPart = count;
  const randomPart = Math.random().toString(36).slice(2, 6); // 4 random chars
  return `${farmerPart}-${productPart}${countPart}-${randomPart}`;
}

// CREATE BATCH (auto ID generation)
app.post("/createBatch", async (req, res) => {
  try {
    const { name, origin, farmerUsername, quantity, quantityUnit, assignedTransporter, expiryDate } = req.body;

    if (!name || !origin || !farmerUsername) {
      return res.status(400).send("Name, origin and farmerUsername are required");
    }

    // Count how many batches this farmer made with this product
    const existingCount = await Batch.countDocuments({
      farmerUsername: farmerUsername.toLowerCase(),
      productName: name.toLowerCase().replace(/\s+/g, '')
    });
    const count = existingCount + 1;

    // Generate string ID
    const stringId = generateBatchId(farmerUsername, name, count);

    // Generate numeric ID (total batches ever + 1)
    const totalBatches = await Batch.countDocuments();
    const numericId = totalBatches + 1;

    // Save mapping to MongoDB first
    const newBatch = new Batch({
      stringId,
      numericId,
      farmerUsername: farmerUsername.toLowerCase(),
      productName: name.toLowerCase().replace(/\s+/g, ''),
      quantity: quantity ? Number(quantity) : null,
      quantityUnit: quantityUnit || 'kg',
      assignedTransporter: assignedTransporter ? assignedTransporter.toLowerCase() : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });
    await newBatch.save();

    // Write to blockchain using numeric ID
    const tx = await contractWrite.createBatch(numericId, name, origin);
    await tx.wait();

    res.json({
      message: "Batch created successfully",
      stringId,
      numericId
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// UPDATE BATCH (dynamic)
app.post("/updateBatch", async (req, res) => {
  try {
    const { id, stage, location } = req.body;

    // Check batch exists in MongoDB using string ID
    const batchRecord = await Batch.findOne({ stringId: id });
    if (!batchRecord) {
      return res.status(404).send("Batch does not exist");
    }

    // Use numeric ID for blockchain
    const tx = await contractWrite.updateBatch(batchRecord.numericId, stage, location);
    await tx.wait();

    res.send("Batch updated successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// GET BATCH INFO (accepts string ID)
app.get("/getBatch/:id", async (req, res) => {
  try {
    const stringId = req.params.id;

    const batchRecord = await Batch.findOne({ stringId });
    if (!batchRecord) {
      return res.status(404).send("Batch not found");
    }

    const data = await contractRead.getBatch(batchRecord.numericId);

    // Fetch farmer profile
    let farmerProfile = null;
    if (batchRecord.farmerUsername) {
      const farmer = await User.findOne({ username: batchRecord.farmerUsername });
      if (farmer) {
        farmerProfile = {
          farmerName:   farmer.farmerName,
          contact:      farmer.contact,
          village:      farmer.village,
          farmLocation: farmer.farmLocation,
          aadharNo:     farmer.aadharNo,
        };
      }
    }

    // Fetch transporter profile
    let transporterProfile = null;
    if (batchRecord.assignedTransporter) {
      const transporter = await User.findOne({ username: batchRecord.assignedTransporter });
      if (transporter) {
        transporterProfile = {
          transporterName:  transporter.transporterName,
          vehicleNumber:    transporter.vehicleNumber,
          companyName:      transporter.companyName,
          vehicleType:      transporter.vehicleType,
          transporterPhone: transporter.transporterPhone,
          licenseNumber:    transporter.licenseNumber,
        };
      }
    }

    res.json({
      id: stringId,
      numericId: batchRecord.numericId,
      name: data[1],
      origin: data[2],
      creator: data[3],
      quantity: batchRecord.quantity,
      quantityUnit: batchRecord.quantityUnit,
      assignedTransporter: batchRecord.assignedTransporter,
      farmerUsername: batchRecord.farmerUsername,
      quantityMismatch: batchRecord.quantityMismatch,
      transporterQuantityReceived: batchRecord.transporterQuantityReceived,
      custodyConfirmedAt: batchRecord.custodyConfirmedAt,
      expiryDate: batchRecord.expiryDate,
      createdAt: batchRecord.createdAt,
      farmerProfile,
      transporterProfile,
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// GET HISTORY (accepts string ID)
app.get("/getHistory/:id", async (req, res) => {
  try {
    const stringId = req.params.id;

    // Look up numeric ID from MongoDB
    const batchRecord = await Batch.findOne({ stringId });
    if (!batchRecord) {
      return res.status(404).send("Batch not found");
    }

    const numericId = BigInt(batchRecord.numericId);
    const length = Number(await contractRead.getHistoryLength(numericId));

    let history = [];
    for (let i = 0; i < length; i++) {
      const event = await contractRead.getFunction("getEvent")(numericId, i);
      history.push({
        stage: Number(event[0]),
        location: event[1],
        timestamp: Number(event[2]),
        handler: event[3],
      });
    }

    res.json(history);

  } catch (err) {
    res.status(500).send(err.message);
  }
});

const QRCode = require("qrcode");

app.get("/generateQR/:id", async (req, res) => {
  try {
    const batchId = req.params.id; 

    // Verify batch exists in MongoDB
    const batchRecord = await Batch.findOne({ stringId: batchId });
    if (!batchRecord) {
      return res.status(404).send("Batch not found");
    }

    const url = `https://foodtrace-omega.vercel.app/batch/${batchId}`;
    const qrImage = await QRCode.toDataURL(url);

    res.json({ qr: qrImage });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET ALL TRANSPORTERS (for farmer to assign)
app.get("/getTransporters", async (req, res) => {
  try {
    const transporters = await User.find(
      { role: "transporter" },
      "username transporterName vehicleNumber companyName"
    );
    res.json(transporters);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// CONFIRM CUSTODY (transporter confirms receipt with quantity)
app.post("/confirmCustody", async (req, res) => {
  try {
    const { batchId, receivedQuantity } = req.body;

    const batchRecord = await Batch.findOne({ stringId: batchId });
    if (!batchRecord) {
      return res.status(404).send("Batch not found");
    }

    const mismatch = batchRecord.quantity !== null &&
      batchRecord.quantity !== undefined &&
      Number(receivedQuantity) !== Number(batchRecord.quantity);

    batchRecord.transporterQuantityReceived = Number(receivedQuantity);
    batchRecord.quantityMismatch = mismatch;
    batchRecord.custodyConfirmedAt = new Date();
    await batchRecord.save();

    res.json({
      message: "Custody confirmed",
      mismatch,
      farmerQuantity: batchRecord.quantity,
      quantityUnit: batchRecord.quantityUnit,
      receivedQuantity: Number(receivedQuantity),
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Create new user with ONLY consumer role
    const newUser = new User({
      username,
      password,
      role: "consumer"
    });

    await newUser.save();

    res.send("User registered successfully");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check user in DB
    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(401).send("Invalid credentials");
    }

    // Send role back
    res.json({
      role: user.role
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET USER PROFILE
app.get("/getProfile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.json(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/admin/addUser", async (req, res) => {
  try {
    const { username, password, role, profile } = req.body;

    // Allow only specific roles
    const allowedRoles = ["farmer", "transporter", "retailer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).send("Invalid role");
    }

    // Validate profile exists
    if (!profile || typeof profile !== "object") {
      return res.status(400).send("Profile details are required");
    }

    // Validate role-specific required fields
    if (role === "farmer") {
      const required = ["farmerName", "contact", "aadharNo", "farmLocation", "village"];
      for (const field of required) {
        if (!profile[field] || !profile[field].trim()) {
          return res.status(400).send(`Farmer ${field} is required`);
        }
      }
    }

    if (role === "transporter") {
      const required = ["transporterName", "transporterPhone", "vehicleNumber", "licenseNumber", "companyName", "vehicleType"];
      for (const field of required) {
        if (!profile[field] || !profile[field].trim()) {
          return res.status(400).send(`Transporter ${field} is required`);
        }
      }
    }

    if (role === "retailer") {
      const required = ["retailerName", "shopName", "shopAddress", "city", "state", "retailerPhone"];
      for (const field of required) {
        if (!profile[field] || !profile[field].trim()) {
          return res.status(400).send(`Retailer ${field} is required`);
        }
      }
    }

    // Check existing user
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Build user object based on role
    let userData = { username, password, role };

    if (role === "farmer") {
      userData.farmerName   = profile.farmerName   || "";
      userData.contact      = profile.contact      || "";
      userData.aadharNo     = profile.aadharNo     || "";
      userData.farmLocation = profile.farmLocation || "";
      userData.village      = profile.village      || "";
    }

    if (role === "transporter") {
      userData.transporterName  = profile.transporterName  || "";
      userData.transporterPhone = profile.transporterPhone || "";
      userData.vehicleNumber    = profile.vehicleNumber    || "";
      userData.licenseNumber    = profile.licenseNumber    || "";
      userData.companyName      = profile.companyName      || "";
      userData.vehicleType      = profile.vehicleType      || "";
    }

    if (role === "retailer") {
      userData.retailerName  = profile.retailerName  || "";
      userData.shopName      = profile.shopName      || "";
      userData.shopAddress   = profile.shopAddress   || "";
      userData.city          = profile.city          || "";
      userData.state         = profile.state         || "";
      userData.retailerPhone = profile.retailerPhone || "";
      userData.gstin         = profile.gstin         || "";
    }

    const newUser = new User(userData);
    await newUser.save();

    res.send("User added successfully");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});