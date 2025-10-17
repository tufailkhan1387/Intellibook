require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

async function simpleTest() {
  try {
    console.log("Testing simple OpenAI call...");
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a helpful assistant that categorizes bank transactions." 
        },
        { 
          role: "user", 
          content: "Categorize this transaction: Amount: -9.84 GBP, Description: PBB00015421786, Type: DEBIT, Merchant: Capital One. Return ONLY a JSON object with generalCategory, subCategory, and domainDescription fields." 
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    
    console.log("Response received:");
    console.log(response.choices[0].message.content);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

simpleTest();