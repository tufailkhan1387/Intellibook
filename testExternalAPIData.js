// Test script to call the external API with proper data structure
const axios = require('axios');

// Sample transaction data similar to what the API might expect
const sampleData = {
  "results": [
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
      "timestamp": "2025-10-04T04:31:45Z",
      "description": "STAGECOACH SERVICES",
      "transaction_type": "DEBIT",
      "transaction_category": "PURCHASE",
      "transaction_classification": [],
      "amount": -3,
      "currency": "GBP",
      "transaction_id": "89bfc307641801d74c62513d5e553cf4",
      "provider_transaction_id": "7a2fcf46-19ea-4306-a2b5-0b93ad04c661",
      "normalised_provider_transaction_id": "txn-3054ecdc659e1f1d2",
      "meta": {
        "provider_merchant_name": "Stagecoach",
        "provider_category": "MASTER_CARD",
        "transaction_type": "Debit",
        "provider_id": "7a2fcf46-19ea-4306-a2b5-0b93ad04c661"
      }
    }
  ],
  "status": "Succeeded"
};

async function testExternalAPI() {
  try {
    console.log("Testing external API with sample data...");
    
    const response = await axios.post(
      'http://108.142.216.31/api/categorize_transactions',
      sampleData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log("Response status:", response.status);
    console.log("Response data type:", typeof response.data);
    
    if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
      console.log("Received HTML response (first 500 chars):");
      console.log(response.data.substring(0, 500) + "...");
    } else {
      console.log("Received JSON response:");
      console.log(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error("Error calling external API:");
    console.error("Message:", error.message);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data type:", typeof error.response.data);
      
      if (typeof error.response.data === 'string' && error.response.data.includes('<!doctype html>')) {
        console.log("Received HTML response (first 500 chars):");
        console.log(error.response.data.substring(0, 500) + "...");
      } else {
        console.log("Response data:", JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

testExternalAPI();