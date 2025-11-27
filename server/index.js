require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is undefined! Check your .env file.");
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

// Hàm kết nối DB (trả về db)
async function connectDB() {
  if (db) return db; // Nếu đã có db thì trả về
  try {
    await client.connect();
    db = client.db("SecurityForMe");
    console.log("✅ MongoDB connected!");
    return db;
  } catch (err) {
    console.error("❌ MongoDB connect error:", err);
  }
}

// Route test
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Lấy tất cả docs
app.get("/all", async (req, res) => {
  try {
    const database = await connectDB(); // đảm bảo đã connect
    const collection = database.collection("testCollection");

    const docs = await collection.find({}).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm doc
app.post("/add", async (req, res) => {
  try {
    const database = await connectDB();
    const collection = database.collection("testCollection");

    const result = await collection.insertOne(req.body);
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
