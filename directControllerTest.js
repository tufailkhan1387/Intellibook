// Direct test of the controller function
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import the controller function directly
const { categorizeData } = require("./controllers/userController");

// Mock Express request and response objects
const mockReq = {};

const mockRes = {
  statusCode: 0,
  data: null,
  
  status: function(code) {
    console.log(`Setting status to: ${code}`);
    this.statusCode = code;
    return this;
  },
  
  json: function(data) {
    console.log(`Sending JSON response with status: ${this.statusCode}`);
    this.data = data;
    
    if (this.statusCode === 200) {
      console.log(`✅ Success! Processed ${data.results.length} transactions`);
      
      // Show first few transactions
      console.log("\nFirst 3 transactions:");
      data.results.slice(0, 3).forEach((txn, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log(`  ID: ${txn.transaction_id}`);
        console.log(`  Description: ${txn.description}`);
        console.log(`  General Category: ${txn.generalCategory || 'MISSING'}`);
        console.log(`  Sub Category: ${txn.subCategory || 'MISSING'}`);
        console.log(`  Domain Description: ${txn.domainDescription || 'MISSING'}`);
      });
      
      // Check if all transactions have been categorized
      const categorizedCount = data.results.filter(txn => 
        txn.generalCategory && txn.subCategory && txn.domainDescription
      ).length;
      
      console.log(`\n📊 Categorization Statistics:`);
      console.log(`  Total transactions: ${data.results.length}`);
      console.log(`  Categorized transactions: ${categorizedCount}`);
      console.log(`  Uncategorized transactions: ${data.results.length - categorizedCount}`);
      
      if (categorizedCount === data.results.length) {
        console.log(`\n✅ All transactions have been successfully categorized!`);
      } else {
        console.log(`\n❌ Some transactions were not categorized properly.`);
      }
      
    } else {
      console.log("❌ Error occurred:");
      console.log(JSON.stringify(data, null, 2));
    }
    
    return this;
  }
};

// Test the categorizeData function
async function testController() {
  console.log("=== Starting Direct Controller Test ===");
  
  try {
    console.log("Calling categorizeData function...");
    await categorizeData(mockReq, mockRes);
    console.log("=== Test Completed ===");
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

testController();