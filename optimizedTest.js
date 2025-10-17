// Test the optimized transaction categorization
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import the categorizeData function
const { categorizeData } = require("./controllers/userController");

// Mock Express request and response objects
const mockReq = {};

const mockRes = {
  statusCode: 0,
  data: null,
  
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  
  json: function(data) {
    this.data = data;
    console.log(`\n=== Response Status: ${this.statusCode} ===`);
    
    if (this.statusCode === 200) {
      console.log(`Success! Processed ${data.results.length} transactions`);
      console.log("\nFirst transaction sample:");
      if (data.results.length > 0) {
        console.log(JSON.stringify(data.results[0], null, 2));
      }
      
      // Check if meta data is still present
      if (data.results.length > 0 && data.results[0].meta) {
        console.log("\nMeta data is still present in the response (as requested to preserve original data)");
      } else {
        console.log("\nMeta data has been removed from the response");
      }
    } else {
      console.log("Error occurred:");
      console.log(JSON.stringify(data, null, 2));
    }
    
    return this;
  }
};

// Test the categorizeData function
async function optimizedTest() {
  console.log("=== Starting Optimized Transaction Categorization Test ===");
  console.log("This test should be faster than previous versions");
  
  const startTime = Date.now();
  
  try {
    console.log("Calling categorizeData function...");
    await categorizeData(mockReq, mockRes);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    
    console.log(`\n=== Test Completed ===`);
    console.log(`Total processing time: ${duration.toFixed(2)} seconds`);
    
    if (duration < 60) {
      console.log("✅ Performance improvement achieved - processing took less than 1 minute");
    } else {
      console.log("⚠️ Processing took longer than expected");
    }
    
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.error("Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
    console.log(`Processing time before failure: ${duration.toFixed(2)} seconds`);
  }
}

optimizedTest();