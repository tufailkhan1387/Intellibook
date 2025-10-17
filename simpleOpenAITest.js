// Simple test to check if OpenAI API is working
require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch");

// Initialize OpenAI client with explicit fetch
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-key",
  fetch: fetch
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connection...");
    console.log("API key present:", !!process.env.OPENAI_API_KEY);
    
    // Test a simple API call
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "user", 
          content: "Respond with exactly: 'API connection successful'" 
        }
      ],
      max_tokens: 50
    });
    
    console.log("API Response:", response.choices[0].message.content);
    console.log("✅ OpenAI API is working correctly");
    
  } catch (error) {
    console.error("❌ Error connecting to OpenAI API:", error.message);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);
  }
}

testOpenAI();