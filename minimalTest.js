require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

async function minimalTest() {
  try {
    console.log("Testing with minimal transaction data...");
    
    // Very simple transaction data
    const simpleTransaction = {
      transaction_id: "test-123",
      description: "Tesco Stores",
      amount: -25.50,
      currency: "GBP",
      transaction_type: "DEBIT",
      transaction_category: "PURCHASE",
      meta: {
        provider_merchant_name: "Tesco"
      }
    };
    
    const simplifiedTransaction = {
      id: simpleTransaction.transaction_id,
      description: simpleTransaction.description,
      amount: simpleTransaction.amount,
      currency: simpleTransaction.currency,
      type: simpleTransaction.transaction_type,
      category: simpleTransaction.transaction_category,
      merchant: simpleTransaction.meta.provider_merchant_name
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

    const response = await client.chat.completions.create({
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
    
    const result = response.choices[0].message.content;
    console.log("Response received:");
    console.log(result);
    
    // Try to parse the result
    try {
      const parsed = JSON.parse(result);
      console.log("Parsed result:");
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError.message);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

minimalTest();