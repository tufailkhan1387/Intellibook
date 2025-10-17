// Server diagnostics script to check OpenAI connectivity
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const fetch = require("node-fetch");

console.log("=== SERVER DIAGNOSTICS ===");

// Check 1: Environment variables
console.log("\n1. Environment Variables Check:");
console.log("   OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log("   API Key length:", process.env.OPENAI_API_KEY.length);
  console.log("   API Key starts with:", process.env.OPENAI_API_KEY.substring(0, 10) + "...");
}

// Check 2: File access
console.log("\n2. File Access Check:");
const filePath = path.join(__dirname, "response.json");
console.log("   response.json exists:", fs.existsSync(filePath));
if (fs.existsSync(filePath)) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    console.log("   File size:", fileContent.length, "characters");
    const jsonData = JSON.parse(fileContent);
    console.log("   JSON parsing successful");
    console.log("   Number of transactions:", Array.isArray(jsonData.results) ? jsonData.results.length : 0);
  } catch (error) {
    console.log("   ❌ File read error:", error.message);
  }
}

// Check 3: OpenAI client initialization
console.log("\n3. OpenAI Client Initialization:");
let client;
try {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "missing-key",
    fetch: fetch
  });
  console.log("   ✅ OpenAI client created successfully");
} catch (error) {
  console.log("   ❌ OpenAI client creation failed:", error.message);
  process.exit(1);
}

// Check 4: OpenAI API connectivity
console.log("\n4. OpenAI API Connectivity Test:");
async function testOpenAIConnectivity() {
  try {
    console.log("   Testing API connection...");
    const response = await client.models.list();
    console.log("   ✅ API connection successful");
    console.log("   Number of available models:", response.data.length);
    
    // Test a simple completion
    console.log("   Testing completion API...");
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Respond with exactly: 'Test successful'" }
      ],
      max_tokens: 20
    });
    
    const result = completion.choices[0].message.content;
    console.log("   ✅ Completion API test successful:", result);
    
  } catch (error) {
    console.log("   ❌ API connectivity test failed:", error.message);
    console.log("   Error code:", error.code);
    console.log("   Error type:", error.type);
    
    // Check for common issues
    if (error.message.includes("401")) {
      console.log("   🔍 This suggests an API key issue");
    }
    if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.log("   🔍 This suggests a network connectivity issue");
    }
    if (error.message.includes("403")) {
      console.log("   🔍 This suggests a permissions or firewall issue");
    }
  }
}

// Check 5: Test single transaction categorization
console.log("\n5. Transaction Categorization Test:");
async function testTransactionCategorization() {
  try {
    if (!fs.existsSync(filePath)) {
      console.log("   ❌ response.json file not found");
      return;
    }
    
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const transactions = Array.isArray(original.results) ? original.results : [];
    
    if (transactions.length === 0) {
      console.log("   ❌ No transactions found in response.json");
      return;
    }
    
    console.log("   Processing first transaction...");
    const transaction = transactions[0];
    
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

    console.log("   Sending request to OpenAI...");
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
    if (!text) {
      console.log("   ❌ Empty response from OpenAI");
      return;
    }
    
    console.log("   ✅ Received response from OpenAI");
    const categorization = JSON.parse(text);
    console.log("   ✅ Successfully parsed categorization:");
    console.log("      General Category:", categorization.generalCategory);
    console.log("      Sub Category:", categorization.subCategory);
    
  } catch (error) {
    console.log("   ❌ Transaction categorization test failed:", error.message);
    console.log("   Error stack:", error.stack);
  }
}

// Run all tests
async function runAllTests() {
  await testOpenAIConnectivity();
  await testTransactionCategorization();
  console.log("\n=== DIAGNOSTICS COMPLETE ===");
}

runAllTests();