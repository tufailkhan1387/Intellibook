const { verify } = require("jsonwebtoken");
const ApiResponse = require("../helper/ApiResponse");
const { BlackList, user } = require("../models");

const validateToken = async (req, res, next) => {
  const accessToken = req.header("accessToken");

  if (!accessToken) {
    const response = ApiResponse("0", "User not loggedIn!", {});
    return res.json(response);
  }

  try {
    const validToken = verify(accessToken, process.env.JWT_ACCESS_SECRET);
    req.user = validToken;

    const userData = await user.findOne({ where: { id: req.user.id } });
    if (!userData) {
      const response = ApiResponse("0", "User not found!", {});
      return res.json(response);
    }

    // No userType check — allow all authenticated users
    return next();
  } catch (error) {
    console.log(error)
    const response = ApiResponse("0", "Invalid or expired token!", {});
    return res.json(response);
  }
};

module.exports = { validateToken };
