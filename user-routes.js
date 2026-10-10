const express = require("express");

const {
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} = require("../controllers/user-controllers");
const { protect, authorize } = require("../middleware/auth-middleware");
const { uploadSingleImage } = require("../middleware/upload-middleware");
const validate = require("../middleware/validate-middleware");
const {
  mongoIdRule,
  updateMeRules,
  updateRoleRules,
} = require("../validators/user-validators");

const router = express.Router();

router.use(protect);

router
  .route("/me")
  .get(getMyProfile)
  .put(uploadSingleImage("image"), updateMeRules, validate, updateMyProfile)
  .patch(uploadSingleImage("image"), updateMeRules, validate, updateMyProfile)
  .delete(deleteMyProfile);

router.get("/me/wishlist", getMyWishlist);

router
  .route("/me/wishlist/:productId")
  .post(mongoIdRule("productId"), validate, addToWishlist)
  .delete(mongoIdRule("productId"), validate, removeFromWishlist);

router.use(authorize("admin"));

router.get("/", getUsers);

router.get("/:id", mongoIdRule("id"), validate, getUserById);

router.patch("/:id/role", updateRoleRules, validate, updateUserRole);

router.delete("/:id", mongoIdRule("id"), validate, deleteUser);

module.exports = router;
