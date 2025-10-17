// Comprehensive test to check instanceof issues
console.log("=== COMPREHENSIVE INSTANCEOF TEST ===");

// Test Headers
console.log("Testing Headers...");
try {
  if (typeof Headers === 'undefined') {
    console.log("Headers is not defined, creating polyfill...");
    
    // Try to get Headers from node-fetch
    try {
      global.Headers = require('node-fetch').Headers;
      console.log("✅ Headers polyfilled from node-fetch");
    } catch (error) {
      console.log("Failed to polyfill Headers from node-fetch:", error.message);
      // Create a minimal Headers implementation
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
      console.log("✅ Headers polyfilled with minimal implementation");
    }
  } else {
    console.log("✅ Headers already defined");
  }
  
  // Test Headers instanceof
  const headers = new Headers();
  console.log("Testing instanceof Headers...");
  const isHeaders = headers instanceof Headers;
  console.log("✅ instanceof Headers test passed:", isHeaders);
  
} catch (error) {
  console.log("❌ Headers test failed:", error.message);
}

// Test FormData
console.log("\nTesting FormData...");
try {
  if (typeof FormData === 'undefined') {
    console.log("FormData is not defined, creating polyfill...");
    
    // Try to get FormData from node-fetch
    try {
      global.FormData = require('node-fetch').FormData;
      console.log("✅ FormData polyfilled from node-fetch");
    } catch (error) {
      console.log("Failed to polyfill FormData from node-fetch:", error.message);
      // Try to require form-data package
      try {
        const FormDataLib = require('form-data');
        global.FormData = FormDataLib;
        console.log("✅ FormData polyfilled from form-data package");
      } catch (formError) {
        console.log("Failed to polyfill FormData from form-data package:", formError.message);
        // Create a minimal FormData implementation
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
          
          // Add a toString method to avoid instanceof issues
          toString() {
            return '[object FormData]';
          }
        };
        
        // Make sure FormData has a proper constructor name
        Object.defineProperty(global.FormData, 'name', { value: 'FormData' });
        console.log("✅ FormData polyfilled with minimal implementation");
      }
    }
  } else {
    console.log("✅ FormData already defined");
  }
  
  // Test FormData instanceof
  const formData = new FormData();
  console.log("Testing instanceof FormData...");
  const isFormData = formData instanceof FormData;
  console.log("✅ instanceof FormData test passed:", isFormData);
  
  // Test constructor name
  console.log("FormData constructor name:", formData.constructor.name);
  
} catch (error) {
  console.log("❌ FormData test failed:", error.message);
  console.log("Error stack:", error.stack);
}

console.log("\n=== OPENAI CLIENT TEST ===");
try {
  const OpenAI = require('openai');
  
  // Try to create OpenAI client
  const client = new OpenAI({
    apiKey: 'test-key'
  });
  
  console.log("✅ OpenAI client created successfully");
  console.log("Client type:", typeof client);
  
} catch (error) {
  console.log("❌ OpenAI client creation failed:", error.message);
}

console.log("\n=== SIMULATING TRANSACTION PROCESSING ===");
try {
  // Simulate what happens in processSingleTransaction
  const transactionData = {
    id: "test-123",
    description: "Test Transaction",
    amount: -10.00,
    currency: "USD",
    type: "DEBIT",
    category: "TEST"
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

  console.log("✅ Transaction prompt created successfully");
  
} catch (error) {
  console.log("❌ Transaction processing simulation failed:", error.message);
}

console.log("\n=== TEST COMPLETE ===");