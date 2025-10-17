// Simple test to verify the endpoint logic without starting the full server
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Copy the core logic from userController
async function categorizeDataLogic() {
  try {
    const filePath = path.join(__dirname, "response.json");
    console.log("Reading file from:", filePath);
    
    const fileContent = fs.readFileSync(filePath, "utf8");
    console.log("File read successfully, size:", fileContent.length);
    
    const original = JSON.parse(fileContent);
    console.log("JSON parsed successfully");

    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log("Number of transactions:", transactions.length);
    
    if (transactions.length === 0) {
      return {
        results: [],
        status: original.status ?? "Succeeded"
      };
    }

    // For testing, let's just return the first 3 transactions with some dummy enrichment
    const testTransactions = transactions.slice(0, 3);
    const enrichedTransactions = testTransactions.map(txn => ({
      ...txn,
      generalCategory: "Test Category",
      subCategory: "Test Subcategory",
      domainDescription: "This is a test description for the transaction."
    }));

    return {
      results: enrichedTransactions,
      status: original.status ?? "Succeeded"
    };

  } catch (error) {
    console.error("Error in categorizeDataLogic:", error);
    return {
      results: [],
      status: "Failed",
      error: error.message
    };
  }
}

// Test the function
async function test() {
  console.log("Starting test...");
  const result = await categorizeDataLogic();
  console.log("Test result:");
  console.log(JSON.stringify(result, null, 2));
}

test();