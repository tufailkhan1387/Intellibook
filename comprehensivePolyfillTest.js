// Comprehensive test to check all polyfills
console.log("=== COMPREHENSIVE POLYFILL TEST ===");

// Test Headers
console.log("Testing Headers...");
try {
  if (typeof Headers === 'undefined') {
    console.log("❌ Headers is not defined");
  } else {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test'
    });
    console.log("✅ Headers working correctly");
    console.log("  Content-Type:", headers.get('Content-Type'));
  }
} catch (error) {
  console.log("❌ Headers test failed:", error.message);
}

// Test FormData
console.log("\nTesting FormData...");
try {
  if (typeof FormData === 'undefined') {
    console.log("❌ FormData is not defined");
  } else {
    const formData = new FormData();
    formData.append('key', 'value');
    console.log("✅ FormData working correctly");
  }
} catch (error) {
  console.log("❌ FormData test failed:", error.message);
}

// Test fetch
console.log("\nTesting fetch...");
try {
  if (typeof fetch !== 'undefined') {
    console.log("✅ Global fetch is available");
  } else {
    console.log("⚠️ Global fetch is not available (this is OK if node-fetch is used)");
  }
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