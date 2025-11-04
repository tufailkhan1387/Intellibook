require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const CategoryManager = require("../helpers/CategoryManager");



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

      global.FormData.prototype.append = function (key, value) {
        this._data.push([key, value]);
      };

      global.FormData.prototype.entries = function () {
        return this._data[Symbol.iterator]();
      };

      global.FormData.prototype.toString = function () {
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

// Initialize Category Manager
const categoryManager = new CategoryManager();

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

// ---- EXPRESS HANDLER ----
async function categorizeData(req, res) {
  try {
    console.log("Starting categorizeData function...");

    // Log environment information for debugging
    console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
    if (process.env.OPENAI_API_KEY) {
      console.log("API Key length:", process.env.OPENAI_API_KEY.length);
    }

    // Ensure OpenAI client is initialized
    if (!client) {
      console.log("❌ OpenAI client not initialized");
      return res.status(500).json({
        results: [],
        status: "Failed",
        error: "OpenAI client not initialized"
      });
    }

    // Fix the file path - it should be in the same directory, not the parent
    let filePath = path.join(__dirname, "../response.json");
    console.log("Reading file from:", filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log("❌ response.json file not found at expected path");
      // Try alternative path
      const altPath = path.join(__dirname, "response.json");
      console.log("Trying alternative path:", altPath);
      if (fs.existsSync(altPath)) {
        console.log("Found response.json at alternative path");
        filePath = altPath;
      } else {
        console.log("❌ response.json file not found at alternative path either");
        return res.status(404).json({
          results: [],
          status: "Failed",
          error: "response.json file not found"
        });
      }
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    console.log("File read successfully, size:", fileContent.length);

    const original = JSON.parse(fileContent);
    console.log("JSON parsed successfully");

    const transactions = Array.isArray(original.results) ? original.results : [];
    console.log("Number of transactions:", transactions.length);

    if (transactions.length === 0) {
      console.log("No transactions found, returning empty results");
      return res.status(200).json({
        results: [],
        status: original.status ?? "Succeeded"
      });
    }

    console.log("Processing transactions in parallel...");
    // Process transactions in parallel for faster response
    const enrichedResults = await processTransactionsInParallel(transactions, client);
    console.log("Finished processing transactions. Results count:", enrichedResults.length);

    // Check how many were actually categorized
    const categorizedCount = enrichedResults.filter(txn =>
      txn.generalCategory &&
      txn.generalCategory !== "General" &&
      txn.subCategory &&
      txn.subCategory !== "General → Miscellaneous"
    ).length;

    console.log("Successfully categorized transactions:", categorizedCount);
    console.log("Default categorized transactions:", enrichedResults.length - categorizedCount);

    // EXACT output shape you requested:
    return res.status(200).json({
      results: enrichedResults,
      status: original.status ?? "Succeeded"
    });

  } catch (error) {
    console.error("❌ Error in categorizeData:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      results: [],
      status: "Failed",
      error: error.message,
      errorDetails: {
        name: error.name,
        code: error.code
      }
    });
  }
}

// ---- PARALLEL PROCESSING ----
async function processTransactionsInParallel(transactions, client) {
  console.log("Starting parallel processing of", transactions.length, "transactions");
  // Process up to 10 transactions in parallel to balance speed and resource usage
  const CONCURRENT_LIMIT = 80;
  const results = [];

  for (let i = 0; i < transactions.length; i += CONCURRENT_LIMIT) {
    const batch = transactions.slice(i, i + CONCURRENT_LIMIT);
    console.log(`Processing batch ${Math.floor(i / CONCURRENT_LIMIT) + 1} with ${batch.length} transactions`);
    const promises = batch.map(transaction => processSingleTransaction(transaction, client));

    try {
      const batchResults = await Promise.all(promises);
      console.log(`Batch ${Math.floor(i / CONCURRENT_LIMIT) + 1} completed with ${batchResults.length} results`);
      results.push(...batchResults);
    } catch (error) {
      console.error(`❌ Error processing batch:`, error);
      // Add failed transactions with default categorization
      batch.forEach(transaction => {
        results.push({
          ...transaction,
          generalCategory: "General",
          subCategory: "General → Miscellaneous",
          domainDescription: "Unable to categorize transaction due to processing error."
        });
      });
    }
  }
  console.log("All batches processed. Total results:", results.length);
  return results;
}

// ---- SINGLE TRANSACTION PROCESSING ----
async function processSingleTransaction(transaction, client) {
  try {
    // Get Excel-based categorization first
    const excelData = categoryManager.enhanceCategorization(transaction);
    
    // Create a minimal prompt with only essential transaction data
    const transactionData = {
      id: transaction.transaction_id,
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.transaction_type,
      category: transaction.transaction_category
    };

    // Build enhanced prompt using Excel categories
    const availableCategories = categoryManager.getAllTrueLayerCategories();
    const excelSubcategories = excelData.availableSubcategories;
    
    const userPrompt = `
Categorize this bank transaction with these fields:
- generalCategory (one of: Income, Shopping, Entertainment, Food & Dining, Transportation, Utilities, Health, Savings, Investments, Personal Care, Travel, Business, Education, Gifts & Donations, Miscellaneous)
- subCategory (a specific category under the general category)
- domainDescription (1-2 sentences about the transaction)

IMPORTANT: Use the Excel reference data to guide your categorization:
- TrueLayer Category: ${transaction.transaction_category}
- Available Excel Categories: ${availableCategories.join(', ')}
- Suggested Excel Subcategories: ${excelSubcategories.join(', ')}
- Excel Allowable Status: ${excelData.allowableStatus}
- Excel Prompt: ${excelData.prompt}

Return ONLY this JSON format:
{
  "transaction_id": "${transactionData.id}",
  "generalCategory": "Category",
  "subCategory": "Subcategory",
  "domainDescription": "Description"
}

Transaction:
${JSON.stringify(transactionData, null, 2)}
`;

    const resp = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial transaction categorization expert. Use the Excel reference data to guide your categorization decisions. Respond with valid JSON only."
        },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 200 // Reduced for faster response
    });

    const text = resp.choices[0]?.message?.content || "";
    if (!text) throw new Error("Empty response from OpenAI");

    // Parse the JSON response
    const categorization = JSON.parse(text);

    // Merge the categorization with the original transaction and Excel data
    return {
      ...transaction,
      generalCategory: categorization.generalCategory || excelData.excelCategory || "General",
      subCategory: categorization.subCategory || excelData.excelSubcategory || "General → Miscellaneous",
      domainDescription: categorization.domainDescription || "Transaction categorized.",
      // Add Excel-specific fields
      excelCategory: excelData.excelCategory,
      excelSubcategory: excelData.excelSubcategory,
      allowableStatus: excelData.allowableStatus,
      excelPrompt: excelData.prompt,
      backgroundAction: excelData.backgroundAction
    };
  } catch (error) {
    console.error(`Error processing transaction ${transaction.transaction_id}:`, error.message);
    
    // Get Excel data even on error for fallback
    const excelData = categoryManager.enhanceCategorization(transaction);
    
    // Return transaction with Excel-based categorization on error
    return {
      ...transaction,
      generalCategory: excelData.excelCategory || "General",
      subCategory: excelData.excelSubcategory || "General → Miscellaneous",
      domainDescription: "Unable to categorize transaction.",
      // Add Excel-specific fields
      excelCategory: excelData.excelCategory,
      excelSubcategory: excelData.excelSubcategory,
      allowableStatus: excelData.allowableStatus,
      excelPrompt: excelData.prompt,
      backgroundAction: excelData.backgroundAction
    };
  }
}

module.exports = { categorizeData, client };