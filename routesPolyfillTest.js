// Test polyfills in routes context
console.log("=== ROUTES POLYFILL TEST ===");

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
} catch (error) {
  console.log("❌ Headers test failed:", error.message);
}

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
        };
        console.log("✅ FormData polyfilled with minimal implementation");
      }
    }
  } else {
    console.log("✅ FormData already defined");
  }
} catch (error) {
  console.log("❌ FormData test failed:", error.message);
}

console.log("\nTesting fetch...");
try {
  let fetchImpl;
  try {
    // Try to require node-fetch (CommonJS)
    fetchImpl = require('node-fetch');
    console.log("✅ node-fetch loaded successfully");
  } catch (error) {
    try {
      // Try to use global fetch if available
      fetchImpl = fetch;
      console.log("✅ Global fetch is available");
    } catch (globalError) {
      fetchImpl = undefined;
      console.log("⚠️ No fetch implementation available");
    }
  }
  
  console.log("Fetch implementation:", typeof fetchImpl);
} catch (error) {
  console.log("❌ Fetch test failed:", error.message);
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

console.log("\n=== TEST COMPLETE ===");