// Test to simulate server environment issues
require("dotenv").config();
const fs = require("fs");
const path = require("path");

console.log("=== SERVER ENVIRONMENT TEST ===");

// Check current working directory
console.log("Current working directory:", process.cwd());

// Check if .env file exists in current directory
console.log(".env file exists in current directory:", fs.existsSync(".env"));

// Check if .env file exists in parent directory
console.log(".env file exists in parent directory:", fs.existsSync("../.env"));

// List files in current directory
console.log("Files in current directory:", fs.readdirSync("."));

// Try to read .env file directly
try {
  if (fs.existsSync(".env")) {
    const envContent = fs.readFileSync(".env", "utf8");
    console.log(".env file size:", envContent.length, "characters");
    
    // Check if OPENAI_API_KEY is in the file
    const hasOpenAIKey = envContent.includes("OPENAI_API_KEY");
    console.log("OPENAI_API_KEY present in .env:", hasOpenAIKey);
    
    if (hasOpenAIKey) {
      const keyLine = envContent.split('\n').find(line => line.includes('OPENAI_API_KEY'));
      if (keyLine) {
        const key = keyLine.split('=')[1];
        console.log("API Key length:", key ? key.trim().length : 0);
      }
    }
  }
} catch (error) {
  console.log("Error reading .env file:", error.message);
}

// Check environment variables
console.log("\nEnvironment Variables:");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? `Present (${process.env.OPENAI_API_KEY.length} chars)` : "Not set");
console.log("NODE_ENV:", process.env.NODE_ENV || "Not set");

// Check if we can load the response.json file
console.log("\nResponse.json check:");
const responsePath = path.join(__dirname, "response.json");
console.log("response.json path:", responsePath);
console.log("response.json exists:", fs.existsSync(responsePath));

if (fs.existsSync(responsePath)) {
  try {
    const responseContent = fs.readFileSync(responsePath, "utf8");
    console.log("response.json size:", responseContent.length, "characters");
    const jsonData = JSON.parse(responseContent);
    console.log("Valid JSON:", Array.isArray(jsonData.results));
    console.log("Number of transactions:", Array.isArray(jsonData.results) ? jsonData.results.length : 0);
  } catch (error) {
    console.log("Error reading response.json:", error.message);
  }
}

console.log("\n=== TEST COMPLETE ===");