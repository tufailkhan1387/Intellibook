// Test script for the new external API endpoint
console.log("Testing external API endpoint");

console.log("To test the new endpoint, you can make a POST request to:");
console.log("POST /user/getExternalCategorizeData");
console.log("\nThis endpoint will:");
console.log("1. Make a POST request to http://108.142.216.31/api/categorize_transactions");
console.log("2. Return the data received from the external API");

console.log("\nExample curl command:");
console.log('curl -X POST http://localhost:3042/user/getExternalCategorizeData \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"some": "data"}\'');