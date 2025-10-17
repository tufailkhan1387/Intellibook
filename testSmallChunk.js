require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

// ---- YOUR EXACT SYSTEM PROMPT ----
const system_prompt = `
You are "EnhancedTxnBot," an AI assistant that enriches an existing JSON of bank transactions with enterprise-grade categorization metadata.

When I give you a JSON object like this:

{
  "results": [
    {
      "timestamp": "2025-07-29T14:54:12.411Z",
      "description": "Saving",
      "transaction_type": "DEBIT",
      "transaction_category": "OTHER",
      "transaction_classification": [],
      "amount": -50,
      "currency": "GBP",
      "transaction_id": "b2ecebe2fe8d8b380e0f656ce931e3d1",
      "provider_transaction_id": "03be9c5e-1268-426d-ae69-74e698cb762d",
      "normalised_provider_transaction_id": "txn-0b6df3a48b8d1c819",
      "meta": { ... }
    },
    { ... more transactions ... }
  ],
  "status": "Succeeded"
}

You must:

1. For each object in \`results\`, append exactly three new fields:
   - \`generalCategory\` (one of your top-level buckets)
   - \`subCategory\` (a more specific slice under that bucket)
   - \`domainDescription\` (1–2 sentences describing the merchant/domain)

2. Preserve every existing field on each transaction and leave the outer "status" untouched.

3. If you can't confidently pick a subCategory, set:
   - \`generalCategory\`: "General"
   - \`subCategory\`: "General → Miscellaneous"

4. Output the modified JSON object in the same shape, e.g.:

{
  "results": [
    {
      "timestamp": "2025-07-29T14:54:12.411Z",
      "description": "Saving",
      "transaction_type": "DEBIT",
      "transaction_category": "OTHER",
      "transaction_classification": [],
      "amount": -50,
      "currency": "GBP",
      "transaction_id": "b2ecebe2fe8d8b380e0f656ce931e3d1",
      "provider_transaction_id": "03be9c5e-1268-426d-ae69-74e698cb762d",
      "normalised_provider_transaction_id": "txn-0b6df3a48b8d1c819",
      "meta": { ... },
      "generalCategory": "Bank Products",
      "subCategory": "Savings",
      "domainDescription": "This transaction appears to be an internal transfer to a savings account held within the same institution."
    },
    { ... enriched transactions ... }
  ],
  "status": "Succeeded"
}
`;

// ---- PROMPTS ----
function buildUserPrompt(transactionsChunk, chunkNumber, totalChunks) {
  // Note: we feed only "results" to keep payload compact.
  return `
Return ONLY valid JSON in EXACTLY this shape:
{
  "results": [ ...enriched transactions... ]
}

For each transaction in "results", append:
- generalCategory
- subCategory
- domainDescription (1–2 sentences)

Keep every existing field unchanged. Do not add any other top-level keys.

This is chunk ${chunkNumber} of ${totalChunks}.

Input:
${JSON.stringify({ results: transactionsChunk }, null, 2)}
`;
}

// ---- OPENAI CALL PER CHUNK ----
async function enrichChunkWithOpenAI(transactionsChunk, chunkNumber, totalChunks) {
  const userPrompt = buildUserPrompt(transactionsChunk, chunkNumber, totalChunks);

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4000
    });

    const text = resp.choices[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from OpenAI");
    
    // Clean up the response text to ensure it's valid JSON
    let cleanedText = text.trim();
    
    // Try to parse the JSON
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      console.error("JSON parsing failed, attempting to extract JSON from response");
      console.error("Raw response:", text);
      
      // Try to find JSON object in the response
      const jsonStart = cleanedText.indexOf('{');
      const jsonEnd = cleanedText.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = cleanedText.substring(jsonStart, jsonEnd + 1);
        try {
          parsed = JSON.parse(jsonString);
        } catch (extractError) {
          throw new Error(`Failed to parse JSON from OpenAI response: ${parseError.message}. Attempted extraction also failed: ${extractError.message}`);
        }
      } else {
        throw new Error(`Failed to parse JSON from OpenAI response: ${parseError.message}`);
      }
    }

    // Validate the parsed response structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("OpenAI response is not a valid object");
    }
    
    if (!Array.isArray(parsed.results)) {
      throw new Error("OpenAI response missing 'results' array");
    }

    return parsed; // { results: [ ...enriched... ] }
  } catch (error) {
    console.error(`Error in enrichChunkWithOpenAI (chunk ${chunkNumber}/${totalChunks}):`, error);
    throw error;
  }
}

// ---- MAIN FUNCTION ----
async function main() {
  try {
    // Read the response.json file
    const filePath = path.join(__dirname, "response.json");
    const original = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const transactions = Array.isArray(original.results) ? original.results : [];
    if (transactions.length === 0) {
      console.log("No transactions found in response.json");
      return;
    }

    console.log(`Total transactions: ${transactions.length}`);
    
    // Take just the first 5 transactions for testing
    const testTransactions = transactions.slice(0, 5);
    console.log(`Processing first ${testTransactions.length} transactions...`);

    // Process just this small chunk
    const enrichedResults = await enrichChunkWithOpenAI(testTransactions, 1, 1);

    // Create the output object
    const output = {
      results: enrichedResults.results,
      status: original.status ?? "Succeeded"
    };

    // Write the enriched data to a new file
    const outputPath = path.join(__dirname, "enriched_sample.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`Enriched data saved to ${outputPath}`);
    
    // Show the enriched data
    console.log("\nEnriched transactions:");
    console.log(JSON.stringify(output.results, null, 2));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the main function
main();