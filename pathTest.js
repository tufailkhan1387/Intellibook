// Test file paths and permissions
const fs = require("fs");
const path = require("path");

console.log("=== PATH AND PERMISSION TEST ===");

// Test different ways of constructing the path
console.log("1. Path construction tests:");

const method1 = path.join(__dirname, "../response.json");
console.log("   Method 1 (__dirname + ../):", method1);

const method2 = path.join(__dirname, "response.json");
console.log("   Method 2 (__dirname):", method2);

const method3 = "./response.json";
console.log("   Method 3 (./):", path.resolve(method3));

const method4 = "response.json";
console.log("   Method 4 (filename only):", path.resolve(method4));

// Check if files exist
console.log("\n2. File existence tests:");
console.log("   Method 1 exists:", fs.existsSync(method1));
console.log("   Method 2 exists:", fs.existsSync(method2));
console.log("   Method 3 exists:", fs.existsSync(path.resolve(method3)));
console.log("   Method 4 exists:", fs.existsSync(path.resolve(method4)));

// Try to read with different methods
console.log("\n3. File read tests:");
try {
  const data1 = fs.readFileSync(method1, "utf8");
  console.log("   Method 1 read successful, length:", data1.length);
} catch (error) {
  console.log("   Method 1 read failed:", error.message);
}

try {
  const data2 = fs.readFileSync(method2, "utf8");
  console.log("   Method 2 read successful, length:", data2.length);
} catch (error) {
  console.log("   Method 2 read failed:", error.message);
}

try {
  const data3 = fs.readFileSync(path.resolve(method3), "utf8");
  console.log("   Method 3 read successful, length:", data3.length);
} catch (error) {
  console.log("   Method 3 read failed:", error.message);
}

// Check file permissions
console.log("\n4. File permissions:");
try {
  const stats = fs.statSync(method1);
  console.log("   File permissions:", stats.mode);
  console.log("   File readable:", stats.mode & fs.constants.R_OK ? "Yes" : "No");
  console.log("   File writable:", stats.mode & fs.constants.W_OK ? "Yes" : "No");
} catch (error) {
  console.log("   Permission check failed:", error.message);
}

console.log("\n=== TEST COMPLETE ===");