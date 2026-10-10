const User = require("../models/user-model");
const Product = require("../models/product-model");
const ApiError = require("../utils/api-error");
const asyncHandler = require("../utils/async-handler");
const { removeUploadedFile } = require("../middleware/upload-middleware");



const getMyProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ status: "success", data: req.user });
});


const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found.");

  if (email && email !== user.email) {
    const taken = await User.findOne({ email });
    if (taken) throw ApiError.conflict("An account with this email already exists.");
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;

  if (address) {
    
    user.address = { ...user.address.toObject(), ...address };
  }

 
  if (password) user.password = password;

  if (req.file) {
    const previousImage = user.image;
    user.image = `/uploads/${req.file.filename}`;
    removeUploadedFile(previousImage);
  }

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: user,
  });
});


const deleteMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound("User not found.");

  user.active = false;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Your account has been deactivated.",
  });
});


const getMyWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "wishlist",
    select: "name price category brand image stock",
  });

  res.status(200).json({
    status: "success",
    results: user.wishlist.length,
    data: user.wishlist,
  });
});


const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  
  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound("Product not found");

  const user = await User.findById(req.user._id);

  if (user.wishlist.some((id) => id.toString() === productId)) {
    throw ApiError.conflict("This product is already in your wishlist.");
  }

  user.wishlist.push(productId);
  await user.save({ validateBeforeSave: false });

  await user.populate({ path: "wishlist", select: "name price image" });

  res.status(200).json({
    status: "success",
    message: "Product added to your wishlist",
    results: user.wishlist.length,
    data: user.wishlist,
  });
});


const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);

  const before = user.wishlist.length;
  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);

  if (user.wishlist.length === before) {
    throw ApiError.notFound("This product is not in your wishlist.");
  }

  await user.save({ validateBeforeSave: false });
  await user.populate({ path: "wishlist", select: "name price image" });

  res.status(200).json({
    status: "success",
    message: "Product removed from your wishlist",
    results: user.wishlist.length,
    data: user.wishlist,
  });
});

/* ------------------------------------------------------------------ */
/* Admin only                                                           */
/* ------------------------------------------------------------------ */


const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.active !== undefined) filter.active = req.query.active === "true";
  if (req.query.search) {
    const term = new RegExp(req.query.search.trim(), "i");
    filter.$or = [{ name: term }, { email: term }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    results: users.length,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    data: users,
  });
});


const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found.");

  res.status(200).json({ status: "success", data: user });
});


const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  // Without this an admin could lock themselves out of the admin area.
  if (req.params.id === req.user._id.toString() && role !== req.user.role) {
    throw ApiError.badRequest("You cannot change your own role.");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found.");

  user.role = role;
  await user.save();

  res.status(200).json({
    status: "success",
    message: `Role updated to '${role}'.`,
    data: user,
  });
});


const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest("You cannot delete your own admin account.");
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound("User not found.");

  removeUploadedFile(user.image);

  res.status(200).json({
    status: "success",
    message: "User deleted successfully.",
    data: user,
  });
});

module.exports = {
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
};
