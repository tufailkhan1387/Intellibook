// Simulate exactly what the controller does
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Ensure we have all necessary globals for OpenAI client
// Try to polyfill Headers if not available
if (typeof Headers === 'undefined') {
  try {
    // Try to get Headers from node-fetch
    global.Headers = require('node-fetch').Headers;
  } catch (error) {
    // If that fails, create a minimal Headers implementation
    global.Headers = class Headers {
      constructor(init) {
        this.headers = {};
        if (init) {
          if (init instanceof Headers) {
            this.headers = { ...init.headers };
          } else if (typeof init === 'object') {
            for (const key in init) {
              this.headers[key.toLowerCase()] = init[key];
            }
          }
        }
      }
      
      append(name, value) {
        this.headers[name.toLowerCase()] = value;
      }
      
      set(name, value) {
        this.headers[name.toLowerCase()] = value;
      }
      
      get(name) {
        return this.headers[name.toLowerCase()];
      }
      
      has(name) {
        return name.toLowerCase() in this.headers;
      }
      
      delete(name) {
        delete this.headers[name.toLowerCase()];
      }
    };
  }
}

// Try to polyfill FormData if not available
if (typeof FormData === 'undefined') {
  try {
    // Try to get FormData from node-fetch
    global.FormData = require('node-fetch').FormData;
  } catch (error) {
    // If that fails, try to require form-data package
    try {
      const FormDataLib = require('form-data');
      global.FormData = FormDataLib;
    } catch (formError) {
      // If that also fails, create a minimal FormData implementation
      global.FormData = class FormData {
        constructor() {
          this._data = [];
        }
        
        append(key, value) {
          this._data.push([key, value]);
        }
        
        // Add other methods that might be needed
        entries() {
          return this._data[Symbol.iterator]();
        }
      };
    }
  }
}

// Simple approach: try to get fetch from different sources
let fetchImpl;
try {
  // Try to require node-fetch (CommonJS)
  fetchImpl = require('node-fetch');
} catch (error) {
  try {
    // Try to use global fetch if available
    fetchImpl = fetch;
  } catch (globalError) {
    // If neither works, we'll handle this in the OpenAI initialization
    fetchImpl = undefined;
  }
}

// Import OpenAI after polyfills
const OpenAI = require("openai");

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
  // Only pass fetch if it's available and valid
  ...(fetchImpl ? { fetch: fetchImpl } : {})
});

console.log("=== CONTROLLER SIMULATION TEST ===");

async function processSingleTransaction(transaction) {
  try {
    console.log(`Processing transaction ${transaction.transaction_id}...`);
    
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
      max_tokens: 200 // Reduced for faster response
    });

    const text = resp.choices[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from OpenAI");
    
    console.log(`Received response for transaction ${transaction.transaction_id}`);
    
    // Parse the JSON response
    const categorization = JSON.parse(text);
    
    // Merge the categorization with the original transaction
    const result = {
      ...transaction,
      generalCategory: categorization.generalCategory || "General",
      subCategory: categorization.subCategory || "General → Miscellaneous",
      domainDescription: categorization.domainDescription || "Transaction categorized."
    };
    
    console.log(`Successfully processed transaction ${transaction.transaction_id}`);
    return result;
  } catch (error) {
    console.error(`Error processing transaction ${transaction.transaction_id}:`, error.message);
    // Return transaction with default categorization on error
    return {
      ...transaction,
      generalCategory: "General",
      subCategory: "General → Miscellaneous",
      domainDescription: "Unable to categorize transaction."
    };
  }
}

async function testControllerLogic() {
  try {
    // Read the response.json file
    const filePath = path.join(__dirname, "response.json");
    console.log("Reading file from:", filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log("❌ response.json file not found");
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, "utf8");
    console.log("File read successfully, size:", fileContent.length);
    
    const original = JSON.parse(fileContent);
    console.log("JSON parsed successfully");

    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log("Number of transactions:", transactions.length);
    
    if (transactions.length === 0) {
      console.log("No transactions found");
      return;
    }
    
    // Process just the first transaction to test
    console.log("Processing first transaction...");
    const result = await processSingleTransaction(transactions[0]);
    
    console.log("✅ Transaction processing completed");
    console.log("Result:", JSON.stringify(result, null, 2));
    
    // Check if it was properly categorized
    if (result.generalCategory && result.generalCategory !== "General" &&
        result.subCategory && result.subCategory !== "General → Miscellaneous") {
      console.log("✅ Transaction was properly categorized");
    } else {
      console.log("❌ Transaction was not properly categorized");
      console.log("General Category:", result.generalCategory);
      console.log("Sub Category:", result.subCategory);
      console.log("Domain Description:", result.domainDescription);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
  }
  
  console.log("=== TEST COMPLETE ===");
}

testControllerLogic();