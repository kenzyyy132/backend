const { body, param } = require("express-validator");

const { USER_ROLES } = require("../models/user-model");

const mongoIdRule = (name = "id") => [
  param(name).isMongoId().withMessage(`'${name}' must be a valid MongoDB ObjectId`),
];

const updateMeRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2 and 60 characters"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail({ gmail_remove_dots: false }),

  body("password")
    .optional()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  body("phone")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Phone cannot exceed 30 characters"),

  body("address.street").optional().trim().isLength({ max: 120 }),
  body("address.city").optional().trim().isLength({ max: 80 }),
  body("address.country").optional().trim().isLength({ max: 80 }),
  body("address.postalCode").optional().trim().isLength({ max: 20 }),

  body("role")
    .not()
    .exists()
    .withMessage(
      "Role cannot be changed here. Only an admin can change roles via PATCH /api/v1/users/:id/role"
    ),
];

const updateRoleRules = [
  ...mongoIdRule("id"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isIn(USER_ROLES)
    .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}`),
];

module.exports = { mongoIdRule, updateMeRules, updateRoleRules };
