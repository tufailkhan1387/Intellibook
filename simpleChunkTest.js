// Simple test for processing a single chunk of transactions
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import the chunk processing function
const { enrichTransactionsInChunks } = require("./controllers/userController");

// Simple test
async function simpleChunkTest() {
  console.log("=== Starting Simple Chunk Test ===");
  
  try {
    // Read the response.json file
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log(`Total transactions: ${transactions.length}`);
    
    // Take just the first 5 transactions for testing
    const testTransactions = transactions.slice(0, 5);
    console.log(`Processing first ${testTransactions.length} transactions...`);
    
    // Process just this small chunk
    const result = await enrichTransactionsInChunks(testTransactions, 5);
    
    console.log("=== Test Completed Successfully ===");
    console.log(`Processed ${result.length} transactions`);
    console.log("First transaction:");
    console.log(JSON.stringify(result[0], null, 2));
    
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

simpleChunkTest();