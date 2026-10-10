const ApiError = require("../utils/api-error");
const { removeUploadedFile } = require("./upload-middleware");


const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};


const errorHandler = (err, req, res, next) => {
 
  if (req.file) removeUploadedFile(`/uploads/${req.file.filename}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errors;

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: '${err.value}' is not a valid identifier.`;
  }


  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || { field: "" })[0];
    message =
      field === "email"
        ? "An account with this email already exists."
        : `Duplicate value for '${field}'.`;
  }


  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON.";
  }


  const isUnexpected = statusCode >= 500;
  if (isUnexpected) {
    console.error("Unhandled error:", err);
    if (process.env.NODE_ENV === "production") {
      message = "Something went wrong. Please try again later.";
    }
  }

  const body = { status: "error", message };
  if (errors) body.errors = errors;
  if (err.details) body.errors = err.details;
  if (process.env.NODE_ENV !== "production" && isUnexpected) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
