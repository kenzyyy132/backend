const express = require("express");

const {
  createProduct,
  getProducts,
  getProductCategories,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product-controllers");
const { protect, authorize } = require("../middleware/auth-middleware");
const { uploadSingleImage } = require("../middleware/upload-middleware");
const validate = require("../middleware/validate-middleware");
const {
  productIdRule,
  createProductRules,
  updateProductRules,
  listProductsRules,
} = require("../validators/product-validators");

const router = express.Router();

const adminOnly = [protect, authorize("admin")];

// Literal path first so it is not captured by /:id.
router.get("/categories", getProductCategories);

router
  .route("/")
  .get(listProductsRules, validate, getProducts)
  .post(
    ...adminOnly,
    uploadSingleImage("image"),
    createProductRules,
    validate,
    createProduct
  );

router
  .route("/:id")
  .get(productIdRule, validate, getProductById)
  .put(...adminOnly, uploadSingleImage("image"), updateProductRules, validate, updateProduct)
 
  .patch(...adminOnly, uploadSingleImage("image"), updateProductRules, validate, updateProduct)
  .delete(...adminOnly, productIdRule, validate, deleteProduct);

module.exports = router;
