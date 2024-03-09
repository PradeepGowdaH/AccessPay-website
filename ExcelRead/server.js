const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const MongoClient = require("mongodb").MongoClient;
const app = express();
const upload = multer({ dest: "uploads/" });
const uri = "mongodb://127.0.0.1:27017/AccessPay"; // Adjusted for local MongoDB server
const client = new MongoClient(uri); // Removed deprecated options

app.use(express.static("public"));

async function insertDataToMongoDB(collectionName, data, googleId) {
  const collection = client.db("AccessPay").collection(collectionName);
  try {
    const result = await collection.findOneAndUpdate(
      { googleId: googleId }, // Find a document with this googleId
      { $push: { transactions: { $each: data } } }, // Update the document by adding the transactions
      { upsert: true, returnOriginal: false } // Options: create the document if it doesn't exist, return the updated document
    );
    console.log(`Updated document for user ${googleId}`);
    return result.value; // Return the updated document
  } catch (e) {
    console.error(`Error updating MongoDB: ${e.message}`);
    throw e; // Rethrow the error to handle it in the calling function
  }
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    await client.connect();
    const collectionName = "Customers";
    const googleId = "google_id_4"; // The googleId of the user you want to update
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
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));