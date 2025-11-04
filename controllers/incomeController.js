require("dotenv").config();

const {
    incomesource

} = require("../models");
const ApiResponse = require("../helper/ApiResponse");

async function storeIncomeSource(req, res) {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.json(ApiResponse("0", "No income source data provided", {}));
    }

    // Use bulkCreate for better performance
    await incomesource.bulkCreate(
      data.map(dd => ({
        incomeType: dd.incomeType,
        fromAmount: dd.fromAmount,
        subType:dd.subType,
        toAmount: dd.toAmount,
        currency: dd.currency,
        userId: dd.userId,
      }))
    );

    return res.json(ApiResponse("1", "Income sources added successfully", {}));
  } catch (error) {
    console.error("Error in storeIncomeSource:", error);
    return res.json(ApiResponse("0", "Something went wrong", { error: error.message }));
  }
}

async function getAllincomeSource(req,res){
  let sources = await incomesource.findAll({});
  return res.json(ApiResponse("1","Income Sources",{}));
}

module.exports = {
    storeIncomeSource,
    getAllincomeSource

}