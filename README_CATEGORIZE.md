# Transaction Categorization with OpenAI (Hybrid Approach)

This feature uses OpenAI to categorize financial transactions from the `response.json` file and provide summary statistics. It includes a fallback to local processing if OpenAI is unavailable or quota is exceeded.

## Setup

1. **Add your OpenAI API Key** (Optional but recommended)
   - Open the `.env` file
   - Replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```

## How It Works

The system reads transaction data from `response.json` and:

1. **With API Key**: Uses OpenAI to categorize transactions by `transaction_category` and provide detailed analysis
2. **Without API Key/Fallback**: Uses local processing to categorize transactions when:
   - No API key is provided
   - OpenAI quota is exceeded (429 error)
   - Any other OpenAI API error occurs

### Data Structure

The system expects the following structure in `response.json`:
```json
{
  "results": [
    {
      "transaction_category": "PURCHASE",
      "amount": -23,
      "currency": "GBP",
      "description": "DVSA THEORY TEST",
      // ... other fields
    }
    // ... more transactions
  ]
}
```

### AI Analysis (When API Key is Provided)

OpenAI categorizes transactions by `transaction_category` and provides:
- Transaction count per category
- Total amount per category
- Average amount per category
- Overall summary statistics

## Usage

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Access the endpoint:**
   ```
   GET http://localhost:8000/api/user/categorizeData
   ```

## Response Format

### With OpenAI:
```json
{
  "success": true,
  "data": {
    "categories": {
      "PURCHASE": {
        "transactionCount": 45,
        "totalAmount": -1250.75,
        "averageAmount": -27.80
      },
      "TRANSFER": {
        "transactionCount": 12,
        "totalAmount": -2150.00,
        "averageAmount": -179.17
      }
    },
    "summary": {
      "totalTransactions": 57,
      "totalAmount": -3400.75
    }
  },
  "message": "Transactions successfully categorized with OpenAI"
}
```

### With Local Processing (Fallback):
```json
{
  "success": true,
  "data": {
    "categories": {
      "PURCHASE": {
        "transactionCount": 45,
        "totalAmount": -1250.75,
        "averageAmount": -27.80
      },
      "TRANSFER": {
        "transactionCount": 12,
        "totalAmount": -2150.00,
        "averageAmount": -179.17
      }
    },
    "summary": {
      "totalTransactions": 57,
      "totalAmount": -3400.75
    }
  },
  "message": "Transactions categorized locally (OpenAI quota exceeded, using fallback)"
}
```

## Error Handling

If there are issues with the OpenAI response or API key, the system will automatically fallback to local processing. In case of other errors, the system will return an appropriate error message:

```json
{
  "success": false,
  "message": "Error processing transactions",
  "error": "..."
}
```