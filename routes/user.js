// Add a simple test endpoint
router.get("/testCategorize", async (req, res) => {
  try {
    // Log environment info
    console.log("Test endpoint called");
    console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
    
    // Try a simple OpenAI call using the same polyfills as the controller
    // Ensure we have all necessary globals for OpenAI client
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
          
          global.FormData.prototype.append = function(key, value) {
            this._data.push([key, value]);
          };
          
          global.FormData.prototype.entries = function() {
            return this._data[Symbol.iterator]();
          };
          
          global.FormData.prototype.toString = function() {
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
    
    const OpenAI = require("openai");
    
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "missing-key",
      // Only pass fetch if it's available and valid
      ...(fetchImpl ? { fetch: fetchImpl } : {})
    });
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Respond with exactly: 'API test successful'" }
      ],
      max_tokens: 20
    });
    
    res.json({
      status: "success",
      message: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});