// Test script to check if the categorization function works
require("dotenv").config();
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
      
      // Check if categorization fields are present
      if (data.results.length > 0) {
        const firstTxn = data.results[0];
        if (firstTxn.generalCategory && firstTxn.subCategory && firstTxn.domainDescription) {
          console.log("\n✅ Categorization is working - fields are present!");
        } else {
          console.log("\n❌ Categorization is not working - missing fields!");
          console.log("Available fields:", Object.keys(firstTxn));
        }
      }
    } else {
      console.log("Error occurred:");
      console.log(JSON.stringify(data, null, 2));
    }
    
    return this;
  }
};

// Test the categorizeData function
async function testCategorization() {
  console.log("=== Starting Categorization Test ===");
  
  try {
    console.log("Calling categorizeData function...");
    await categorizeData(mockReq, mockRes);
    console.log("=== Test Completed ===");
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

testCategorization();