// Direct test of the optimized single transaction processing
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import OpenAI directly
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

// Copy the single transaction processing function
async function enrichSingleTransaction(transaction) {
  // Create a simplified version of the transaction without meta data to reduce payload size
  const simplifiedTransaction = {
    timestamp: transaction.timestamp,
    description: transaction.description,
    transaction_type: transaction.transaction_type,
    transaction_category: transaction.transaction_category,
    amount: transaction.amount,
    currency: transaction.currency,
    transaction_id: transaction.transaction_id
  };

  const userPrompt = `
Categorize this bank transaction with the following fields:
- generalCategory (one of: Income, Shopping, Entertainment, Food & Dining, Transportation, Utilities, Health, Savings, Investments, Personal Care, Travel, Business, Education, Gifts & Donations, Miscellaneous)
- subCategory (a more specific category under the general category)
- domainDescription (1-2 sentences describing the transaction)

Return ONLY a JSON object with these three fields plus the transaction_id.

Transaction:
${JSON.stringify(simplifiedTransaction, null, 2)}

Response format example:
{
  "transaction_id": "test-123",
  "generalCategory": "Food & Dining",
  "subCategory": "Groceries",
  "domainDescription": "Purchase of groceries from Tesco supermarket."
}
`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a financial transaction categorization expert. You analyze bank transactions and categorize them accurately. Always respond with valid JSON only." 
        },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 300, // Very small token limit for speed
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const text = resp.choices[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from OpenAI");
    
    // Parse the JSON response
    const categorization = JSON.parse(text);
    
    // Merge the categorization with the original transaction
    return {
      ...transaction,
      generalCategory: categorization.generalCategory || "General",
      subCategory: categorization.subCategory || "General → Miscellaneous",
      domainDescription: categorization.domainDescription || "Unable to categorize transaction."
    };
  } catch (error) {
    console.error(`Error processing transaction ${transaction.transaction_id}:`, error);
    throw error;
  }
}

// Test with a few transactions
async function directTest() {
  console.log("=== Starting Direct Transaction Processing Test ===");
  
  try {
    // Read sample transactions
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log(`Total transactions available: ${transactions.length}`);
    
    // Take just the first 3 transactions for testing
    const testTransactions = transactions.slice(0, 3);
    console.log(`Processing first ${testTransactions.length} transactions...`);
    
    const startTime = Date.now();
    
    // Process transactions in parallel
    const promises = testTransactions.map((transaction, index) => 
      enrichSingleTransaction(transaction)
    );
    
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    
    console.log(`\n=== Test Completed Successfully ===`);
    console.log(`Processing time: ${duration.toFixed(2)} seconds`);
    console.log(`Processed ${results.length} transactions`);
    
    console.log("\nResults:");
    results.forEach((result, index) => {
      console.log(`\nTransaction ${index + 1}:`);
      console.log(`  ID: ${result.transaction_id}`);
      console.log(`  Description: ${result.description}`);
      console.log(`  Category: ${result.generalCategory} → ${result.subCategory}`);
      console.log(`  Description: ${result.domainDescription}`);
    });
    
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error("Stack trace:", error.stack);
  }
}

directTest();