const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const upload = multer({ dest: "uploads/" });
const uri = "mongodb://127.0.0.1:27017/AccessPay";

// Connect to MongoDB when the application starts
let client;
MongoClient.connect(uri)
  .then((connectedClient) => {
    client = connectedClient;
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("Failed to connect to MongoDB", err));

app.use(express.static("public"));

async function insertDataToMongoDB(collectionName, data, googleId) {
  const collection = client.db("AccessPay").collection(collectionName);
  try {
    const result = await collection.findOneAndUpdate(
      { googleId: googleId },
      { $push: { transactions: { $each: data } } },
      { upsert: true, returnOriginal: false }
    );
    console.log(`Updated document for user ${googleId}`);
    return result.value;
  } catch (e) {
    console.error(`Error updating MongoDB: ${e.message}`);
    throw e;
  }
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const collectionName = "Customers";
    const googleId = "110948944282524482716";
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    const updatedDocument = await insertDataToMongoDB(
      collectionName,
      data,
      googleId
    );
    res.send("Data uploaded and added to user document successfully");
  } catch (e) {
    console.error(`Error during upload: ${e.message}`);
    res.status(500).send("Error uploading data");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));