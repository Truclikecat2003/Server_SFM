require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const xss = require('xss');

const app = express();
app.use(cors());
app.use(express.json());

// ========================
//  CSRF TOKEN TẠO TỰ ĐỘNG
// ========================
let SERVER_CSRF_TOKEN = Math.random().toString(36).substring(2);

// API: Client lấy CSRF token
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: SERVER_CSRF_TOKEN });
});

// ========================
//  KẾT NỐI MONGODB
// ========================
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

let db;
let isConnected = false;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("SecurityForMe"); // tên database m đang dùng
    await db.command({ ping: 1 });
    isConnected = true;
    console.log("✅ MongoDB connected!");
  } catch (err) {
    isConnected = false;
    console.error("❌ MongoDB connection failed", err);
  }
}
connectDB();

// ========================
//  API CHỐNG XSS + CSRF + LƯU MONGO
// ========================
app.post('/safe-insert', async (req, res) => {
  try {
    // 1) Kiểm tra CSRF
    if (!req.body.csrfToken || req.body.csrfToken !== SERVER_CSRF_TOKEN) {
      return res.status(403).json({ error: "Invalid CSRF Token" });
    }

    // 2) Lọc XSS
    const cleaned = {};
    for (let key in req.body.data) {
      cleaned[key] = xss(req.body.data[key]);
    }

    // 3) Lưu MongoDB
    const result = await db.collection("safeCollection").insertOne(cleaned);

    res.json({
      status: "OK",
      insertedId: result.insertedId,
      sanitizedData: cleaned
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
//  HEALTH: KIỂM TRA BẢO MẬT + DB
// ========================
app.get('/health', async (req, res) => {

  const securityStatus = {
    mongo: "unknown",
    csrf: "enabled",
    xss: "enabled",
    csrfToken: SERVER_CSRF_TOKEN ? "active" : "missing",
  };

  try {
    await db.command({ ping: 1 });
    securityStatus.mongo = "connected";
  } catch {
    securityStatus.mongo = "disconnected";
  }

  res.json({
    status: securityStatus.mongo === "connected" ? "OK" : "FAIL",
    security: securityStatus
  });
});

// ========================
//  ROUTE GỐC
// ========================
app.get('/', (req, res) => {
  res.send('Server running with XSS + CSRF Protection');
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
