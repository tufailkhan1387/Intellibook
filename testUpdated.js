require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { categorizeData } = require("./controllers/userController");

// Mock Express request and response objects
const mockReq = {};
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.data = data;
    console.log(`Status: ${this.statusCode}`);
    console.log("Response data:");
    console.log(JSON.stringify(data, null, 2));
    return this;
  }
};

// Test the categorizeData function
async function testCategorizeData() {
  console.log("Testing categorizeData function...");
  try {
    await categorizeData(mockReq, mockRes);
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error.message);
  }
}

testCategorizeData();