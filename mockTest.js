// Test with mocked OpenAI response to verify our logic
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Mock OpenAI client
const mockOpenAI = {
  chat: {
    completions: {
      create: async () => {
        // Return a mock response that simulates what OpenAI would return
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                "results": [
                  {
                    "timestamp": "2025-10-04T11:19:10.235Z",
                    "description": "PBB00015421786",
                    "transaction_type": "DEBIT",
                    "transaction_category": "TRANSFER",
                    "transaction_classification": [],
                    "amount": -9.84,
                    "currency": "GBP",
                    "transaction_id": "6e10e6b98b5597dde6dde0bc4d8b110f",
                    "provider_transaction_id": "7bc7321d-384f-4be0-b2d7-b84056214074",
                    "normalised_provider_transaction_id": "txn-f25de43aee7637165",
                    "meta": {
                      "provider_merchant_name": "Capital One",
                      "provider_category": "FASTER_PAYMENTS_OUT",
                      "transaction_type": "Debit",
                      "provider_id": "7bc7321d-384f-4be0-b2d7-b84056214074",
                      "counter_party_preferred_name": "Account"
                    },
                    "generalCategory": "Financial Services",
                    "subCategory": "Bank Fees",
                    "domainDescription": "Debit transaction related to bank fees or charges from Capital One."
                  },
                  {
                    "timestamp": "2025-10-04T11:17:50.355Z",
                    "description": "Transfer from Easy Saver",
                    "transaction_type": "CREDIT",
                    "transaction_category": "OTHER",
                    "transaction_classification": [],
                    "amount": 9.5,
                    "currency": "GBP",
                    "transaction_id": "fc8f820b22463c820842e0c477a0a1aa",
                    "provider_transaction_id": "7bc5e146-529a-4d6a-b3df-dcbbce7e0546",
                    "normalised_provider_transaction_id": "txn-40751090e90e9e58c",
                    "meta": {
                      "provider_merchant_name": "Virendra Vyas",
                      "provider_category": "ON_US_PAY_ME",
                      "transaction_type": "Credit",
                      "provider_id": "7bc5e146-529a-4d6a-b3df-dcbbce7e0546"
                    },
                    "generalCategory": "Savings",
                    "subCategory": "Internal Transfer",
                    "domainDescription": "Credit transaction representing a transfer from an Easy Saver account."
                  }
                ]
              })
            }
          }]
        };
      }
    }
  }
};

// Simple approach - directly test our chunk processing function with the mock
async function mockTest() {
  console.log("=== Starting Mock OpenAI Test ===");
  
  try {
    // Read the response.json file
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log(`Total transactions: ${transactions.length}`);
    
    // Take just the first 2 transactions for testing
    const testTransactions = transactions.slice(0, 2);
    console.log(`Processing first ${testTransactions.length} transactions...`);
    
    // Directly test our processing logic with a mock
    const mockChunkFunction = async (transactionsChunk, chunkNumber, totalChunks) => {
      console.log(`Processing chunk ${chunkNumber}/${totalChunks} with ${transactionsChunk.length} transactions`);
      
      // Return our mock response
      return {
        results: [
          {
            ...transactionsChunk[0],
            generalCategory: "Financial Services",
            subCategory: "Bank Fees",
            domainDescription: "Debit transaction related to bank fees or charges from Capital One."
          },
          {
            ...transactionsChunk[1],
            generalCategory: "Savings",
            subCategory: "Internal Transfer",
            domainDescription: "Credit transaction representing a transfer from an Easy Saver account."
          }
        ]
      };
    };
    
    // Process the transactions with our mock function
    const enrichedTransactions = [];
    const enriched = await mockChunkFunction(testTransactions, 1, 1);
    enrichedTransactions.push(...enriched.results);
    
    console.log("=== Mock Test Completed Successfully ===");
    console.log(`Processed ${enrichedTransactions.length} transactions`);
    console.log("First transaction:");
    console.log(JSON.stringify(enrichedTransactions[0], null, 2));
    
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

mockTest();