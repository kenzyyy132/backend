const jwt = require("jsonwebtoken");

const User = require("../models/user-model");
const ApiError = require("../utils/api-error");
const asyncHandler = require("../utils/async-handler");


const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    throw ApiError.unauthorized(
      "Not authenticated. Send an 'Authorization: Bearer <token>' header."
    );
  }

  const token = header.split(" ")[1];

  if (!token) {
    throw ApiError.unauthorized("Not authenticated. Token is missing.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Your session has expired. Please log in again.");
    }
    throw ApiError.unauthorized("Invalid authentication token.");
  }

 
  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.unauthorized("The user belonging to this token no longer exists.");
  }

  if (!user.active) {
    throw ApiError.unauthorized("This account has been deactivated.");
  }

  req.user = user;
  next();
});


const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized("Not authenticated."));
  }

  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(
        `Access denied. This route requires one of the following roles: ${roles.join(", ")}.`
      )
    );
  }

  next();
};

module.exports = { protect, authorize };
