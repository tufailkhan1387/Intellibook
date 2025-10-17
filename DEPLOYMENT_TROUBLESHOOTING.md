# Deployment Troubleshooting Guide

This guide helps you resolve common issues when deploying the transaction categorization application to a server environment.

## Common Deployment Issues and Solutions

### 1. "fetch is not defined" Error

**Problem**: 
```
Error: `fetch` is not defined as a global; Either pass `fetch` to the client, `new OpenAI({ fetch })` or polyfill the global, `globalThis.fetch = fetch`
```

**Solution**:
The application now includes automatic fetch detection and polyfilling. It tries multiple approaches:
1. Uses node-fetch if available
2. Falls back to global fetch if available
3. Continues without fetch if neither is available (OpenAI client will use its built-in implementation)

### 2. "Headers is not defined" Error

**Problem**:
```
Error processing transaction xxx: Headers is not defined
```

**Solution**:
The application now includes automatic Headers polyfilling:
1. Uses Headers from node-fetch if available
2. Creates a minimal Headers implementation if needed

### 3. File Path Issues

**Problem**:
```
response.json file not found
```

**Solution**:
The application now checks multiple possible paths for the response.json file:
1. `../response.json` (default path from controller directory)
2. `./response.json` (alternative path if file is in the same directory)

### 4. Environment Variable Issues

**Problem**:
API key not found or incorrect

**Solution**:
1. Ensure your `.env` file is in the correct location (same directory as app.js)
2. Verify the OPENAI_API_KEY is properly formatted
3. Check that the file has proper read permissions

## Server Deployment Checklist

### Before Deployment:
- [ ] Verify all dependencies are installed: `npm install`
- [ ] Check that `.env` file contains valid OPENAI_API_KEY
- [ ] Ensure `response.json` file is in the correct location
- [ ] Verify file permissions (read access for the application user)

### After Deployment:
- [ ] Test the `/user/diagnostics` endpoint to verify environment
- [ ] Test the `/user/testCategorize` endpoint to verify OpenAI connectivity
- [ ] Test the `/user/categorizeData` endpoint to verify full functionality

## Testing Endpoints

### Diagnostics Endpoint
```
GET /user/diagnostics
```
Returns information about the server environment including:
- NODE_ENV setting
- OPENAI_API_KEY presence and length
- Platform and Node.js version

### Test Endpoint
```
GET /user/testCategorize
```
Tests basic OpenAI connectivity with a simple API call.

### Main Endpoint
```
GET /user/categorizeData
```
Runs the full transaction categorization process.

## Common Server Environments

### Ubuntu/Debian Servers
- Ensure Node.js version 18+ is installed
- Install dependencies with: `npm install`
- Run with: `node app.js` or use a process manager like PM2

### CentOS/RHEL Servers
- Enable EPEL repository if needed
- Install Node.js using the official repository
- Ensure all npm dependencies install correctly

### Docker Deployments
- Base image should include Node.js 18+
- Ensure `.env` file is properly mounted
- Verify volume mounts for data files

## Debugging Steps

If you encounter issues after deployment:

1. **Check server logs**:
   ```bash
   # Check application logs
   tail -f error_log
   
   # Check system logs
   journalctl -u your-app-service
   ```

2. **Verify environment**:
   ```bash
   # Check Node.js version
   node --version
   
   # Check npm version
   npm --version
   
   # List installed packages
   npm list
   ```

3. **Test connectivity**:
   ```bash
   # Test internet connectivity
   ping api.openai.com
   
   # Test DNS resolution
   nslookup api.openai.com
   ```

4. **Verify file permissions**:
   ```bash
   # Check .env file
   ls -la .env
   
   # Check response.json file
   ls -la response.json
   
   # Check controller directory
   ls -la controllers/
   ```

## Contact Support

If you continue to experience issues:
1. Capture the complete error message and stack trace
2. Note the server environment (OS, Node.js version, etc.)
3. Document the steps you've taken to troubleshoot
4. Reach out with this information for further assistance