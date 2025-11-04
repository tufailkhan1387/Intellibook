# Excel + AI Categorization Integration

## Overview
Successfully integrated Excel-based categorization with AI-powered transaction categorization. The system now uses both the Excel categories sheet and AI to provide enhanced categorization with additional metadata.

## What Was Implemented

### 1. CategoryManager Class (`helpers/CategoryManager.js`)
- **Purpose**: Reads and manages categories from the Excel sheet "Allow&Disa Exp by Truelayer cat"
- **Features**:
  - Loads 103 categories from Excel on initialization
  - Provides methods to query categories by TrueLayer category
  - Returns subcategories, allowable status, prompts, and background actions
  - Enhanced categorization method that combines Excel data with transaction info

### 2. Enhanced AI Categorization (`controllers/userController.js`)
- **Integration**: Modified `processSingleTransaction` function to use Excel data
- **Enhanced Prompt**: AI now receives Excel reference data including:
  - Available Excel categories
  - Suggested subcategories
  - Allowable status
  - Specific prompts for the category
- **Additional Fields**: Each transaction now includes:
  - `excelCategory`: Category from Excel sheet
  - `excelSubcategory`: Subcategory from Excel sheet
  - `allowableStatus`: Whether expense is allowable/disallowable/review
  - `excelPrompt`: Specific prompt for user interaction
  - `backgroundAction`: What the system should do in background

### 3. Dependencies Added
- **xlsx**: For reading Excel files
- **path**: For proper file path handling

## How It Works

1. **Excel Data Loading**: CategoryManager loads all categories from the Excel sheet on startup
2. **Transaction Processing**: For each transaction:
   - First, Excel data is retrieved based on the transaction's TrueLayer category
   - AI prompt is enhanced with Excel reference data
   - AI provides categorization using Excel guidance
   - Result includes both AI categorization and Excel metadata

## Example Output

For a Spotify transaction with category "Entertainment":
```json
{
  "transaction_id": "test-1",
  "description": "Spotify Premium",
  "generalCategory": "Entertainment",
  "subCategory": "Music",
  "domainDescription": "Music streaming subscription",
  "excelCategory": "Entertainment",
  "excelSubcategory": "Music",
  "allowableStatus": "Review",
  "excelPrompt": "Is this music for business…or just to keep you dancing while doing the dishes?",
  "backgroundAction": "If not for trade, then disallow and add back to income. - Prompt user to add receipt for VAT or just evidence"
}
```

## Benefits

1. **Consistent Categorization**: Excel provides standardized categories and rules
2. **Enhanced AI Guidance**: AI uses Excel data to make better categorization decisions
3. **Tax Compliance**: Includes allowable/disallowable status for tax purposes
4. **User Interaction**: Provides specific prompts for user clarification
5. **Background Processing**: Tells the system what actions to take automatically

## Usage

The existing API endpoint `/categorize` now returns enhanced data with Excel integration. No changes needed to the API interface - the additional fields are automatically included in the response.

## Files Modified
- `controllers/userController.js`: Enhanced with Excel integration
- `helpers/CategoryManager.js`: New class for Excel management
- `package.json`: Added xlsx dependency
