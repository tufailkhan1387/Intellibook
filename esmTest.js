// Test to check if our fetch implementation works with different node-fetch versions
console.log("=== ESM/CJS COMPATIBILITY TEST ===");

let fetchImpl;
let methodUsed = "";

try {
  // Try to require node-fetch (CommonJS)
  fetchImpl = require('node-fetch');
  methodUsed = "CommonJS require";
  console.log("✅ Successfully loaded node-fetch using CommonJS");
} catch (error) {
  console.log("❌ Failed to load node-fetch using CommonJS:", error.message);
  try {
    // Try to use global fetch if available
    fetchImpl = fetch;
    methodUsed = "Global fetch";
    console.log("✅ Successfully using global fetch");
  } catch (globalError) {
    console.log("❌ Failed to use global fetch:", globalError.message);
    fetchImpl = undefined;
    methodUsed = "None";
    console.log("⚠️ No fetch implementation available");
  }
}

console.log("Method used:", methodUsed);
console.log("Fetch implementation:", typeof fetchImpl);

if (fetchImpl) {
  console.log("✅ Fetch is ready for OpenAI client");
} else {
  console.log("⚠️ OpenAI client will use built-in fetch or fail");
}

console.log("=== TEST COMPLETE ===");