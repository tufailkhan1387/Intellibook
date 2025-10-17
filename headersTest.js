// Test to check if Headers is properly defined
console.log("=== HEADERS POLYFILL TEST ===");

console.log("Headers defined before:", typeof Headers !== 'undefined');

// Ensure we have all necessary globals for OpenAI client
// Try to polyfill Headers if not available
if (typeof Headers === 'undefined') {
  try {
    // Try to get Headers from node-fetch
    global.Headers = require('node-fetch').Headers;
    console.log("✅ Headers polyfilled from node-fetch");
  } catch (error) {
    console.log("❌ Failed to polyfill Headers from node-fetch:", error.message);
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
    console.log("✅ Headers polyfilled with minimal implementation");
  }
} else {
  console.log("✅ Headers already defined");
}

console.log("Headers defined after:", typeof Headers !== 'undefined');

// Test creating a Headers instance
try {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-key'
  });
  
  console.log("✅ Headers instance created successfully");
  console.log("Content-Type:", headers.get('Content-Type'));
  console.log("Authorization:", headers.get('Authorization'));
  
} catch (error) {
  console.log("❌ Failed to create Headers instance:", error.message);
}

console.log("=== TEST COMPLETE ===");