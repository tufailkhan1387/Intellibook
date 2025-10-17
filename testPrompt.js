require("dotenv").config();
const OpenAI = require("openai");
const fetch = require("node-fetch"); // Import node-fetch

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  fetch: fetch // Explicitly pass fetch implementation
});

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

const sampleTransactions = [
  {
    "timestamp": "2025-10-04T11:19:10.235Z",
    "description": "PBB00015421786",
    "transaction_type": "DEBIT",
    "transaction_category": "TRANSFER",
    "transaction_classification": [],
    "amount": -9.84,
    "currency": "GBP",
    "transaction_id": "6e10e6b98b5597dde6dde0bc4d8b110f",
    "provider_transaction_id": "7bc7321d-384f-4be0-b2d7-b84056214074",
    "normalised_provider_transaction_id": "txn-f25de43aee7637165",
    "meta": {
      "provider_merchant_name": "Capital One",
      "provider_category": "FASTER_PAYMENTS_OUT",
      "transaction_type": "Debit",
      "provider_id": "7bc7321d-384f-4be0-b2d7-b84056214074",
      "counter_party_preferred_name": "Account"
    }
  },
  {
    "timestamp": "2025-10-04T11:17:50.355Z",
    "description": "Transfer from Easy Saver",
    "transaction_type": "CREDIT",
    "transaction_category": "OTHER",
    "transaction_classification": [],
    "amount": 9.5,
    "currency": "GBP",
    "transaction_id": "fc8f820b22463c820842e0c477a0a1aa",
    "provider_transaction_id": "7bc5e146-529a-4d6a-b3df-dcbbce7e0546",
    "normalised_provider_transaction_id": "txn-40751090e90e9e58c",
    "meta": {
      "provider_merchant_name": "Virendra Vyas",
      "provider_category": "ON_US_PAY_ME",
      "transaction_type": "Credit",
      "provider_id": "7bc5e146-529a-4d6a-b3df-dcbbce7e0546"
    }
  }
];

const userPrompt = `
Return ONLY valid JSON in EXACTLY this shape:
{
  "results": [ ...enriched transactions... ]
}

For each transaction in "results", append:
- generalCategory
- subCategory
- domainDescription (1–2 sentences)

Keep every existing field unchanged. Do not add any other top-level keys.

This is chunk 1 of 1.

Input:
${JSON.stringify({ results: sampleTransactions }, null, 2)}
`;

async function testPrompt() {
  try {
    console.log("Sending prompt to OpenAI...");
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000
    });
    
    const result = response.choices[0].message.content;
    console.log("Received response:");
    console.log(result);
    
    // Try to parse the JSON
    try {
      const parsed = JSON.parse(result);
      console.log("\nParsed JSON:");
      console.log(JSON.stringify(parsed, null, 2));
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError.message);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testPrompt();