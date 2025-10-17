require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

// Test if we can create an OpenAI client
try {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "missing-key",
    fetch: fetch // Explicitly pass fetch implementation
  });
  
  console.log("OpenAI client created successfully");
  console.log("API key present:", !!process.env.OPENAI_API_KEY);
  
  // Test a simple API call
  client.models.list().then(models => {
    console.log("Successfully connected to OpenAI API");
    console.log("Number of models available:", models.data.length);
  }).catch(error => {
    console.error("Error connecting to OpenAI API:", error.message);
  });
} catch (error) {
  console.error("Error creating OpenAI client:", error.message);
}