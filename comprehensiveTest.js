// Comprehensive test for the transaction categorization functionality
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import functions from userController
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
      console.log("First transaction sample:");
      if (data.results.length > 0) {
        console.log(JSON.stringify(data.results[0], null, 2));
      }
    } else {
      console.log("Error occurred:");
      console.log(JSON.stringify(data, null, 2));
    }
    
    return this;
  }
};

// Test the categorizeData function
async function comprehensiveTest() {
  console.log("=== Starting Comprehensive Transaction Categorization Test ===");
  
  try {
    console.log("Calling categorizeData function...");
    await categorizeData(mockReq, mockRes);
    console.log("=== Test Completed ===");
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

comprehensiveTest();