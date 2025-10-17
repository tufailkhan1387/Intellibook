require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

// Ensure we have all necessary globals for OpenAI client
// Try to polyfill Headers if not available
if (typeof Headers === 'undefined') {
  try {
    // Try to get Headers from node-fetch
    global.Headers = require('node-fetch').Headers;
  } catch (error) {
    // If that fails, create a minimal Headers implementation
    global.Headers = class Headers {
      constructor(init) {
        this.headers = {};
        if (init) {
          if (init instanceof Headers) {
            this.headers = { ...init.headers };
          } else if (typeof init === 'object') {
            for (const key in init) {
              this.headers[key.toLowerCase()] = init[key];
            }
          }
        }
      }
      
      append(name, value) {
        this.headers[name.toLowerCase()] = value;
      }
      
      set(name, value) {
        this.headers[name.toLowerCase()] = value;
      }
      
      get(name) {
        return this.headers[name.toLowerCase()];
      }
      
      has(name) {
        return name.toLowerCase() in this.headers;
      }
      
      delete(name) {
        delete this.headers[name.toLowerCase()];
      }
    };
  }
}

// Try to polyfill FormData if not available - more robust approach
if (typeof FormData === 'undefined') {
  try {
    // Try to get FormData from node-fetch
    const nodeFetchFormData = require('node-fetch').FormData;
    // Ensure it's a proper constructor
    if (typeof nodeFetchFormData === 'function') {
      global.FormData = nodeFetchFormData;
    } else {
      throw new Error('node-fetch FormData is not a constructor');
    }
  } catch (error) {
    // If that fails, try to require form-data package
    try {
      const FormDataLib = require('form-data');
      // Ensure it's a proper constructor
      if (typeof FormDataLib === 'function') {
        global.FormData = FormDataLib;
      } else {
        throw new Error('form-data is not a constructor');
      }
    } catch (formError) {
      // If that also fails, create a minimal FormData implementation
      global.FormData = function FormData() {
        this._data = [];
      };
      
      global.FormData.prototype.append = function(key, value) {
        this._data.push([key, value]);
      };
      
      global.FormData.prototype.entries = function() {
        return this._data[Symbol.iterator]();
      };
      
      global.FormData.prototype.toString = function() {
        return '[object FormData]';
      };
      
      // Set the constructor property properly
      global.FormData.prototype.constructor = global.FormData;
      
      // Make sure FormData has a proper name
      Object.defineProperty(global.FormData, 'name', { value: 'FormData' });
    }
  }
}

// Simple approach: try to get fetch from different sources
let fetchImpl;
try {
  // Try to require node-fetch (CommonJS)
  fetchImpl = require('node-fetch');
} catch (error) {
  try {
    // Try to use global fetch if available
    fetchImpl = fetch;
  } catch (globalError) {
    // If neither works, we'll handle this in the OpenAI initialization
    fetchImpl = undefined;
  }
}

// Initialize OpenAI client - it will use the global fetch if available, or fail gracefully
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  // Only pass fetch if it's available and valid
  ...(fetchImpl ? { fetch: fetchImpl } : {})
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

// ---- CHUNK DRIVER ----
async function enrichTransactionsInChunks(transactions, CHUNK_SIZE = 20) {
  const chunks = [];
  for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
    chunks.push(transactions.slice(i, i + CHUNK_SIZE));
  }

  const out = [];
  for (let i = 0; i < chunks.length; i++) {
    const enriched = await enrichChunkWithOpenAI(chunks[i], i + 1, chunks.length);
    if (!enriched || !Array.isArray(enriched.results)) {
      throw new Error(`Chunk ${i + 1} returned unexpected shape`);
    }
    out.push(...enriched.results);
  }
  return out;
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

    console.log(`Processing ${transactions.length} transactions...`);

    // Enrich in small chunks to avoid memory spikes
    const enrichedResults = await enrichTransactionsInChunks(transactions, 20);

    // Create the output object
    const output = {
      results: enrichedResults,
      status: original.status ?? "Succeeded"
    };

    // Write the enriched data to a new file
    const outputPath = path.join(__dirname, "enriched_response.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`Enriched data saved to ${outputPath}`);
    
    // Show a sample of the enriched data
    console.log("\nSample of enriched transactions:");
    console.log(JSON.stringify(output.results.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the main function
main();