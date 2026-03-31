const express = require("express");
const { ethers } = require("ethers");
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
app.post("/createBatch", async (req, res) => {
  try {
    const { id, name, origin } = req.body;

    const tx = await contractWrite.createBatch(id, name, origin);
    await tx.wait();

    res.send("Batch created successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// UPDATE BATCH (dynamic)
app.post("/updateBatch", async (req, res) => {
  try {
    const { id, stage, location } = req.body;

    const tx = await contractWrite.updateBatch(id, stage, location);
    await tx.wait();

    res.send("Batch updated successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// GET BATCH INFO
app.get("/getBatch/:id", async (req, res) => {
  try {
    const data = await contractRead.getBatch(req.params.id);

    res.json({
      id: Number(data[0]),
      name: data[1],
      origin: data[2],
      creator: data[3]
    });

  } catch (err) {
    res.status(500).send(err.message);
  }
});


// GET HISTORY (final fixed)
app.get("/getHistory/:id", async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const length = Number(await contractRead.getHistoryLength(id));

    let history = [];

    for (let i = 0; i < length; i++) {
      const event = await contractRead.getFunction("getEvent")(id, i);

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

    const url = `https://foodtrace-omega.vercel.app/batch/${batchId}`;

    const qrImage = await QRCode.toDataURL(url);

    res.json({ qr: qrImage }); // ✅ send JSON, not HTML

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

app.post("/admin/addUser", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Allow only specific roles
    const allowedRoles = ["farmer", "transporter", "retailer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).send("Invalid role");
    }

    // Check existing user
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    const newUser = new User({ username, password, role });
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