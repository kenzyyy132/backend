const { validationResult } = require("express-validator");

const { removeUploadedFile } = require("./upload-middleware");


const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  if (req.file) removeUploadedFile(`/uploads/${req.file.filename}`);

  res.status(400).json({
    status: "error",
    message: "Validation failed",
    errors: errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    })),
  });
};

module.exports = validate;
