# Transaction Categorization with OpenAI

This feature uses OpenAI to categorize financial transactions from the `response.json` file and provide summary statistics.

## Setup

1. **Add your OpenAI API Key**
   - Open the `.env` file
   - Replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```

## How It Works

The system reads transaction data from `response.json`, sends it to OpenAI, and receives categorized data with statistics.

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

### AI Analysis

OpenAI categorizes transactions by `transaction_category` and provides:
- Transaction count per category
- Total amount per category
- Average amount per category
- Overall summary statistics

To stay within OpenAI's token limits, the system automatically processes transactions in chunks of 50 transactions each. This allows processing of any number of transactions regardless of the total size.

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
    },
    "message": "Transactions successfully categorized with OpenAI",
    "note": "Analyzed all 147 transactions by processing in chunks"
  }
```

## Error Handling

If there are issues with the OpenAI response or API key, the system will return an appropriate error message:

```json
{
  "success": false,
  "message": "Error processing transactions with OpenAI",
  "error": "..."
}
```

For quota exceeded errors (429), the response will be:

```json
{
  "success": false,
  "message": "OpenAI quota exceeded. Please check your plan and billing details.",
  "error": "..."
}
```

For token limit errors (400), the response will be:

```json
{
  "success": false,
  "message": "Transaction data too large for OpenAI model even with chunking.",
  "error": "..."
}
```