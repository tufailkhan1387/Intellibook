// Verify the correct path for response.json
const fs = require("fs");
const path = require("path");

console.log("=== PATH VERIFICATION ===");

// Current directory (should be controllers)
console.log("Current directory:", __dirname);

// Construct the path to response.json
const filePath = path.join(__dirname, "../response.json");
console.log("Constructed path:", filePath);

// Check if file exists
console.log("File exists:", fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
  try {
    const stats = fs.statSync(filePath);
    console.log("File size:", stats.size, "bytes");
    console.log("File readable:", stats.mode & fs.constants.R_OK ? "Yes" : "No");
    
    // Try to read a small portion
    const content = fs.readFileSync(filePath, "utf8");
    console.log("File read successful");
    console.log("Content length:", content.length);
    
    // Try to parse JSON
    const jsonData = JSON.parse(content);
    console.log("JSON parsing successful");
    console.log("Results array length:", Array.isArray(jsonData.results) ? jsonData.results.length : 0);
    
  } catch (error) {
    console.log("Error:", error.message);
  }
} else {
  console.log("❌ File not found at constructed path");
  
  // List files in parent directory
  try {
    const parentDir = path.join(__dirname, "..");
    console.log("Parent directory contents:", fs.readdirSync(parentDir));
  } catch (error) {
    console.log("Error listing parent directory:", error.message);
  }
}

console.log("=== VERIFICATION COMPLETE ===");