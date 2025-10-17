const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

// Test if OpenAI module can be imported and initialized
console.log("Testing OpenAI module...");

try {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'test-key',
    fetch: fetch // Explicitly pass fetch implementation
  });
  console.log("OpenAI module imported successfully!");
  console.log("OpenAI instance created:", !!openai);
} catch (error) {
  console.error("Error initializing OpenAI:", error.message);
}