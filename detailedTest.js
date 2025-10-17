// Detailed test to check the categorization process
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const fetch = require("node-fetch");

// Initialize OpenAI client with explicit fetch
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
  fetch: fetch
});

async function testSingleTransaction() {
  try {
    console.log("Testing single transaction categorization...");
    
    // Read the response.json file
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log(`Found ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      console.log("No transactions found");
      return;
    }
    
    // Take the first transaction
    const transaction = transactions[0];
    console.log("\nProcessing transaction:");
    console.log(`ID: ${transaction.transaction_id}`);
    console.log(`Description: ${transaction.description}`);
    console.log(`Amount: ${transaction.amount}`);
    
    // Create a minimal prompt with only essential transaction data
    const transactionData = {
      id: transaction.transaction_id,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.transaction_type,
      category: transaction.transaction_category
    };

    const userPrompt = `
Categorize this bank transaction with these fields:
- generalCategory (one of: Income, Shopping, Entertainment, Food & Dining, Transportation, Utilities, Health, Savings, Investments, Personal Care, Travel, Business, Education, Gifts & Donations, Miscellaneous)
- subCategory (a specific category under the general category)
- domainDescription (1-2 sentences about the transaction)

Return ONLY this JSON format:
{
  "transaction_id": "${transactionData.id}",
  "generalCategory": "Category",
  "subCategory": "Subcategory",
  "domainDescription": "Description"
}

Transaction:
${JSON.stringify(transactionData, null, 2)}
`;

    console.log("\nSending request to OpenAI...");
    
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a financial transaction categorization expert. Respond with valid JSON only." 
        },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 200
    });

    const text = resp.choices[0]?.message?.content || "";
    console.log("\nOpenAI Response:");
    console.log(text);
    
    if (!text) {
      console.log("❌ Empty response from OpenAI");
      return;
    }
    
    // Try to parse the JSON response
    try {
      const categorization = JSON.parse(text);
      console.log("\n✅ Successfully parsed categorization:");
      console.log(JSON.stringify(categorization, null, 2));
      
      // Merge the categorization with the original transaction
      const enrichedTransaction = {
        ...transaction,
        generalCategory: categorization.generalCategory || "General",
        subCategory: categorization.subCategory || "General → Miscellaneous",
        domainDescription: categorization.domainDescription || "Transaction categorized."
      };
      
      console.log("\n✅ Final enriched transaction:");
      console.log(JSON.stringify(enrichedTransaction, null, 2));
      
    } catch (parseError) {
      console.log("❌ Failed to parse JSON response:");
      console.log("Error:", parseError.message);
    }
    
  } catch (error) {
    console.error("❌ Error processing transaction:", error.message);
    console.error("Error stack:", error.stack);
  }
}

testSingleTransaction();