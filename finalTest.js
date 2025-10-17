require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import the OpenAI function directly
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

// ---- OUR UPDATED FUNCTION ----
async function enrichChunkWithOpenAI(transactionsChunk, chunkNumber, totalChunks) {
  try {
    // Process each transaction individually to avoid complex JSON parsing issues
    const enrichedTransactions = [];
    
    for (let i = 0; i < transactionsChunk.length; i++) {
      const transaction = transactionsChunk[i];
      
      // Create a simplified representation of the transaction
      const simplifiedTransaction = {
        id: transaction.transaction_id,
        description: transaction.description,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.transaction_type,
        category: transaction.transaction_category,
        merchant: transaction.meta?.provider_merchant_name || "Unknown"
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
          max_tokens: 500
        });

        const text = resp.choices[0]?.message?.content || "";
        if (!text) throw new Error("Empty response from OpenAI");
        
        // Parse the JSON response
        const categorization = JSON.parse(text);
        
        // Merge the categorization with the original transaction
        const enrichedTransaction = {
          ...transaction,
          generalCategory: categorization.generalCategory || "General",
          subCategory: categorization.subCategory || "General → Miscellaneous",
          domainDescription: categorization.domainDescription || "Unable to categorize transaction."
        };
        
        enrichedTransactions.push(enrichedTransaction);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (transactionError) {
        console.error(`Error processing transaction ${transaction.transaction_id}:`, transactionError.message);
        
        // Add the transaction with default categorization
        enrichedTransactions.push({
          ...transaction,
          generalCategory: "General",
          subCategory: "General → Miscellaneous",
          domainDescription: "Unable to categorize transaction due to processing error."
        });
      }
    }
    
    return { results: enrichedTransactions };
  } catch (error) {
    console.error(`Error in enrichChunkWithOpenAI (chunk ${chunkNumber}/${totalChunks}):`, error);
    throw error;
  }
}

// ---- TEST FUNCTION ----
async function finalTest() {
  try {
    // Read sample transactions from response.json
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const transactions = Array.isArray(original.results) ? original.results : [];
    if (transactions.length === 0) {
      console.log("No transactions found in response.json");
      return;
    }
    
    // Take just the first 2 transactions for testing
    const testTransactions = transactions.slice(0, 2);
    console.log(`Processing ${testTransactions.length} transactions...`);
    
    // Process the transactions
    const result = await enrichChunkWithOpenAI(testTransactions, 1, 1);
    
    console.log("Success! Here are the enriched transactions:");
    console.log(JSON.stringify(result.results, null, 2));
    
    // Save to file
    const outputPath = path.join(__dirname, "final_test_enriched.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Results saved to ${outputPath}`);
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run the test
finalTest();