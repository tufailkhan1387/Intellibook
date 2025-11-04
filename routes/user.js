const express = require('express');
const router = express.Router(); // ✅ Use Router() instead of express()
const multer = require('multer');
const path = require('path');
const userController = require("../controllers/userController");
const incomeController = require("../controllers/incomeController");
const asyncMiddleware = require("../middlewares/async");

// Middleware to parse JSON bodies
router.use(express.json());

// Routes
router.post("/categorizeData", asyncMiddleware(userController.categorizeData));
router.post("/storeIncomeSource", asyncMiddleware(incomeController.storeIncomeSource));
router.get("/getAllincomeSource", asyncMiddleware(incomeController.getAllincomeSource));

module.exports = router;
