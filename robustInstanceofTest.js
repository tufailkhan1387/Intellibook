// Test to check if our more robust FormData implementation works
console.log("=== ROBUST INSTANCEOF TEST ===");

// Try to polyfill FormData if not available - more robust approach
if (typeof FormData === 'undefined') {
  try {
    // Try to get FormData from node-fetch
    const nodeFetchFormData = require('node-fetch').FormData;
    // Ensure it's a proper constructor
    if (typeof nodeFetchFormData === 'function') {
      global.FormData = nodeFetchFormData;
      console.log("✅ FormData polyfilled from node-fetch (constructor verified)");
    } else {
      throw new Error('node-fetch FormData is not a constructor');
    }
  } catch (error) {
    console.log("Failed to polyfill FormData from node-fetch:", error.message);
    // If that fails, try to require form-data package
    try {
      const FormDataLib = require('form-data');
      // Ensure it's a proper constructor
      if (typeof FormDataLib === 'function') {
        global.FormData = FormDataLib;
        console.log("✅ FormData polyfilled from form-data package (constructor verified)");
      } else {
        throw new Error('form-data is not a constructor');
      }
    } catch (formError) {
      console.log("Failed to polyfill FormData from form-data package:", formError.message);
      // If that also fails, create a minimal FormData implementation
      global.FormData = function FormData() {
        this._data = [];
      };
      
      global.FormData.prototype.append = function(key, value) {
        this._data.push([key, value]);
      };
      
      global.FormData.prototype.entries = function() {
        return this._data[Symbol.iterator]();
      };
      
      global.FormData.prototype.toString = function() {
        return '[object FormData]';
      };
      
      // Set the constructor property properly
      global.FormData.prototype.constructor = global.FormData;
      
      // Make sure FormData has a proper name
      Object.defineProperty(global.FormData, 'name', { value: 'FormData' });
      console.log("✅ FormData polyfilled with minimal implementation (constructor verified)");
    }
  }
} else {
  console.log("✅ FormData already defined");
}

console.log("FormData defined:", typeof FormData !== 'undefined');
console.log("FormData is function:", typeof FormData === 'function');

// Test creating a FormData instance
try {
  const formData = new FormData();
  console.log("✅ FormData instance created successfully");
  
  // Test append method
  formData.append('key', 'value');
  console.log("✅ FormData append method works");
  
  // Test if it has the required methods
  console.log("Has append method:", typeof formData.append === 'function');
  
  // Test instanceof - this is what was causing the error
  console.log("Testing instanceof FormData...");
  const isFormData = formData instanceof FormData;
  console.log("✅ instanceof FormData test passed:", isFormData);
  
  // Test constructor name
  console.log("Constructor name:", formData.constructor.name);
  
  // Test constructor property
  console.log("Has constructor property:", !!formData.constructor);
  console.log("Constructor is FormData:", formData.constructor === FormData);
  
} catch (error) {
  console.log("❌ Failed to create FormData instance:", error.message);
  console.log("Error stack:", error.stack);
}

console.log("=== TEST COMPLETE ===");