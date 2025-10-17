require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Test reading the response.json file
try {
  const filePath = path.join(__dirname, "response.json");
  const data = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(data);
  
  console.log("File read successfully!");
  console.log("Number of transactions:", json.results.length);
  console.log("First transaction:", JSON.stringify(json.results[0], null, 2));
} catch (error) {
  console.error("Error reading file:", error.message);
}