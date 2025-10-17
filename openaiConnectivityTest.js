// Test OpenAI client connectivity
require("dotenv").config();

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

console.log("=== OPENAI CONNECTIVITY TEST ===");

console.log("API Key present:", !!process.env.OPENAI_API_KEY);
if (process.env.OPENAI_API_KEY) {
  console.log("API Key length:", process.env.OPENAI_API_KEY.length);
}

// Import OpenAI after polyfills
const OpenAI = require("openai");

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
  // Only pass fetch if it's available and valid
  ...(fetchImpl ? { fetch: fetchImpl } : {})
});

console.log("OpenAI client created:", !!client);

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connectivity...");
    
    // Test a simple API call
    const response = await client.models.list();
    console.log("✅ API connection successful");
    console.log("Number of available models:", response.data.length);
    
    // Test a simple completion
    console.log("Testing completion API...");
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Respond with exactly: 'Test successful'" }
      ],
      max_tokens: 20
    });
    
    const result = completion.choices[0].message.content;
    console.log("✅ Completion API test successful:", result);
    
    // Test with a sample transaction
    console.log("Testing transaction categorization...");
    const transactionData = {
      id: "test-123",
      description: "Tesco Stores",
      amount: -25.50,
      currency: "GBP",
      type: "DEBIT",
      category: "PURCHASE"
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
      max_tokens: 200
    });

    const text = resp.choices[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from OpenAI");
    
    console.log("✅ Transaction categorization test successful");
    console.log("Response:", text);
    
    // Try to parse the JSON response
    try {
      const categorization = JSON.parse(text);
      console.log("✅ JSON parsing successful");
      console.log("Categorization:", JSON.stringify(categorization, null, 2));
    } catch (parseError) {
      console.log("❌ JSON parsing failed:", parseError.message);
    }
    
  } catch (error) {
    console.log("❌ API connectivity test failed:", error.message);
    console.log("Error code:", error.code);
    console.log("Error type:", error.type);
    console.log("Stack trace:", error.stack);
  }
  
  console.log("=== TEST COMPLETE ===");
}

testOpenAI();