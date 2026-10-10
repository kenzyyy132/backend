const { body, param, query } = require("express-validator");

const { PRODUCT_CATEGORIES } = require("../models/product-model");

const productIdRule = [
  param("id").isMongoId().withMessage("'id' must be a valid MongoDB ObjectId"),
];

const createProductRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Product name must be between 2 and 120 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Product description must be between 10 and 2000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Product price is required")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Product category is required")
    .bail()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`),

  body("brand")
    .trim()
    .notEmpty()
    .withMessage("Product brand is required")
    .isLength({ max: 80 })
    .withMessage("Brand cannot exceed 80 characters"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a whole number greater than or equal to 0")
    .toInt(),
];

const updateProductRules = [
  ...productIdRule,

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Product name must be between 2 and 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Product description must be between 10 and 2000 characters"),

  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat(),

  body("category")
    .optional()
    .trim()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`Category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`),

  body("brand")
    .optional()
    .trim()
    .isLength({ min: 1, max: 80 })
    .withMessage("Brand cannot exceed 80 characters"),

  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a whole number greater than or equal to 0")
    .toInt(),
];

const listProductsRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1").toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),

  query("category")
    .optional()
    .trim()
    .isIn(PRODUCT_CATEGORIES)
    .withMessage(`category must be one of: ${PRODUCT_CATEGORIES.join(", ")}`),

  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be a number >= 0")
    .toFloat(),

  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be a number >= 0")
    .toFloat(),

  query("inStock")
    .optional()
    .isBoolean()
    .withMessage("inStock must be true or false")
    .toBoolean(),
];

module.exports = {
  productIdRule,
  createProductRules,
  updateProductRules,
  listProductsRules,
};
