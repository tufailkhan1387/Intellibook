// Test to check if FormData is properly defined
console.log("=== FORMDATA POLYFILL TEST ===");

console.log("FormData defined before:", typeof FormData !== 'undefined');

// Try to polyfill FormData if not available
if (typeof FormData === 'undefined') {
  try {
    // Try to get FormData from node-fetch
    global.FormData = require('node-fetch').FormData;
    console.log("✅ FormData polyfilled from node-fetch");
  } catch (error) {
    console.log("❌ Failed to polyfill FormData from node-fetch:", error.message);
    // If that fails, try to require form-data package
    try {
      const FormDataLib = require('form-data');
      global.FormData = FormDataLib;
      console.log("✅ FormData polyfilled from form-data package");
    } catch (formError) {
      console.log("❌ Failed to polyfill FormData from form-data package:", formError.message);
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
      console.log("✅ FormData polyfilled with minimal implementation");
    }
  }
} else {
  console.log("✅ FormData already defined");
}

console.log("FormData defined after:", typeof FormData !== 'undefined');

// Test creating a FormData instance
try {
  const formData = new FormData();
  console.log("✅ FormData instance created successfully");
  
  // Test append method
  formData.append('test', 'value');
  console.log("✅ FormData append method works");
  
  // Test if it has the required methods
  console.log("Has append method:", typeof formData.append === 'function');
  
} catch (error) {
  console.log("❌ Failed to create FormData instance:", error.message);
}

console.log("=== TEST COMPLETE ===");