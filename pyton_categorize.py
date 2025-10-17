import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv
from flask import Flask, request, jsonify

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def create_app():
    app = Flask(__name__)
    load_dotenv()

    # Configure the Gemini API
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    @app.route('/')
    def hello_world():
        return 'Hello, World!'

    @app.route('/api/categorize_transactions', methods=['POST'])
    def generate():
        logging.info("Received request for transaction categorization.")
        if not request.is_json:
            logging.error("Request is not in JSON format.")
            return jsonify({"error": "Request must be JSON"}), 400

        # The incoming JSON data with bank transaction information
        data = request.get_json()
        logging.info(f"Request data: {json.dumps(data, indent=2)}")

        # --- Placeholder for Prompts ---
        # You can define your system and user prompts here.
        # The 'data' variable contains the JSON from the request.
        system_prompt = """You are “EnhancedTxnBot,” an AI assistant that enriches an existing JSON of bank transactions with enterprise-grade categorization metadata.

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
      "meta": { … }
    },
    { … more transactions … }
  ],
  "status": "Succeeded"
}

You must:

1. **For each object in `results`**, append exactly three new fields:
   - `generalCategory` (one of your top-level buckets)
   - `subCategory` (a more specific slice under that bucket)
   - `domainDescription` (1–2 sentences describing the merchant/domain)

2. **Preserve every existing field** on each transaction and leave the outer `"status"` untouched.

3. If you can’t confidently pick a subCategory, set:
   - `generalCategory`: `"General"`
   - `subCategory`: `"General → Miscellaneous"`

4. **Output** the modified JSON object in the same shape, e.g.:

```json
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
      "meta": { … },
      "generalCategory": "Bank Products",
      "subCategory": "Savings",
      "domainDescription": "This transaction appears to be an internal transfer to a savings account held within the same institution."
    },
    { … enriched transactions … }
  ],
  "status": "Succeeded"
}


"""
        
        # Example of how to incorporate the transaction data into the prompt
        user_prompt = f"""Please enrich these transactions:
{json.dumps(data, indent=2)}
"""
        # --- End of Placeholder ---

        try:
            logging.info("Sending request to Gemini API.")
            model = genai.GenerativeModel(
                'gemini-1.5-flash',
                system_instruction=system_prompt
            )
            response = model.generate_content(user_prompt)
            logging.info(f"Received response from Gemini API: {response.text}")
            
            # Clean the response to remove markdown and other non-JSON characters
            cleaned_response = response.text.strip().replace('```json', '').replace('```', '')
            
            # Assuming the response text is a valid JSON string
            # If not, you might need to wrap it or handle it differently
            response_json = json.loads(cleaned_response)
            logging.info(f"Response JSON: {json.dumps(response_json, indent=2)}")
            return jsonify(response_json)
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            return jsonify({"error": str(e)}), 500

    return app
