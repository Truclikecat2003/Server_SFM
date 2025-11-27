require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("❌ MONGO_URI is undefined! Check .env file.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let isConnected = false;

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 }); // chỉ ping
    isConnected = true;
    console.log("✅ MongoDB connected!");
  } catch (err) {
    isConnected = false;
    console.error("❌ MongoDB connection failed", err);
  }
}
connectDB();

// Route test server
app.get('/', (req, res) => {
  res.send('Server running');
});

// Route kiểm tra Mongo có kết nối hay chưa
app.get('/health', (req, res) => {
  if (isConnected) {
    res.json({ mongo: "connected", status: "OK" });
  } else {
    res.json({ mongo: "disconnected", status: "FAIL" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
