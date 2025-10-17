require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API connection...");
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say hello world" }
      ],
      max_tokens: 10
    });
    
    console.log("OpenAI API is working correctly.");
    console.log("Response:", response.choices[0].message.content);
  } catch (error) {
    console.error("Error testing OpenAI API:", error.message);
  }
}

testOpenAI();