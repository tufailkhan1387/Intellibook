# Live Server Troubleshooting Guide

This guide helps you diagnose and fix issues when the transaction categorization application appears to work locally but fails on the live server.

## Common Issues and Solutions

### 1. Transactions Categorized as "General → Miscellaneous"

**Problem**: 
All transactions are being categorized with default values:
```json
{
  "generalCategory": "General",
  "subCategory": "General → Miscellaneous",
  "domainDescription": "Unable to categorize transaction."
}
```

**Root Causes**:
1. OpenAI API calls are failing silently
2. Network connectivity issues to OpenAI API
3. Firewall/proxy blocking API requests
4. Incorrect API key or permissions
5. Rate limiting by OpenAI

### 2. "Right-hand side of 'instanceof' is not an object" Error

**Problem**: 
```
Error processing transaction xxx: Right-hand side of 'instanceof' is not an object
```

**Root Cause**: 
This error occurs when the FormData polyfill implementation is incomplete or incorrect, causing issues with the OpenAI client's internal type checking.

**Solution**: 
The application now includes a robust FormData polyfill with proper constructor naming and instanceof support.

### 3. Silent Failures in Error Handling

**Problem**: 
Errors are being caught but not properly logged or handled.

**Solution**:
The application now includes enhanced error logging that shows:
- Specific error messages from OpenAI
- Stack traces for debugging
- Network-related issues
- Authentication problems

## Diagnostic Steps

### Step 1: Check Environment Variables

Verify that your `.env` file is properly deployed:
```bash
# Check if .env file exists
ls -la .env

# Check if it contains the API key
grep OPENAI_API_KEY .env
```

### Step 2: Test Basic Connectivity

Use the built-in diagnostics endpoint:
```
GET /user/diagnostics
```

This should return:
```json
{
  "environment": "production",
  "openaiKeyPresent": true,
  "openaiKeyLength": 164,
  "timestamp": "2025-10-13T10:30:00.000Z",
  "platform": "linux",
  "nodeVersion": "v18.17.0"
}
```

### Step 3: Test OpenAI Connectivity

Use the test endpoint:
```
GET /user/testCategorize
```

This should return:
```json
{
  "status": "success",
  "message": "API test successful",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```

If this fails, check:
1. Network connectivity to api.openai.com
2. Firewall rules
3. Proxy settings

### Step 4: Check Server Logs

Look for error messages in your server logs:
```bash
# Check application logs
tail -f error_log

# Check system logs
journalctl -u your-app-service -f
```

Look specifically for:
- "Error processing transaction"
- "FormData is not defined"
- "Headers is not defined"
- "Right-hand side of 'instanceof' is not an object"
- Network timeout errors
- Authentication errors

### Step 5: Test Network Connectivity

From your server, test connectivity to OpenAI:
```bash
# Test DNS resolution
nslookup api.openai.com

# Test HTTPS connectivity
curl -v https://api.openai.com/v1/models

# Test with your API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.openai.com/v1/models
```

## Common Server Environments and Fixes

### Ubuntu/Debian Servers

1. Ensure Node.js version 18+ is installed:
```bash
node --version
npm --version
```

2. Install all dependencies:
```bash
npm install
```

3. Check file permissions:
```bash
ls -la .env
ls -la response.json
ls -la controllers/userController.js
```

### CentOS/RHEL Servers

1. Enable EPEL repository if needed
2. Install Node.js using official repository
3. Ensure all npm dependencies install correctly

### Docker Deployments

1. Ensure base image includes Node.js 18+
2. Verify volume mounts for:
   - `.env` file
   - `response.json` file
3. Check network settings in Docker configuration

## Advanced Debugging

### Enable Detailed Logging

Add this to your server startup to get more detailed logs:
```bash
NODE_DEBUG=http,https,tls node app.js
```

### Test with a Simple Script

Create a test script on your server:
```javascript
// test-openai.js
require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

client.models.list().then(models => {
  console.log('Success! Found', models.data.length, 'models');
}).catch(error => {
  console.error('Error:', error.message);
});
```

Run it:
```bash
node test-openai.js
```

### Check for Rate Limiting

If you're processing many transactions, you might be hitting rate limits. The application now includes:

1. Reduced concurrent processing (80 transactions per batch instead of 100)
2. Better error handling for rate limit errors
3. More detailed logging of API responses

## Contact Support

If you continue to experience issues:

1. Capture the complete server logs
2. Note the server environment details:
   - OS version
   - Node.js version
   - npm version
   - Network configuration
3. Document the steps you've taken to troubleshoot
4. Include any error messages from the logs

## Recent Fixes Applied

The following fixes have been implemented to address common deployment issues:

1. **ES Module Compatibility**: Fixed issues with node-fetch ES module versions
2. **Global API Polyfills**: Added polyfills for Headers and FormData
3. **Instanceof Error Fix**: Resolved "Right-hand side of 'instanceof' is not an object" errors
4. **Enhanced Error Handling**: Improved error logging and reporting
5. **File Path Resolution**: Better handling of file paths in different environments
6. **Client Initialization**: More robust OpenAI client initialization

These fixes should resolve most common deployment issues.