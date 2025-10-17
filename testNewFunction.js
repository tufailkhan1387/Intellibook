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

// ---- OUR NEW SIMPLIFIED FUNCTION ----
async function enrichChunkWithOpenAI(transactionsChunk, chunkNumber, totalChunks) {
  // Create a simplified prompt for each transaction
  const simplifiedTransactions = transactionsChunk.map(txn => ({
    id: txn.transaction_id,
    description: txn.description,
    amount: txn.amount,
    currency: txn.currency,
    type: txn.transaction_type,
    category: txn.transaction_category,
    merchant: txn.meta?.provider_merchant_name || "Unknown"
  }));

  const userPrompt = `
Categorize these bank transactions with the following fields for each:
- generalCategory (one of: Income, Shopping, Entertainment, Food & Dining, Transportation, Utilities, Health, Savings, Investments, Personal Care, Travel, Business, Education, Gifts & Donations, Miscellaneous)
- subCategory (a more specific category under the general category)
- domainDescription (1-2 sentences describing the transaction)

Return ONLY a JSON array with one object per transaction, preserving the transaction_id.

Transactions:
${JSON.stringify(simplifiedTransactions, null, 2)}

Response format example:
[
  {
    "transaction_id": "6e10e6b98b5597dde6dde0bc4d8b110f",
    "generalCategory": "Transportation",
    "subCategory": "Public Transit",
    "domainDescription": "Payment for public transportation services."
  }
]
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
      max_tokens: 4000
    });

    const text = resp.choices[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from OpenAI");
    
    // Clean up the response text to ensure it's valid JSON
    let cleanedText = text.trim();
    
    // Try to parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      console.error("JSON parsing failed, attempting to extract JSON from response");
      console.error("Raw response:", text);
      
      // Try to find JSON array in the response
      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
        try {
          parsed = JSON.parse(jsonString);
        } catch (extractError) {
          throw new Error(`Failed to parse JSON from OpenAI response: ${parseError.message}. Attempted extraction also failed: ${extractError.message}`);
        }
      } else {
        throw new Error(`Failed to parse JSON from OpenAI response: ${parseError.message}`);
      }
    }

    // Validate the parsed response structure
    if (!Array.isArray(parsed)) {
      throw new Error("OpenAI response is not a valid array");
    }

    // Merge the categorization results back with the original transactions
    const enrichedTransactions = transactionsChunk.map(transaction => {
      const categorization = parsed.find(cat => cat.transaction_id === transaction.transaction_id);
      
      return {
        ...transaction,
        generalCategory: categorization?.generalCategory || "General",
        subCategory: categorization?.subCategory || "General → Miscellaneous",
        domainDescription: categorization?.domainDescription || "Unable to categorize transaction."
      };
    });

    return { results: enrichedTransactions };
  } catch (error) {
    console.error(`Error in enrichChunkWithOpenAI (chunk ${chunkNumber}/${totalChunks}):`, error);
    throw error;
  }
}

// ---- TEST FUNCTION ----
async function testNewFunction() {
  try {
    // Read sample transactions from response.json
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const transactions = Array.isArray(original.results) ? original.results : [];
    if (transactions.length === 0) {
      console.log("No transactions found in response.json");
      return;
    }
    
    // Take just the first 3 transactions for testing
    const testTransactions = transactions.slice(0, 3);
    console.log(`Processing ${testTransactions.length} transactions...`);
    
    // Process the transactions
    const result = await enrichChunkWithOpenAI(testTransactions, 1, 1);
    
    console.log("Success! Here are the enriched transactions:");
    console.log(JSON.stringify(result.results, null, 2));
    
    // Save to file
    const outputPath = path.join(__dirname, "test_enriched.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Results saved to ${outputPath}`);
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Run the test
testNewFunction();