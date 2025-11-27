// index.js
require('dotenv').config(); // Load biến môi trường từ .env
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Lấy URI MongoDB từ .env
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is undefined! Check your .env file.");
  process.exit(1);
}

// Tạo client MongoDB
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1, // Dùng API ổn định
    strict: true,
    deprecationErrors: true,
  }
});

let db;

// Kết nối MongoDB và lấy database
async function connectDB() {
  try {
    await client.connect(); 
    db = client.db("SecurityForMe"); // Tên database
    console.log("✅ Connected to MongoDB!");
  } catch (err) {
    console.error(err);
  }
}
connectDB();

// Route test server
app.get('/', (req, res) => res.send('Server is running'));

// Thêm document vào collection
app.post('/add', async (req, res) => {
  try {
    const collection = db.collection("testCollection");
    const result = await collection.insertOne(req.body);
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy tất cả document
app.get('/all', async (req, res) => {
  try {
    const collection = db.collection("testCollection");
    const docs = await collection.find({}).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server lắng nghe
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
